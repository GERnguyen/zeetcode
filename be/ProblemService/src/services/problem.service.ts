import {
  BatchProblemLookupDto,
  CreateProblemDto,
  UpdateProblemDto,
} from "../validators/problem.validator";
import { IProblem } from "../models/problem.model";
import { IProblemRepository } from "../repositories/problem.repository";
import { sanitizeMarkdown } from "../utils/markdown.sanitizer";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";

export interface IProblemService {
  createProblem(problem: CreateProblemDto): Promise<IProblem>;
  getAllProblems(): Promise<{ problems: IProblem[]; total: number }>;
  getProblemById(id: string): Promise<IProblem | null>;
  getProblemsByIds(ids: BatchProblemLookupDto["ids"]): Promise<IProblem[]>;
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
    const sanitizedEditorial = problem.editorial
      ? {
          ...problem.editorial,
          text: problem.editorial.text
            ? await sanitizeMarkdown(problem.editorial.text)
            : undefined,
        }
      : undefined;

    const sanitizedPayload = {
      ...problem,
      description: await sanitizeMarkdown(problem.description),
      editorial: sanitizedEditorial,
    };
    return await this.problemRepository.createProblem(sanitizedPayload);
  }

  async getAllProblems(): Promise<{ problems: IProblem[]; total: number }> {
    return await this.problemRepository.getAllProblems();
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new NotFoundError("Problem not found");
    }
    return problem;
  }

  async getProblemsByIds(
    ids: BatchProblemLookupDto["ids"],
  ): Promise<IProblem[]> {
    const dedupedIds = Array.from(
      new Set(ids.map((id) => id.trim()).filter(Boolean)),
    );
    if (dedupedIds.length === 0) {
      throw new BadRequestError("At least one valid problem id is required");
    }

    return await this.problemRepository.getProblemsByIds(dedupedIds);
  }

  async updateProblem(
    id: string,
    updateData: UpdateProblemDto,
  ): Promise<IProblem | null> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new NotFoundError("Problem not found");
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
      sanitizedPayload.editorial = {
        ...updateData.editorial,
        text: updateData.editorial.text
          ? await sanitizeMarkdown(updateData.editorial.text)
          : undefined,
      };
    }

    return await this.problemRepository.updateProblem(id, sanitizedPayload);
  }

  async deleteProblem(id: string): Promise<boolean> {
    const problem = await this.problemRepository.getProblemById(id);
    if (!problem) {
      throw new NotFoundError("Problem not found");
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
      throw new BadRequestError("Search query cannot be empty");
    }
    return await this.problemRepository.searchProblems(query);
  }
}
