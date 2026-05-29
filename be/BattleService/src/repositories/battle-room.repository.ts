import { BattleRoom, IBattleRoom } from "../models/battle-room.model";

export class BattleRoomRepository {
  async createRoom(payload: Partial<IBattleRoom>): Promise<IBattleRoom> {
    return BattleRoom.create(payload);
  }

  async findById(roomId: string): Promise<IBattleRoom | null> {
    return BattleRoom.findById(roomId);
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
