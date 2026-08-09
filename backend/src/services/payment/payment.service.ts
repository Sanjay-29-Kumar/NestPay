import mongoose from 'mongoose';
import { Rent, IRent, RentStatus } from '../../models/Rent.js';
import { Payment, IPayment, PaymentStatus } from '../../models/Payment.js';
import Notification from '../../models/Notification.js';
import { razorpayProvider } from './razorpay.provider.js';



export interface CreateRentDTO {
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  billingPeriod: string; // "YYYY-MM"
  baseAmount: number;
  dueDate: Date;
  adjustmentNotes?: string;
}

export interface CarryForwardDTO {
  rentId: string;
  organizationId: string;
  nextBillingPeriod: string; // "YYYY-MM"
  dueDate: Date;
}

export interface InitiatePaymentDTO {
  rentId: string;
  tenantId: string;
  payAmount: number; // Requested payment amount by tenant
}

export interface VerifyPaymentDTO {
  orderId: string;
  paymentId: string;
  signature: string;
  tenantId: string;
}

class PaymentService {
  /**
   * Owner/Admin creates or updates a rent obligation for a tenant for a specific billing period.
   */
  async createRentRecord(dto: CreateRentDTO): Promise<IRent> {
    // Check if rent record already exists for this period
    const existingRent = await Rent.findOne({
      organizationId: dto.organizationId,
      unitId: dto.unitId,
      tenantId: dto.tenantId,
      billingPeriod: dto.billingPeriod,
    });

    if (existingRent) {
      throw new Error(
        `A rent obligation for period "${dto.billingPeriod}" has already been issued for this unit/tenant.`
      );
    }

    // Check if previous period had outstanding balance

    const previousRent = await Rent.findOne({
      organizationId: dto.organizationId,
      unitId: dto.unitId,
      tenantId: dto.tenantId,
      status: { $in: [RentStatus.UNPAID, RentStatus.PARTIALLY_PAID, RentStatus.OVERDUE] },
    }).sort({ createdAt: -1 });

    const previousOutstandingAmount = previousRent ? previousRent.outstandingAmount : 0;
    const totalPayableAmount = dto.baseAmount + previousOutstandingAmount;

    const rent = await Rent.create({
      organizationId: dto.organizationId,
      propertyId: dto.propertyId,
      unitId: dto.unitId,
      tenantId: dto.tenantId,
      billingPeriod: dto.billingPeriod,
      baseAmount: dto.baseAmount,
      previousOutstandingAmount,
      totalPayableAmount,
      paidAmount: 0,
      outstandingAmount: totalPayableAmount,
      status: RentStatus.UNPAID,
      dueDate: dto.dueDate,
      adjustmentNotes: dto.adjustmentNotes,
    });

    return rent;
  }

  /**
   * Approves carrying forward outstanding balance from a prior rent period to a new billing period.
   */
  async carryForwardOutstanding(dto: CarryForwardDTO): Promise<IRent> {
    const sourceRent = await Rent.findById(dto.rentId);
    if (!sourceRent) {
      throw new Error('Source rent record not found');
    }

    if (sourceRent.organizationId.toString() !== dto.organizationId) {
      throw new Error('Unauthorized organization access');
    }

    if (sourceRent.outstandingAmount <= 0) {
      throw new Error('This rent record has no outstanding balance to carry forward');
    }

    // Mark carry forward as approved on source
    sourceRent.isCarryForwardApproved = true;
    await sourceRent.save();

    // Check if target next month rent exists
    let nextRent = await Rent.findOne({
      organizationId: dto.organizationId,
      unitId: sourceRent.unitId,
      tenantId: sourceRent.tenantId,
      billingPeriod: dto.nextBillingPeriod,
    });

    if (nextRent) {
      nextRent.previousOutstandingAmount = sourceRent.outstandingAmount;
      nextRent.totalPayableAmount = nextRent.baseAmount + nextRent.previousOutstandingAmount;
      nextRent.outstandingAmount = nextRent.totalPayableAmount - nextRent.paidAmount;
      await nextRent.save();
      return nextRent;
    } else {
      // Create next month rent with carried forward balance
      const newRent = await Rent.create({
        organizationId: dto.organizationId,
        propertyId: sourceRent.propertyId,
        unitId: sourceRent.unitId,
        tenantId: sourceRent.tenantId,
        billingPeriod: dto.nextBillingPeriod,
        baseAmount: sourceRent.baseAmount,
        previousOutstandingAmount: sourceRent.outstandingAmount,
        totalPayableAmount: sourceRent.baseAmount + sourceRent.outstandingAmount,
        paidAmount: 0,
        outstandingAmount: sourceRent.baseAmount + sourceRent.outstandingAmount,
        status: RentStatus.UNPAID,
        dueDate: dto.dueDate,
        adjustmentNotes: `Carried forward ₹${sourceRent.outstandingAmount} from period ${sourceRent.billingPeriod}`,
        isCarryForwardApproved: true,
      });
      // Notify tenant of updated payable amount
      try {
        await Notification.create({
          userId: sourceRent.tenantId,
          title: 'Rent Amount Carried Forward',
          message: `Your rent payable for period ${dto.nextBillingPeriod} is updated to ₹${(sourceRent.baseAmount + sourceRent.outstandingAmount).toLocaleString('en-IN')} (includes ₹${sourceRent.outstandingAmount.toLocaleString('en-IN')} carried forward from period ${sourceRent.billingPeriod}).`,
          type: 'SYSTEM',
          organizationId: sourceRent.organizationId,
          isRead: false,
        });
      } catch (err) {
        console.error('Failed sending carry forward notification:', err);
      }

      return newRent;
    }
  }


  /**
   * Initiates payment order via Razorpay.
   * STRICT SECURITY: Backend validates rent record, checks amount limits, enforces partial & overpayment rules.
   */
  async initiatePaymentOrder(dto: InitiatePaymentDTO) {
    const rent = await Rent.findById(dto.rentId);
    if (!rent) {
      throw new Error('Rent record not found');
    }

    if (rent.tenantId.toString() !== dto.tenantId) {
      throw new Error('Unauthorized: You do not own this rent obligation');
    }

    if (rent.outstandingAmount <= 0 || rent.status === RentStatus.PAID) {
      throw new Error('Rent is already fully paid');
    }

    // Overpayment check
    if (dto.payAmount > rent.outstandingAmount) {
      throw new Error(
        `Payment amount (₹${dto.payAmount}) exceeds current outstanding rent (₹${rent.outstandingAmount}). Overpayment requires explicit admin approval.`
      );
    }

    if (dto.payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const isPartialPayment = dto.payAmount < rent.outstandingAmount;
    const remainingOutstandingAfterPay = rent.outstandingAmount - dto.payAmount;

    // Generate unique receipt reference
    const receiptNo = `RCT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Call Razorpay Provider
    const orderResult = await razorpayProvider.createOrder({
      amount: dto.payAmount,
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        rentId: rent._id.toString(),
        tenantId: rent.tenantId.toString(),
        organizationId: rent.organizationId.toString(),
        billingPeriod: rent.billingPeriod,
      },
    });

    // Create pending payment record
    const payment = await Payment.create({
      organizationId: rent.organizationId,
      propertyId: rent.propertyId,
      unitId: rent.unitId,
      tenantId: rent.tenantId,
      rentId: rent._id,
      amount: dto.payAmount,
      currency: 'INR',
      paymentProvider: 'razorpay',
      providerOrderId: orderResult.orderId,
      paymentStatus: PaymentStatus.PENDING,
      receiptNo,
      notes: isPartialPayment
        ? `Partial payment. Outstanding after payment: ₹${remainingOutstandingAfterPay}`
        : 'Full payment order',
    });

    return {
      orderId: orderResult.orderId,
      amount: orderResult.amount, // in paise
      currency: orderResult.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      expectedRent: rent.totalPayableAmount,
      payAmount: dto.payAmount,
      outstandingAmount: rent.outstandingAmount,
      isPartialPayment,
      remainingOutstandingAfterPay,
    };
  }

  /**
   * Verifies payment cryptographic signature from Razorpay and updates database records.
   */
  async verifyAndProcessPayment(dto: VerifyPaymentDTO) {
    const isSignatureValid = razorpayProvider.verifyPaymentSignature({
      orderId: dto.orderId,
      paymentId: dto.paymentId,
      signature: dto.signature,
    });

    if (!isSignatureValid) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { providerOrderId: dto.orderId },
        { paymentStatus: PaymentStatus.FAILED }
      );
      throw new Error('Invalid Razorpay signature. Payment verification failed.');
    }

    const payment = await Payment.findOne({ providerOrderId: dto.orderId });
    if (!payment) {
      throw new Error('Payment record not found for this order ID');
    }

    if (payment.tenantId.toString() !== dto.tenantId) {
      throw new Error('Unauthorized tenant verification attempt');
    }

    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return { payment, message: 'Payment already processed successfully' };
    }

    // Update payment record
    payment.providerPaymentId = dto.paymentId;
    payment.providerSignature = dto.signature;
    payment.paymentStatus = PaymentStatus.SUCCESS;
    await payment.save();

    // Update rent record status and balances
    const rent = await Rent.findById(payment.rentId);
    if (rent) {
      rent.paidAmount += payment.amount;
      rent.outstandingAmount = Math.max(0, rent.totalPayableAmount - rent.paidAmount);

      if (rent.outstandingAmount === 0) {
        rent.status = RentStatus.PAID;
      } else {
        rent.status = RentStatus.PARTIALLY_PAID;
      }
      await rent.save();

      // Create automated system notification for tenant
      try {
        await Notification.create({
          userId: payment.tenantId,
          title: 'Rent Payment Successful',
          message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for period ${rent.billingPeriod} was verified successfully. Receipt: ${payment.receiptNo}. ${rent.outstandingAmount > 0 ? `Remaining balance: ₹${rent.outstandingAmount.toLocaleString('en-IN')}.` : 'Rent is fully paid.'}`,
          type: 'SYSTEM',
          organizationId: payment.organizationId,
          isRead: false,
        });
      } catch (notifErr) {
        console.error('Failed to create in-app notification:', notifErr);
      }
    }

    return {
      success: true,
      payment,
      rent,
    };
  }


  /**
   * Get Rents for an Organization (Filtered by Tenant if requested)
   */
  async getRents(organizationId: string, filter: { tenantId?: string; unitId?: string; status?: string }) {
    const query: any = { organizationId };
    if (filter.tenantId) query.tenantId = filter.tenantId;
    if (filter.unitId) query.unitId = filter.unitId;
    if (filter.status) query.status = filter.status;

    return Rent.find(query)
      .populate('propertyId', 'name address')
      .populate('unitId', 'unitNumber floor')
      .populate('tenantId', 'name email phone')
      .sort({ createdAt: -1 });
  }

  /**
   * Get Payment History for a Rent record or Organization
   */
  async getPaymentHistory(organizationId: string, filter: { tenantId?: string; rentId?: string }) {
    const query: any = { organizationId, paymentStatus: PaymentStatus.SUCCESS };
    if (filter.tenantId) query.tenantId = filter.tenantId;
    if (filter.rentId) query.rentId = filter.rentId;

    return Payment.find(query)
      .populate('propertyId', 'name')
      .populate('unitId', 'unitNumber')
      .populate('tenantId', 'name email')
      .populate('rentId', 'billingPeriod baseAmount totalPayableAmount outstandingAmount')
      .sort({ createdAt: -1 });
  }
}

export const paymentService = new PaymentService();
