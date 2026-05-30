import { prisma } from "../config/db.config";
import logger from "../config/logger.config";
import { ConflictError, InternalServerError } from "../utils/errors/app.error";
import { Prisma, User } from "../generated/prisma/client";

export interface ListUsersOptions {
  skip?: number;
  take?: number;
}

export type UserPublic = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;

const userPublicSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  profileVisibility: true,
  eloRating: true,
  createdAt: true,
};

const sanitizeUserCreateLog = (data: Prisma.UserCreateInput) => ({
  email: data.email,
  username: data.username,
  role: data.role,
  profileVisibility: data.profileVisibility,
});

const isPrismaKnownError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

const isRecordNotFound = (error: unknown) =>
  isPrismaKnownError(error) && error.code === "P2025";

const isUniqueConstraint = (error: unknown) =>
  isPrismaKnownError(error) && error.code === "P2002";

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      throw new ConflictError("User already exists");
    }
    logger.error("Failed to create user", {
      error,
      data: sanitizeUserCreateLog(data),
    });
    throw new InternalServerError("Failed to create user");
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    logger.error("Failed to find user by id", { error, id });
    throw new InternalServerError("Failed to find user by id");
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    logger.error("Failed to find user by email", { error, email });
    throw new InternalServerError("Failed to find user by email");
  }
}

export async function listUsers(
  options: ListUsersOptions = {},
): Promise<User[]> {
  const { skip = 0, take = 20 } = options;
  try {
    return await prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("Failed to list users", { error, skip, take });
    throw new InternalServerError("Failed to list users");
  }
}

export async function updateUserById(
  id: string,
  data: Prisma.UserUpdateInput,
): Promise<User | null> {
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return null;
    }
    if (isUniqueConstraint(error)) {
      throw new ConflictError("User already exists");
    }
    logger.error("Failed to update user", { error, id });
    throw new InternalServerError("Failed to update user");
  }
}

export async function getUserEloById(
  id: string,
): Promise<{ id: string; username: string; eloRating: number } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, eloRating: true },
    });
    return user;
  } catch (error) {
    logger.error("Failed to get user elo", { error, id });
    throw new InternalServerError("Failed to get user elo");
  }
}

export async function updateUserEloById(
  id: string,
  delta: number,
): Promise<{ id: string; eloRating: number } | null> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { eloRating: { increment: delta } },
      select: { id: true, eloRating: true },
    });
    return user;
  } catch (error) {
    if (isRecordNotFound(error)) {
      return null;
    }
    logger.error("Failed to update user elo", { error, id, delta });
    throw new InternalServerError("Failed to update user elo");
  }
}

export async function deleteUserById(id: string): Promise<User | null> {
  try {
    return await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return null;
    }
    logger.error("Failed to delete user", { error, id });
    throw new InternalServerError("Failed to delete user");
  }
}
