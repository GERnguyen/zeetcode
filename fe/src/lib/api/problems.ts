import axios from "axios";
import { PROBLEM_API } from "./config";
import type {
  Difficulty,
  ProblemDetail,
  ProblemListResponse,
} from "../../types/domain";

export type ProblemListParams = {
  page: number;
  limit: number;
  search?: string;
  difficulty?: "" | Difficulty;
  tag?: string;
  sort?: string;
};

export async function getPracticeProblems(params: ProblemListParams) {
  const response = await axios.get<{ data: ProblemListResponse }>(
    `${PROBLEM_API}/problems`,
    {
      params: {
        practice: true,
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        difficulty: params.difficulty || undefined,
        tag: params.tag || undefined,
        sort: params.sort || "title",
        order: "asc",
      },
    },
  );
  return response.data.data;
}

export async function getProblemDetail(problemId: string) {
  const response = await axios.get<{ data: ProblemDetail }>(
    `${PROBLEM_API}/problems/${problemId}`,
  );
  return response.data.data;
}
