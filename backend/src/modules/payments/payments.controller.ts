import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { paymentService } from '../../services/payment/payment.service.js';

// Owner/Admin creates a rent record
export async function createRent(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { propertyId, unitId, tenantId, billingPeriod, baseAmount, dueDate, adjustmentNotes } = req.body;

    const rent = await paymentService.createRentRecord({
      organizationId: orgId,
      propertyId,
      unitId,
      tenantId,
      billingPeriod,
      baseAmount: Number(baseAmount),
      dueDate: new Date(dueDate),
      adjustmentNotes,
    });

    return res.status(201).json({ success: true, rent });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Get rent records for organization / tenant
export async function getRents(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { tenantId, unitId, status } = req.query;

    const rents = await paymentService.getRents(orgId, {
      tenantId: tenantId as string | undefined,
      unitId: unitId as string | undefined,
      status: status as string | undefined,
    });

    return res.status(200).json({ success: true, rents });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Owner/Admin approves carrying forward outstanding balance
export async function carryForwardRent(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { rentId, nextBillingPeriod, dueDate } = req.body;

    const rent = await paymentService.carryForwardOutstanding({
      rentId,
      organizationId: orgId,
      nextBillingPeriod,
      dueDate: new Date(dueDate),
    });

    return res.status(200).json({ success: true, rent });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Tenant initiates payment order (Razorpay Order creation)
export async function initiatePayment(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rentId, payAmount } = req.body;

    const orderData = await paymentService.initiatePaymentOrder({
      rentId,
      tenantId: user.userId,
      payAmount: Number(payAmount),
    });

    return res.status(200).json({ success: true, ...orderData });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Tenant verifies payment signature after Razorpay checkout completion
export async function verifyPayment(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { orderId, paymentId, signature } = req.body;

    const result = await paymentService.verifyAndProcessPayment({
      orderId,
      paymentId,
      signature,
      tenantId: user.userId,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Get payment history log
export async function getPaymentHistory(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { tenantId, rentId } = req.query;

    const history = await paymentService.getPaymentHistory(orgId, {
      tenantId: tenantId as string | undefined,
      rentId: rentId as string | undefined,
    });

    return res.status(200).json({ success: true, history });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
