import mongoose from "mongoose";
import { BattleRoom, IBattleRoom } from "../models/battle-room.model";

export class BattleRoomRepository {
  async createRoom(payload: Partial<IBattleRoom>): Promise<IBattleRoom> {
    return BattleRoom.create(payload);
  }

  async findById(roomId: string): Promise<IBattleRoom | null> {
    return BattleRoom.findById(roomId);
  }

  async findByIdOrCode(roomIdOrCode: string): Promise<IBattleRoom | null> {
    if (mongoose.Types.ObjectId.isValid(roomIdOrCode)) {
      const room = await BattleRoom.findById(roomIdOrCode);
      if (room) return room;
    }

    return BattleRoom.findOne({ roomCode: roomIdOrCode.toUpperCase() });
  }

  async findByRoomCode(roomCode: string): Promise<IBattleRoom | null> {
    return BattleRoom.findOne({ roomCode: roomCode.toUpperCase() });
  }

  async findOpenRoomByUserId(userId: string): Promise<IBattleRoom | null> {
    return BattleRoom.findOne({
      status: { $in: ["WAITING", "READY", "ACTIVE"] },
      players: {
        $elemMatch: {
          userId,
          hasLeft: { $ne: true },
        },
      },
    }).sort({ createdAt: -1 });
  }

  async findByInviteCode(inviteCode: string): Promise<IBattleRoom | null> {
    return BattleRoom.findOne({ inviteCode });
  }

  async findHistoryByUserId(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<IBattleRoom[]> {
    return BattleRoom.find({
      "players.userId": userId,
      status: "FINISHED",
    })
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}
