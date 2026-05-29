import { BattleRoomRepository } from "../repositories/battle-room.repository";
import { BattleService } from "../services/battle.service";

export class BattleFactory {
  private static battleRoomRepository: BattleRoomRepository;
  private static battleService: BattleService;

  static getBattleRoomRepository(): BattleRoomRepository {
    if (!this.battleRoomRepository) {
      this.battleRoomRepository = new BattleRoomRepository();
    }
    return this.battleRoomRepository;
  }

  static getBattleService(): BattleService {
    if (!this.battleService) {
      this.battleService = new BattleService(this.getBattleRoomRepository());
    }
    return this.battleService;
  }
}
