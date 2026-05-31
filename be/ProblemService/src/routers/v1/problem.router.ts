import express from "express";
import { validateRequestBody, validateRequestParams } from "../../validators";
import {
  BatchProblemLookupSchema,
  CreateProblemSchema,
  FindByDifficultySchema,
  UpdateProblemSchema,
} from "../../validators/problem.validator";
import { ProblemController } from "../../controllers/problem.controller";
import {
  authenticateAccessToken,
  authenticateServiceToken,
  requireAdmin,
} from "../../middlewares/auth.middleware";

const problemRouter = express.Router();

problemRouter.post(
  "/",
  authenticateAccessToken,
  requireAdmin,
  validateRequestBody(CreateProblemSchema),
  ProblemController.createProblem,
);

problemRouter.get("/", ProblemController.getAllProblems);

problemRouter.get("/search", ProblemController.searchProblems);

problemRouter.post(
  "/batch",
  authenticateServiceToken,
  validateRequestBody(BatchProblemLookupSchema),
  ProblemController.getProblemsByIds,
);

problemRouter.get(
  "/difficulty/:difficulty",
  authenticateServiceToken,
  validateRequestParams(FindByDifficultySchema),
  ProblemController.findByDifficulty,
);

problemRouter.get("/:id/judge", ProblemController.getJudgeProblemById);

problemRouter.get("/:id", ProblemController.getProblemById);

problemRouter.put(
  "/:id",
  authenticateAccessToken,
  requireAdmin,
  validateRequestBody(UpdateProblemSchema),
  ProblemController.updateProblem,
);

problemRouter.delete(
  "/:id",
  authenticateAccessToken,
  requireAdmin,
  ProblemController.deleteProblem,
);

export default problemRouter;
