import axios from "axios";
import { BATTLE_API } from "./config";
import { authHeader } from "./http";
import type { BattleRoom, Difficulty } from "../../types/domain";

export type CurrentBattleState = {
  room: BattleRoom | null;
  isQueued: boolean;
};

export async function getMyBattleHistory(limit = 20) {
  const response = await axios.get<{ data: BattleRoom[] }>(
    `${BATTLE_API}/battles/me/history`,
    {
      headers: authHeader(),
      params: { limit },
    },
  );
  return response.data.data;
}

export async function getCurrentBattleState() {
  const response = await axios.get<{ data: CurrentBattleState }>(
    `${BATTLE_API}/battles/me/current`,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function getBattleRoom(roomId: string) {
  const response = await axios.get<{ data: BattleRoom }>(
    `${BATTLE_API}/battles/${roomId}`,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function createPrivateBattleRoom(payload: {
  difficulty: Difficulty;
  timerMinutes?: number;
}) {
  const response = await axios.post<{ data: BattleRoom }>(
    `${BATTLE_API}/battles/private`,
    payload,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function joinPrivateBattleRoom(payload: {
  roomId: string;
}) {
  const response = await axios.post<{ data: BattleRoom }>(
    `${BATTLE_API}/battles/private/${payload.roomId}/join`,
    {},
    { headers: authHeader() },
  );
  return response.data.data;
}
