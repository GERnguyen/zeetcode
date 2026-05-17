import { ISubmission } from "../models/submission.model";
import { ISubmissionRepository } from "../repositories/submission.repository";
import { SubmissionStatus } from "../models/submission.model";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { getProblemById } from "../apis/problem.api";
import { addSubmissionJob } from "../producers/submission.producer";
import logger from "../config/logger.config";

export interface ISubmissionService {
  createSubmission(
    submissionData: Partial<ISubmission>,
  ): Promise<ISubmission | null>;
  getSubmissionById(id: string): Promise<ISubmission | null>;
  getSubmissionsByProblemId(problemId: string): Promise<ISubmission[]>;
  updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
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
    const submission = await this.submissionRepository.create(submissionData);

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

    logger.info(`Submission ${submission._id} created and added to the queue with job ID ${jobId}`);

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

  async updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
  ): Promise<ISubmission | null> {
    const submission = await this.submissionRepository.updateStatus(id, status);
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
