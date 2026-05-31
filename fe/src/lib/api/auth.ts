import axios from "axios";
import { USER_API } from "./config";
import type { User } from "../../types/domain";
import { authHeader } from "./http";

export type LoginResponse = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export async function loginUser(payload: { email: string; password: string }) {
  const response = await axios.post<{ data: LoginResponse }>(
    `${USER_API}/auth/login`,
    payload,
  );
  return response.data.data;
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}) {
  const response = await axios.post<{ data: { message: string } }>(
    `${USER_API}/auth/register`,
    payload,
  );
  return response.data.data;
}

export async function confirmSignup(token: string) {
  const response = await axios.post<{ message: string }>(`${USER_API}/auth/confirm`, {
    token,
  });
  return response.data;
}

export async function confirmPasswordChange(token: string) {
  const response = await axios.post<{ message: string }>(
    `${USER_API}/auth/confirm-change`,
    { token },
  );
  return response.data;
}

export async function resetPassword(payload: {
  token: string;
  newPassword: string;
}) {
  const response = await axios.post<{ message: string }>(
    `${USER_API}/auth/password/reset`,
    payload,
  );
  return response.data;
}

export async function requestPasswordReset(payload: { email: string }) {
  const response = await axios.post<{ message: string }>(
    `${USER_API}/auth/password/reset/request`,
    payload,
  );
  return response.data;
}

export async function getMe() {
  const response = await axios.get<{ data: User }>(`${USER_API}/users/me`, {
    headers: authHeader(),
  });
  return response.data.data;
}

export async function updateMe(payload: {
  username?: string;
  profileVisibility?: User["profileVisibility"];
}) {
  const response = await axios.patch<{ data: User }>(
    `${USER_API}/users/me`,
    payload,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function requestPasswordChange(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await axios.post<{ message: string }>(
    `${USER_API}/users/me/change-password`,
    payload,
    { headers: authHeader() },
  );
  return response.data;
}
