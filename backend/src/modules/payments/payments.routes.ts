import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createRent,
  getRents,
  carryForwardRent,
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
} from './payments.controller.js';

const router = Router({ mergeParams: true });

// Organization & Rent Management Routes
router.post('/rents', authenticate, createRent);
router.get('/rents', authenticate, getRents);
router.post('/rents/carry-forward', authenticate, carryForwardRent);

// Payment Execution Routes (Razorpay integration)
router.post('/initiate', authenticate, initiatePayment);
router.post('/verify', authenticate, verifyPayment);
router.get('/history', authenticate, getPaymentHistory);

export default router;
