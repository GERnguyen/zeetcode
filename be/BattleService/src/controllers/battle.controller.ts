import { NextFunction, Request, Response } from "express";
import { BattleFactory } from "../factories/battle.factory";
import { CreatePrivateRoomDto } from "../validators/battle.validator";
import { AuthenticatedRequest } from "../types/auth.types";
import { ForbiddenError } from "../utils/errors/app.error";

const battleService = BattleFactory.getBattleService();

export const createPrivateRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id as string;
    const payload = req.body as CreatePrivateRoomDto;

    const room = await battleService.createPrivateRoom(userId, payload);

    res.status(201).json({
      success: true,
      message: "Private room created",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const joinPrivateRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id as string;
    const roomId = req.params.roomId as string;

    const room = await battleService.joinPrivateRoom(userId, roomId);

    res.status(200).json({
      success: true,
      message: "Joined private room",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getBattleRoomHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id as string;
    const roomId = req.params.roomId as string;

    const room = await battleService.getRoomById(roomId);
    const isMember = room.players.some((player) => player.userId === userId);
    if (!isMember) {
      throw new ForbiddenError("Access denied");
    }

    res.status(200).json({
      success: true,
      message: "Battle room fetched",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentBattleStateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id as string;
    const state = await battleService.getCurrentState(userId);

    res.status(200).json({
      success: true,
      message: "Current battle state fetched",
      data: state,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBattleHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id as string;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const rooms = await battleService.getHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      message: "Battle history fetched",
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};
