import { Schema, model, Document, Types } from "mongoose";

export interface IReminderSchedule extends Document {
    organizationId: Types.ObjectId;
    unitId: Types.ObjectId;
    primaryTenantDays: number[];
    allTenantsDays: number[];
    isCustom: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reminderScheduleSchema = new Schema<IReminderSchedule>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
            unique: true,
            index: true,
        },
        primaryTenantDays: {
            type: [Number],
            default: [1, 10, 15],
        },
        allTenantsDays: {
            type: [Number],
            default: [10, 15],
        },
        isCustom: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const ReminderSchedule = model<IReminderSchedule>("ReminderSchedule", reminderScheduleSchema);
export default ReminderSchedule;
