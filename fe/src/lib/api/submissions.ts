import axios from "axios";
import { SUBMISSION_API } from "./config";
import { authHeader } from "./http";
import type {
  AcceptedProblemsResponse,
  Submission,
} from "../../types/domain";

export async function getAcceptedProblems() {
  const response = await axios.get<{ data: AcceptedProblemsResponse }>(
    `${SUBMISSION_API}/submissions/me/accepted-problems`,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function getMyProblemSubmissions(problemId: string) {
  const response = await axios.get<{ data: Submission[] }>(
    `${SUBMISSION_API}/submissions/me/problem/${problemId}`,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function getSubmission(submissionId: string) {
  const response = await axios.get<{ data: Submission }>(
    `${SUBMISSION_API}/submissions/${submissionId}`,
  );
  return response.data.data;
}

export async function createSubmission(payload: {
  problemId: string;
  code: string;
  language: "python" | "cpp";
}) {
  const response = await axios.post<{ data: Submission }>(
    `${SUBMISSION_API}/submissions`,
    payload,
    { headers: authHeader() },
  );
  return response.data.data;
}

export async function runSampleTests(payload: {
  problemId: string;
  code: string;
  language: "python" | "cpp";
}) {
  const response = await axios.post<{ data: Submission }>(
    `${SUBMISSION_API}/submissions/run-samples`,
    payload,
    { headers: authHeader() },
  );
  return response.data.data;
}
