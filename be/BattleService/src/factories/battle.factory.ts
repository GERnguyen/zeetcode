import { BattleProfileRepository } from "../repositories/battle-profile.repository";
import { BattleRoomRepository } from "../repositories/battle-room.repository";
import { BattleService } from "../services/battle.service";

export class BattleFactory {
  private static battleProfileRepository: BattleProfileRepository;
  private static battleRoomRepository: BattleRoomRepository;
  private static battleService: BattleService;

  static getBattleProfileRepository(): BattleProfileRepository {
    if (!this.battleProfileRepository) {
      this.battleProfileRepository = new BattleProfileRepository();
    }
    return this.battleProfileRepository;
  }

  static getBattleRoomRepository(): BattleRoomRepository {
    if (!this.battleRoomRepository) {
      this.battleRoomRepository = new BattleRoomRepository();
    }
    return this.battleRoomRepository;
  }

  static getBattleService(): BattleService {
    if (!this.battleService) {
      this.battleService = new BattleService(
        this.getBattleProfileRepository(),
        this.getBattleRoomRepository(),
      );
    }
    return this.battleService;
  }
}
