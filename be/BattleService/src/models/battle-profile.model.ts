import mongoose, { Document } from "mongoose";

export interface IBattleProfile extends Document {
  userId: string;
  eloRating: number;
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  createdAt: Date;
  updatedAt: Date;
}

const BattleProfileSchema = new mongoose.Schema<IBattleProfile>(
  {
    userId: { type: String, required: true, unique: true },
    eloRating: { type: Number, required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, record: any) => {
        delete record.__v;
        record.id = record._id ? String(record._id) : record._id;
        delete record._id;
        return record;
      },
    },
  },
);

BattleProfileSchema.index({ userId: 1 }, { unique: true });

export const BattleProfile = mongoose.model<IBattleProfile>(
  "BattleProfile",
  BattleProfileSchema,
);
