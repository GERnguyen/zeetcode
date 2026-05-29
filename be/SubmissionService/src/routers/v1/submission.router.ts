import express from "express";
import { SubmissionFactory } from "../../factories/submission.factory";
import {
  authenticateAccessToken,
  authenticateServiceToken,
} from "../../middlewares/auth.middleware";
import { validateRequestBody, validateRequestParams } from "../../validators";
import {
  createSubmissionSchema,
  submissionProblemParamsSchema,
  updateSubmissionStatusSchema,
} from "../../validators/submission.validator";

const submissionRouter = express.Router();

// Get submission controller instance from factory
const submissionController = SubmissionFactory.getSubmissionController();

// POST /submissions - Create a new submission
submissionRouter.post(
  "/",
  authenticateAccessToken,
  validateRequestBody(createSubmissionSchema),
  // wrap async controller so the router handler does not return the controller's Response
  (req, res, next) => {
    // call and swallow the returned Response to satisfy Express handler type
    // errors are forwarded to next
    submissionController.createSubmission(req, res, next).catch(next);
  },
);

submissionRouter.post(
  "/run-samples",
  authenticateAccessToken,
  validateRequestBody(createSubmissionSchema),
  (req, res, next) => {
    submissionController.runSampleTests(req, res, next).catch(next);
  },
);

// GET /submissions/me/accepted-problems - Get all accepted problems for current user
submissionRouter.get(
  "/me/accepted-problems",
  authenticateAccessToken,
  submissionController.getMyAcceptedProblems,
);

submissionRouter.get(
  "/me/problem/:problemId",
  authenticateAccessToken,
  validateRequestParams(submissionProblemParamsSchema),
  submissionController.getMySubmissionsByProblemId,
);

// GET /submissions/:id - Get submission by ID
submissionRouter.get("/:id", submissionController.getSubmissionById);

// GET /submissions/problem/:problemId - Get all submissions for a problem
submissionRouter.get(
  "/problem/:problemId",
  validateRequestParams(submissionProblemParamsSchema),
  submissionController.getSubmissionsByProblemId,
);

// DELETE /submissions/:id - Delete a submission
submissionRouter.delete("/:id", submissionController.deleteSubmissionById);

// PATCH /submissions/:id/status - Update submission status
submissionRouter.patch(
  "/:id/status",
  authenticateServiceToken,
  validateRequestBody(updateSubmissionStatusSchema),
  submissionController.updateSubmissionStatus,
);

export default submissionRouter;
