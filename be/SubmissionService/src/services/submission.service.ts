import {
  ISubmission,
  ISubmissionEvaluationUpdate,
  SubmissionStatus,
} from "../models/submission.model";
import { ISubmissionRepository } from "../repositories/submission.repository";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import {
  getProblemById,
  getProblemsByIds,
  IProblemDetails,
} from "../apis/problem.api";
import { addSubmissionJob } from "../producers/submission.producer";
import logger from "../config/logger.config";

export interface ISubmissionService {
  createSubmission(
    submissionData: Partial<ISubmission>,
  ): Promise<ISubmission | null>;
  getSubmissionById(id: string): Promise<ISubmission | null>;
  getSubmissionsByProblemId(problemId: string): Promise<ISubmission[]>;
  getMySubmissionsByProblemId(
    userId: string,
    problemId: string,
  ): Promise<ISubmission[]>;
  runSampleTests(submissionData: Partial<ISubmission>): Promise<ISubmission | null>;
  getAcceptedProblemsByUserId(userId: string): Promise<{
    problemIds: string[];
    problems: IProblemDetails[];
    stats: {
      totalSolved: number;
      byDifficulty: {
        easy: number;
        medium: number;
        hard: number;
      };
    };
  }>;
  updateSubmissionStatus(
    id: string,
    payload: ISubmissionEvaluationUpdate,
  ): Promise<ISubmission | null>;
  deleteSubmissionById(id: string): Promise<boolean>;
}

export class SubmissionService implements ISubmissionService {
  private submissionRepository: ISubmissionRepository;

  constructor(submissionRepository: ISubmissionRepository) {
    this.submissionRepository = submissionRepository;
  }

  async createSubmission(
    submissionData: Partial<ISubmission>,
  ): Promise<ISubmission | null> {
    // Check if the problem exists
    if (!submissionData.problemId) {
      throw new BadRequestError("Problem ID is required");
    }

    if (!submissionData.userId) {
      throw new BadRequestError("User ID is required");
    }

    if (!submissionData.code) {
      throw new BadRequestError("Code is required");
    }

    if (!submissionData.language) {
      throw new BadRequestError("Language is required");
    }
    const problem = await getProblemById(submissionData.problemId);
    if (!problem) {
      throw new NotFoundError("Problem not found");
    }

    // Add the submission to the database
    const submission = await this.submissionRepository.create({
      userId: submissionData.userId,
      problemId: submissionData.problemId,
      code: submissionData.code,
      language: submissionData.language,
      isPracticeRun: false,
      status: SubmissionStatus.QUEUED,
      verdict: null,
    });

    // Add submission to the processing queue
    const jobId = await addSubmissionJob({
      submissionId: submission._id.toString(),
      problem,
      code: submission.code,
      language: submission.language,
    });
    if (!jobId) {
      throw new BadRequestError("Failed to add submission to the queue");
    }

    logger.info(
      `Submission ${submission._id} created and added to the queue with job ID ${jobId}`,
    );

    return submission;
  }

  async getSubmissionById(id: string): Promise<ISubmission | null> {
    const submission = await this.submissionRepository.findById(id);
    if (!submission) {
      throw new NotFoundError(`Submission with id ${id} not found`);
    }
    return submission;
  }

  async getSubmissionsByProblemId(problemId: string): Promise<ISubmission[]> {
    return await this.submissionRepository.findByProblemId(problemId);
  }

  async getMySubmissionsByProblemId(
    userId: string,
    problemId: string,
  ): Promise<ISubmission[]> {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }
    return await this.submissionRepository.findByUserAndProblem(
      userId,
      problemId,
    );
  }

  async runSampleTests(
    submissionData: Partial<ISubmission>,
  ): Promise<ISubmission | null> {
    if (!submissionData.problemId) {
      throw new BadRequestError("Problem ID is required");
    }

    if (!submissionData.userId) {
      throw new BadRequestError("User ID is required");
    }

    if (!submissionData.code) {
      throw new BadRequestError("Code is required");
    }

    if (!submissionData.language) {
      throw new BadRequestError("Language is required");
    }

    const problem = await getProblemById(submissionData.problemId);
    if (!problem) {
      throw new NotFoundError("Problem not found");
    }

    const sampleProblem = {
      ...problem,
      testcases: problem.testcases.slice(0, 2),
    };

    const submission = await this.submissionRepository.create({
      userId: submissionData.userId,
      problemId: submissionData.problemId,
      code: submissionData.code,
      language: submissionData.language,
      isPracticeRun: true,
      status: SubmissionStatus.QUEUED,
      verdict: null,
    });

    const jobId = await addSubmissionJob({
      submissionId: submission._id.toString(),
      problem: sampleProblem,
      code: submission.code,
      language: submission.language,
    });
    if (!jobId) {
      throw new BadRequestError("Failed to add sample run to the queue");
    }

    return submission;
  }

  async getAcceptedProblemsByUserId(userId: string): Promise<{
    problemIds: string[];
    problems: IProblemDetails[];
    stats: {
      totalSolved: number;
      byDifficulty: {
        easy: number;
        medium: number;
        hard: number;
      };
    };
  }> {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const problemIds =
      await this.submissionRepository.findAcceptedProblemIdsByUserId(userId);

    if (problemIds.length === 0) {
      return {
        problemIds: [],
        problems: [],
        stats: {
          totalSolved: 0,
          byDifficulty: {
            easy: 0,
            medium: 0,
            hard: 0,
          },
        },
      };
    }

    const problems = await getProblemsByIds(problemIds);
    const problemMap = new Map(
      problems.map((problem) => [problem.id, problem]),
    );
    const orderedProblems = problemIds
      .map((problemId) => problemMap.get(problemId))
      .filter(
        (problem): problem is IProblemDetails =>
          Boolean(problem) && !problem?.isForBattle,
      );

    const byDifficulty = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    for (const problem of orderedProblems) {
      if (problem.difficulty === "easy") byDifficulty.easy += 1;
      if (problem.difficulty === "medium") byDifficulty.medium += 1;
      if (problem.difficulty === "hard") byDifficulty.hard += 1;
    }

    return {
      problemIds: orderedProblems.map((problem) => problem.id),
      problems: orderedProblems,
      stats: {
        totalSolved: orderedProblems.length,
        byDifficulty,
      },
    };
  }

  async updateSubmissionStatus(
    id: string,
    payload: ISubmissionEvaluationUpdate,
  ): Promise<ISubmission | null> {
    const submission = await this.submissionRepository.updateEvaluation(
      id,
      payload,
    );
    if (!submission) {
      throw new NotFoundError(
        `Submission with id ${id} not found, can't update status`,
      );
    }
    return submission;
  }

  async deleteSubmissionById(id: string): Promise<boolean> {
    const result = await this.submissionRepository.deleteById(id);
    if (!result) {
      throw new NotFoundError(
        `Submission with id ${id} not found, can't be deleted`,
      );
    }
    return result;
  }
}
