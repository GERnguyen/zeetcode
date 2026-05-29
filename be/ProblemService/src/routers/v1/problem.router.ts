import express from "express";
import { validateRequestBody, validateRequestParams } from "../../validators";
import {
  BatchProblemLookupSchema,
  CreateProblemSchema,
  FindByDifficultySchema,
  UpdateProblemSchema,
} from "../../validators/problem.validator";
import { ProblemController } from "../../controllers/problem.controller";

const problemRouter = express.Router();

problemRouter.post(
  "/",
  validateRequestBody(CreateProblemSchema),
  ProblemController.createProblem,
);

problemRouter.get("/", ProblemController.getAllProblems);

problemRouter.get("/search", ProblemController.searchProblems);

problemRouter.post(
  "/batch",
  validateRequestBody(BatchProblemLookupSchema),
  ProblemController.getProblemsByIds,
);

problemRouter.get(
  "/difficulty/:difficulty",
  validateRequestParams(FindByDifficultySchema),
  ProblemController.findByDifficulty,
);

problemRouter.get("/:id/judge", ProblemController.getJudgeProblemById);

problemRouter.get("/:id", ProblemController.getProblemById);

problemRouter.put(
  "/:id",
  validateRequestBody(UpdateProblemSchema),
  ProblemController.updateProblem,
);

problemRouter.delete("/:id", ProblemController.deleteProblem);

export default problemRouter;
