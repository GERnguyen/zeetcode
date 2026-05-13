import express from "express";
import { validateRequestBody, validateRequestParams } from "../../validators";
import {
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

problemRouter.get("/:id", ProblemController.getProblemById);

problemRouter.put(
  "/:id",
  validateRequestBody(UpdateProblemSchema),
  ProblemController.updateProblem,
);

problemRouter.delete("/:id", ProblemController.deleteProblem);

problemRouter.get(
  "/difficulty/:difficulty",
  validateRequestParams(FindByDifficultySchema),
  ProblemController.findByDifficulty,
);

problemRouter.get("/search", ProblemController.searchProblems);

export default problemRouter;
