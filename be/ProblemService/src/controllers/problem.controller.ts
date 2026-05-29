import { ProblemService } from "../services/problem.service";
import { ProblemRepository } from "../repositories/problem.repository";
import { Request, Response } from "express";
import { serverConfig } from "../config";
import { ProblemListQuerySchema } from "../validators/problem.validator";


const problemRepository = new ProblemRepository();
const problemService = new ProblemService(problemRepository);


export const ProblemController = {
  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const problem = await problemService.createProblem(req.body);

      res.status(201).json({
        message: "Problem created successfully",
        success: true,
        data: problem,
      });
    } catch (error) {
      res.status(400).json({
        message: "Error creating problem",
        success: false,
      });
    }
  },

  async getProblemById(req: Request, res: Response): Promise<void> {
      const problem = await problemService.getPublicProblemById(req.params.id);

      res.status(200).json({
        message: "Problem retrieved successfully",
        success: true,
        data: problem,
      });
  },

  async getJudgeProblemById(req: Request, res: Response): Promise<void> {
      const token = req.headers["x-service-token"];
      if (
        !serverConfig.INTERNAL_SERVICE_TOKEN ||
        token !== serverConfig.INTERNAL_SERVICE_TOKEN
      ) {
        res.status(401).json({
          message: "Invalid service token",
          success: false,
        });
        return;
      }

      const problem = await problemService.getProblemById(req.params.id);

      res.status(200).json({
        message: "Problem retrieved successfully",
        success: true,
        data: problem,
      });
  },

    async getProblemsByIds(req: Request, res: Response): Promise<void> {
            const { ids } = req.body as { ids: string[] };
            const problems = await problemService.getProblemsByIds(ids);

            res.status(200).json({
                message: "Problems retrieved successfully",
                success: true,
                data: problems,
            });
    },

    async getAllProblems(req: Request, res: Response): Promise<void> {
        const query = req.query as any;
        if (
            query.practice !== undefined ||
            query.search !== undefined ||
            query.difficulty !== undefined ||
            query.tag !== undefined ||
            query.sort !== undefined ||
            query.page !== undefined ||
            query.limit !== undefined
        ) {
            const data = await problemService.listProblems(
                ProblemListQuerySchema.parse(query),
            );
            res.status(200).json({
                message: "Problems retrieved successfully",
                success: true,
                data,
            });
            return;
        }

        const data = await problemService.listProblems({
            practice: false,
            sort: "title",
            order: "asc",
            page: 1,
            limit: 100,
        });
        res.status(200).json({
            message: "Problems retrieved successfully",
            success: true,
            data,
        });
    },

    async updateProblem(req: Request, res: Response): Promise<void> {
        try {
            const updatedProblem = await problemService.updateProblem(req.params.id, req.body);
            res.status(200).json({
                message: "Problem updated successfully",
                success: true,
                data: updatedProblem,
            });
        } catch (error) {
            res.status(400).json({
                message: "Error updating problem",
                success: false,
            });
        }
    },

    async deleteProblem(req: Request, res: Response): Promise<void> {
        try {
            const deleted = await problemService.deleteProblem(req.params.id);
            if (deleted) {
                res.status(200).json({
                    message: "Problem deleted successfully",
                    success: true,
                });
            } else {
                res.status(404).json({
                    message: "Problem not found",
                    success: false,
                });
            }
        } catch (error) {
            res.status(400).json({
                message: "Error deleting problem",
                success: false,
            });
        }
    },

    async findByDifficulty(req: Request, res: Response): Promise<void> {
        const difficulty = req.params.difficulty as "easy" | "medium" | "hard";
        const problems = await problemService.findByDifficulty(difficulty);
        res.status(200).json({
            message: "Problems retrieved successfully",
            success: true,
            data: problems,
        });
    },

    async searchProblems(req: Request, res: Response): Promise<void> {
        const query = req.query.q as string;
        const problems = await problemService.searchProblems(query);
        res.status(200).json({
            message: "Problems retrieved successfully",
            success: true,
            data: problems,
        });
    }
}
