import request from "supertest";

jest.mock("../services/user.service", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshAuthTokens: jest.fn(),
  logoutUser: jest.fn(),
  confirmSignup: jest.fn(),
  confirmPasswordChange: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  changePassword: jest.fn(),
}));

import app from "../server";
import {
  confirmPasswordChange,
  confirmSignup,
  loginUser,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "../services/user.service";

const mockedRegisterUser = jest.mocked(registerUser);
const mockedLoginUser = jest.mocked(loginUser);
const mockedRefreshAuthTokens = jest.mocked(refreshAuthTokens);
const mockedLogoutUser = jest.mocked(logoutUser);
const mockedConfirmSignup = jest.mocked(confirmSignup);
const mockedConfirmPasswordChange = jest.mocked(confirmPasswordChange);
const mockedRequestPasswordReset = jest.mocked(requestPasswordReset);
const mockedResetPassword = jest.mocked(resetPassword);

const accessSecret = process.env.JWT_ACCESS_SECRET || "default_access_secret";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = accessSecret;
    process.env.JWT_REFRESH_SECRET = refreshSecret;
  });

  it("POST /api/v1/auth/register returns verify-email response", async () => {
    mockedRegisterUser.mockResolvedValue({
      user: {
        id: "user-1",
        username: "alice",
        email: "alice@example.com",
        role: "USER",
        profileVisibility: "PUBLIC",
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: new Date("2026-05-24T00:00:00.000Z"),
      },
      message: "Please verify your email to continue",
    } as never);

    const response = await request(app).post("/api/v1/auth/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe(
      "Please verify your email to continue",
    );
    expect(mockedRegisterUser).toHaveBeenCalledWith({
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });
  });

  it("POST /api/v1/auth/login returns tokens only when verified", async () => {
    mockedLoginUser.mockResolvedValue({
      user: {
        id: "user-1",
        username: "alice",
        email: "alice@example.com",
        role: "USER",
        profileVisibility: "PUBLIC",
        emailVerified: true,
        emailVerifiedAt: new Date("2026-05-24T00:00:00.000Z"),
        createdAt: new Date("2026-05-24T00:00:00.000Z"),
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    } as never);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.data.tokens).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("POST /api/v1/auth/refresh returns rotated tokens", async () => {
    mockedRefreshAuthTokens.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "old-refresh-token" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });

  it("POST /api/v1/auth/logout returns success", async () => {
    mockedLogoutUser.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: "old-refresh-token" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logged out");
  });

  it("POST /api/v1/auth/confirm verifies signup token", async () => {
    mockedConfirmSignup.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/confirm")
      .send({ token: "signup-token" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Email verified");
  });

  it("POST /api/v1/auth/confirm-change confirms password change", async () => {
    mockedConfirmPasswordChange.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/confirm-change")
      .send({ token: "change-token" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password updated");
  });

  it("POST /api/v1/auth/password/reset/request sends reset email flow", async () => {
    mockedRequestPasswordReset.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/password/reset/request")
      .send({ email: "alice@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If the email exists, a reset link was sent",
    );
  });

  it("POST /api/v1/auth/password/reset resets the password", async () => {
    mockedResetPassword.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: "reset-token", newPassword: "newpassword123" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password reset successfully");
  });
});
