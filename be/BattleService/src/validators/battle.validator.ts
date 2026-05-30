import { z } from "zod";

export const createPrivateRoomSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  timerMinutes: z.coerce.number().int().min(5).max(180).optional(),
});

export const joinPrivateRoomSchema = z.object({
}).optional();

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePrivateRoomDto = z.infer<typeof createPrivateRoomSchema>;
export type JoinPrivateRoomDto = z.infer<typeof joinPrivateRoomSchema>;
export type HistoryQueryDto = z.infer<typeof historyQuerySchema>;
