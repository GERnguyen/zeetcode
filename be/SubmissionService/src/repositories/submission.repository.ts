import {
  ISubmissionEvaluationUpdate,
  ISubmission,
  Submission,
} from "../models/submission.model";

export interface ISubmissionRepository {
  create(submissionData: Partial<ISubmission>): Promise<ISubmission>;
  findById(id: string): Promise<ISubmission | null>;
  findByProblemId(problemId: string): Promise<ISubmission[]>;
  updateEvaluation(
    id: string,
    payload: ISubmissionEvaluationUpdate,
  ): Promise<ISubmission | null>;
  deleteById(id: string): Promise<boolean>;
}

export class SubmissionRepository implements ISubmissionRepository {
  async create(submissionData: Partial<ISubmission>): Promise<ISubmission> {
    const submission = new Submission(submissionData);
    return await submission.save();
  }

  async findById(id: string): Promise<ISubmission | null> {
    return await Submission.findById(id);
  }

  async findByProblemId(problemId: string): Promise<ISubmission[]> {
    return await Submission.find({ problemId });
  }

  async updateEvaluation(
    id: string,
    payload: ISubmissionEvaluationUpdate,
  ): Promise<ISubmission | null> {
    const updatePayload: ISubmissionEvaluationUpdate = {};

    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.verdict !== undefined) updatePayload.verdict = payload.verdict;
    if (payload.testCaseResults !== undefined) {
      updatePayload.testCaseResults = payload.testCaseResults;
    }
    if (payload.judgeMeta !== undefined)
      updatePayload.judgeMeta = payload.judgeMeta;

    return await Submission.findByIdAndUpdate(id, updatePayload, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Submission.findByIdAndDelete(id);
    return result !== null;
  }
}
