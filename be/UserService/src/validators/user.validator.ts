import { z } from "zod";

const emailSchema = z.string().trim().email("Email không hợp lệ");
const usernameSchema = z.string().trim().min(3, "Username tối thiểu 3 ký tự");
const passwordSchema = z.string().min(6, "Mật khẩu tối thiểu 6 ký tự");

export const registerUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    profileVisibility: z
      .enum(["PUBLIC", "FOLLOWERS_ONLY", "PRIVATE"])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["newPassword"],
  });

export const followUserSchema = z.object({
  followingId: z.string().uuid("followingId không hợp lệ"),
});

export const unfollowUserSchema = z.object({
  followingId: z.string().uuid("followingId không hợp lệ"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listFollowersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken không hợp lệ"),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  newPassword: passwordSchema,
});

export const confirmPasswordChangeSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
});

export const confirmSignupSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
export type LoginUserDto = z.infer<typeof loginUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type FollowUserDto = z.infer<typeof followUserSchema>;
export type UnfollowUserDto = z.infer<typeof unfollowUserSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type ListFollowersQueryDto = z.infer<typeof listFollowersQuerySchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type RequestPasswordResetDto = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ConfirmPasswordChangeDto = z.infer<
  typeof confirmPasswordChangeSchema
>;
export type ConfirmSignupDto = z.infer<typeof confirmSignupSchema>;
