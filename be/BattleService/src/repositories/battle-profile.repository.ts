import { BattleProfile, IBattleProfile } from "../models/battle-profile.model";

export class BattleProfileRepository {
  async findByUserId(userId: string): Promise<IBattleProfile | null> {
    return BattleProfile.findOne({ userId });
  }

  async createProfile(payload: {
    userId: string;
    eloRating: number;
  }): Promise<IBattleProfile> {
    return BattleProfile.create({
      userId: payload.userId,
      eloRating: payload.eloRating,
    });
  }

  async updateByUserId(
    userId: string,
    payload: Partial<IBattleProfile>,
  ): Promise<IBattleProfile | null> {
    return BattleProfile.findOneAndUpdate({ userId }, payload, { new: true });
  }
}
