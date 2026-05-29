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

export async function getMe() {
  const response = await axios.get<{ data: User }>(`${USER_API}/users/me`, {
    headers: authHeader(),
  });
  return response.data.data;
}
