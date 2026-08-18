import mongoose from "mongoose";
import Payment, { PaymentStatus, IPayment } from "../../models/Payment.js";
import Organization from "../../models/Organization.js";
import Unit from "../../models/Unit.js";
import User from "../../models/User.js";
import razorpayProvider from "../../services/payment/razorpay.provider.js";
import invoiceService from "../invoice/invoice.service.js";

export interface InitiatePaymentDTO {
    orgId: string;
    unitId: string;
    tenantId: string;
    amount: number;
    billingMonth?: string;
}

export interface VerifyPaymentDTO {
    orgId: string;
    orderId: string;
    paymentId: string;
    signature: string;
    tenantId: string;
}

export interface ManualPaymentDTO {
    orgId: string;
    unitId: string;
    tenantId?: string;
    amount: number;
    billingMonth?: string;
    manualPaymentType: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
    manualNote?: string;
    paidDate?: string;
    markedById: string;
}

class PaymentsService {
    /**
     * Tenant initiates payment -> Creates Razorpay Order ID & Pending Payment record
     */
    async initiatePayment(dto: InitiatePaymentDTO) {
        const { orgId, unitId, tenantId, amount, billingMonth = "August 2026" } = dto;

        const org = await Organization.findById(orgId);
        if (!org) throw new Error("Organization not found.");

        const unit = await Unit.findById(unitId);
        if (!unit) throw new Error("Unit not found.");

        // Fetch custom Razorpay config if configured by Owner
        const rzpConfig = org.razorpayConfig;
        const keyId = rzpConfig?.keyId;
        const keySecret = rzpConfig?.keySecret;

        const receiptNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create Razorpay order
        const rzpOrder = await razorpayProvider.createOrder(
            {
                amount,
                currency: "INR",
                receipt: receiptNo,
                notes: {
                    orgId,
                    unitId,
                    unitNumber: unit.unitNumber,
                    billingMonth,
                },
            },
            keyId,
            keySecret
        );

        // Save pending payment record in DB
        const payment = await Payment.create({
            organizationId: orgId,
            unitId,
            tenantId,
            amount,
            currency: "INR",
            paymentMode: "APP",
            paymentProvider: "razorpay",
            providerOrderId: rzpOrder.orderId,
            paymentStatus: PaymentStatus.PENDING,
            receiptNo,
            invoiceMonth: billingMonth,
            notes: `Rent demand for Unit ${unit.unitNumber} (${billingMonth})`,
        });

        return {
            orderId: rzpOrder.orderId,
            amount: rzpOrder.amount, // in paise
            currency: rzpOrder.currency || "INR",
            keyId: razorpayProvider.getKeyId(keyId),
            receiptNo,
            paymentId: payment._id,
        };
    }

    /**
     * Server-side verification of Razorpay HMAC Signature
     */
    async verifyPayment(dto: VerifyPaymentDTO) {
        const { orgId, orderId, paymentId, signature } = dto;

        const org = await Organization.findById(orgId);
        const keySecret = org?.razorpayConfig?.keySecret;

        // Verify HMAC signature
        const isValid = razorpayProvider.verifyPaymentSignature(
            { orderId, paymentId, signature },
            keySecret
        );

        if (!isValid) {
            await Payment.findOneAndUpdate(
                { providerOrderId: orderId },
                { paymentStatus: PaymentStatus.FAILED }
            );
            throw new Error("Invalid Razorpay payment signature. Verification failed.");
        }

        // Idempotent payment processing
        const payment = await Payment.findOne({ providerOrderId: orderId });
        if (!payment) {
            throw new Error("Payment record not found for order ID.");
        }

        if (payment.paymentStatus === PaymentStatus.PAID_APP || payment.paymentStatus === PaymentStatus.SUCCESS) {
            return {
                payment,
                message: "Payment already processed and verified.",
            };
        }

        // Update payment record to PAID_APP
        payment.providerPaymentId = paymentId;
        payment.providerSignature = signature;
        payment.paymentStatus = PaymentStatus.PAID_APP;
        payment.paidDate = new Date();
        await payment.save();

        // Converge onto invoice payment completion pipeline (updates invoice status, stops reminders, fires confirmation dispatch & logs)
        await invoiceService.processPaymentCompletion(
            payment.organizationId.toString(),
            payment.unitId.toString(),
            "APP",
            payment.amount,
            payment.notes,
            payment._id.toString()
        ).catch(() => {});

        return {
            payment,
            message: "Payment verified and recorded successfully via Razorpay!",
        };
    }

    /**
     * Razorpay Webhook Handler (payment.captured event)
     */
    async handleWebhook(eventData: any, rawBody: string, signature: string) {
        const event = eventData?.event;
        const payload = eventData?.payload?.payment?.entity;

        if (event === "payment.captured" || event === "order.paid") {
            const orderId = payload?.order_id;
            const paymentId = payload?.id;

            if (!orderId) return { processed: false, reason: "No order ID in payload" };

            const payment = await Payment.findOne({ providerOrderId: orderId });
            if (!payment) return { processed: false, reason: "Payment record not found" };

            // Idempotency check: if already paid, skip double processing
            if (payment.paymentStatus === PaymentStatus.PAID_APP || payment.paymentStatus === PaymentStatus.SUCCESS) {
                return { processed: true, message: "Already processed via idempotency check" };
            }

            payment.providerPaymentId = paymentId || payment.providerPaymentId;
            payment.paymentStatus = PaymentStatus.PAID_APP;
            payment.paidDate = new Date();
            await payment.save();

            await invoiceService.processPaymentCompletion(
                payment.organizationId.toString(),
                payment.unitId.toString(),
                "APP",
                payment.amount,
                payment.notes,
                payment._id.toString()
            ).catch(() => {});

            return { processed: true, message: "Webhook successfully recorded payment capture" };
        }

        return { processed: false, reason: "Unhandled event type" };
    }

    /**
     * Owner / Admin Marks Payment Manually (Offline Cash / Bank Transfer / UPI / Cheque)
     */
    async markManualPayment(dto: ManualPaymentDTO) {
        const { orgId, unitId, tenantId, amount, billingMonth = "August 2026", manualPaymentType, manualNote, paidDate, markedById } = dto;

        const unit = await Unit.findById(unitId);
        if (!unit) throw new Error("Unit not found.");

        const receiptNo = `REC-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const actualTenantId = tenantId || (unit as any).assignedTenantId || markedById;

        const payment = await Payment.create({
            organizationId: orgId,
            unitId,
            tenantId: actualTenantId,
            amount,
            currency: "INR",
            paymentMode: "MANUAL",
            paymentStatus: PaymentStatus.PAID_MANUAL,
            manualPaymentType,
            manualNote: manualNote || `Marked manually as paid by owner/admin.`,
            markedBy: markedById,
            markedAt: new Date(),
            paidDate: paidDate ? new Date(paidDate) : new Date(),
            receiptNo,
            invoiceMonth: billingMonth,
            notes: manualNote,
        });

        return payment;
    }

    /**
     * Owner / Admin Undo Manual Payment
     */
    async undoManualPayment(paymentId: string, orgId: string) {
        const payment = await Payment.findOne({ _id: paymentId, organizationId: orgId });
        if (!payment) throw new Error("Payment record not found.");

        if (payment.paymentStatus !== PaymentStatus.PAID_MANUAL) {
            throw new Error("Only manual payments can be undone.");
        }

        payment.paymentStatus = PaymentStatus.CANCELLED;
        await payment.save();

        return payment;
    }

    /**
     * Get Payment History Log for Organization / Unit
     */
    async getPaymentHistory(orgId: string, unitId?: string, tenantId?: string) {
        const query: any = { organizationId: orgId };
        if (unitId) query.unitId = unitId;
        if (tenantId) query.tenantId = tenantId;

        const history = await Payment.find(query)
            .populate("markedBy", "name email")
            .populate("tenantId", "name email phone")
            .sort({ createdAt: -1 });

        return history;
    }

    /**
     * Update Owner Razorpay credentials
     */
    async updateOwnerRazorpayConfig(orgId: string, keyId: string, keySecret: string) {
        const org = await Organization.findById(orgId);
        if (!org) throw new Error("Organization not found.");

        org.razorpayConfig = {
            keyId: keyId.trim(),
            keySecret: keySecret.trim(),
            isConfigured: Boolean(keyId && keySecret),
        };

        await org.save();
        return org;
    }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
