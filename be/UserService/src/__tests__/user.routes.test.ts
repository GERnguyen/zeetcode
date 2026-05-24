import request from "supertest";
import jwt from "jsonwebtoken";

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
  changePassword,
  getUserProfile,
  updateUserProfile,
} from "../services/user.service";

const mockedGetUserProfile = jest.mocked(getUserProfile);
const mockedUpdateUserProfile = jest.mocked(updateUserProfile);
const mockedChangePassword = jest.mocked(changePassword);

const accessSecret = process.env.JWT_ACCESS_SECRET || "default_access_secret";

const createAccessToken = (userId = "user-1", role = "USER") =>
  jwt.sign({ userId, role, type: "access" }, accessSecret, {
    expiresIn: "15m",
  });

describe("User routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.JWT_ACCESS_SECRET = accessSecret;
  });

  it("GET /api/v1/users/me returns current user profile", async () => {
    mockedGetUserProfile.mockResolvedValue({
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      role: "USER",
      profileVisibility: "PUBLIC",
      emailVerified: true,
      emailVerifiedAt: new Date("2026-05-24T00:00:00.000Z"),
      createdAt: new Date("2026-05-24T00:00:00.000Z"),
    } as never);

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${createAccessToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe("alice");
  });

  it("PATCH /api/v1/users/me updates current user profile", async () => {
    mockedUpdateUserProfile.mockResolvedValue({
      id: "user-1",
      username: "alice-new",
      email: "alice-new@example.com",
      role: "USER",
      profileVisibility: "PRIVATE",
      emailVerified: true,
      emailVerifiedAt: new Date("2026-05-24T00:00:00.000Z"),
      createdAt: new Date("2026-05-24T00:00:00.000Z"),
    } as never);

    const response = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${createAccessToken()}`)
      .send({ username: "alice-new", profileVisibility: "PRIVATE" });

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe("alice-new");
    expect(mockedUpdateUserProfile).toHaveBeenCalledWith("user-1", {
      username: "alice-new",
      profileVisibility: "PRIVATE",
    });
  });

  it("POST /api/v1/users/me/change-password triggers password change flow", async () => {
    mockedChangePassword.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/users/me/change-password")
      .set("Authorization", `Bearer ${createAccessToken()}`)
      .send({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Confirmation link sent to your email");
    expect(mockedChangePassword).toHaveBeenCalledWith("user-1", {
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
    });
  });

  it("GET /api/v1/users/me rejects missing access token", async () => {
    const response = await request(app).get("/api/v1/users/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication token required");
  });
});
