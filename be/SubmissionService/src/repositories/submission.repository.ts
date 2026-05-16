import {
  ISubmission,
  Submission,
  SubmissionStatus,
} from "../models/submission.model";

export interface ISubmissionRepository {
  create(submissionData: Partial<ISubmission>): Promise<ISubmission>;
  findById(id: string): Promise<ISubmission | null>;
  findByProblemId(problemId: string): Promise<ISubmission[]>;
  updateStatus(
    id: string,
    status: SubmissionStatus,
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

  async updateStatus(
    id: string,
    status: SubmissionStatus,
  ): Promise<ISubmission | null> {
    return await Submission.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Submission.findByIdAndDelete(id);
    return result !== null;
  }
}
