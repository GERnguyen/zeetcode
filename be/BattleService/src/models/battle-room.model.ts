import mongoose, { Document } from "mongoose";

export type BattleMode = "RANKED" | "PRIVATE";
export type BattleStatus =
  | "WAITING"
  | "READY"
  | "ACTIVE"
  | "FINISHED"
  | "CANCELED";
export type BattleResult = "WIN" | "LOSS" | "DRAW";
export type BattleDifficulty = "easy" | "medium" | "hard";
export type SubmissionVerdict =
  | "AC"
  | "WA"
  | "TLE"
  | "MLE"
  | "RE"
  | "CE"
  | "PE";

export interface IBattleProblem {
  id: string;
  title: string;
  difficulty: BattleDifficulty;
}

export interface IBattlePlayer {
  userId: string;
  username?: string;
  joinedAt: Date;
  leftAt?: Date;
  hasLeft?: boolean;
  bestRuntimeMs?: number;
  lastVerdict?: SubmissionVerdict | null;
  lastSubmissionId?: string;
  lastSubmittedAt?: Date;
  result?: BattleResult;
  eloBefore?: number;
  eloAfter?: number;
  eloDelta?: number;
}

export interface IBattleRoom extends Document {
  id: string;
  mode: BattleMode;
  status: BattleStatus;
  difficulty: BattleDifficulty;
  timerSeconds: number;
  roomCode?: string;
  inviteCode?: string;
  ownerId?: string;
  problem?: IBattleProblem;
  players: IBattlePlayer[];
  startedAt?: Date;
  endsAt?: Date;
  endedAt?: Date;
  winnerUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const BattlePlayerSchema = new mongoose.Schema<IBattlePlayer>(
  {
    userId: { type: String, required: true },
    username: { type: String, default: undefined },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: undefined },
    hasLeft: { type: Boolean, default: false },
    bestRuntimeMs: { type: Number, default: undefined },
    lastVerdict: { type: String, default: undefined },
    lastSubmissionId: { type: String, default: undefined },
    lastSubmittedAt: { type: Date, default: undefined },
    result: { type: String, default: undefined },
    eloBefore: { type: Number, default: undefined },
    eloAfter: { type: Number, default: undefined },
    eloDelta: { type: Number, default: undefined },
  },
  { _id: false },
);

const BattleRoomSchema = new mongoose.Schema<IBattleRoom>(
  {
    mode: { type: String, required: true },
    status: { type: String, required: true },
    difficulty: { type: String, required: true },
    timerSeconds: { type: Number, required: true },
    roomCode: { type: String, default: undefined },
    inviteCode: { type: String, default: undefined },
    ownerId: { type: String, default: undefined },
    problem: {
      id: { type: String, default: undefined },
      title: { type: String, default: undefined },
      difficulty: { type: String, default: undefined },
    },
    players: { type: [BattlePlayerSchema], default: [] },
    startedAt: { type: Date, default: undefined },
    endsAt: { type: Date, default: undefined },
    endedAt: { type: Date, default: undefined },
    winnerUserId: { type: String, default: undefined },
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

BattleRoomSchema.index({ mode: 1, status: 1 });
BattleRoomSchema.index({ "players.userId": 1, endedAt: -1 });
BattleRoomSchema.index({ roomCode: 1 }, { unique: true, sparse: true });
BattleRoomSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

export const BattleRoom = mongoose.model<IBattleRoom>(
  "BattleRoom",
  BattleRoomSchema,
);
