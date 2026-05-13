import {
  CreateProblemDto,
  UpdateProblemDto,
} from "../validators/problem.validator";
import { IProblem } from "../models/problem.model";
import { IProblemRepository } from "../repositories/problem.repository";
import { sanitizeMarkdown } from "../utils/markdown.sanitizer";

export interface IProblemService {
  createProblem(problem: CreateProblemDto): Promise<IProblem>;
  getAllProblems(): Promise<{ problems: IProblem[]; total: number }>;
  getProblemById(id: string): Promise<IProblem | null>;
  updateProblem(
    id: string,
    updateData: UpdateProblemDto,
  ): Promise<IProblem | null>;
  deleteProblem(id: string): Promise<boolean>;
  findByDifficulty(difficulty: "easy" | "medium" | "hard"): Promise<IProblem[]>;
  searchProblems(query: string): Promise<IProblem[]>;
}

export class ProblemService implements IProblemService {
  private problemRepository: IProblemRepository;
  constructor(problemRepository: IProblemRepository) {
    this.problemRepository = problemRepository;
  }

  async createProblem(problem: CreateProblemDto): Promise<IProblem> {
    const sanitizedPayload = {
      ...problem,
      description: await sanitizeMarkdown(problem.description),
      editorial:
        problem.editorial && (await sanitizeMarkdown(problem.editorial)),
    };
    return await this.problemRepository.createProblem(sanitizedPayload);
  }

  async getAllProblems(): Promise<{ problems: IProblem[]; total: number }> {
    return await this.problemRepository.getAllProblems();
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new Error("Problem not found");
    }
    return problem;
  }

  async updateProblem(
    id: string,
    updateData: UpdateProblemDto,
  ): Promise<IProblem | null> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new Error("Problem not found");
    }
    const sanitizedPayload: Partial<IProblem> = {
      ...updateData,
    };
    if (updateData.description) {
      sanitizedPayload.description = await sanitizeMarkdown(
        updateData.description,
      );
    }
    if (updateData.editorial) {
      sanitizedPayload.editorial = await sanitizeMarkdown(updateData.editorial);
    }

    return await this.problemRepository.updateProblem(id, sanitizedPayload);
  }

  async deleteProblem(id: string): Promise<boolean> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new Error("Problem not found");
    }
    return await this.problemRepository.deleteProblem(id);
  }
  async findByDifficulty(
    difficulty: "easy" | "medium" | "hard",
  ): Promise<IProblem[]> {
    return await this.problemRepository.findByDifficulty(difficulty);
  }

  async searchProblems(query: string): Promise<IProblem[]> {
    if (query.trim() === "") {
      throw new Error("Search query cannot be empty");
    }
    return await this.problemRepository.searchProblems(query);
  }
}
