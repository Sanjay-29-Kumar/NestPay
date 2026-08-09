import mongoose, { Schema, Document } from 'mongoose';

export enum RentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface IRent extends Document {
  organizationId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  billingPeriod: string; // Format: "YYYY-MM" e.g., "2026-08"
  baseAmount: number;
  previousOutstandingAmount: number;
  totalPayableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: RentStatus;
  dueDate: Date;
  adjustmentNotes?: string;
  isCarryForwardApproved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billingPeriod: {
      type: String,
      required: true, // e.g. "2026-08"
      index: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousOutstandingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RentStatus),
      default: RentStatus.UNPAID,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    adjustmentNotes: {
      type: String,
    },
    isCarryForwardApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rent record per tenant per unit per billing period in an organization
RentSchema.index(
  { organizationId: 1, unitId: 1, tenantId: 1, billingPeriod: 1 },
  { unique: true }
);

export const Rent = mongoose.model<IRent>('Rent', RentSchema);
