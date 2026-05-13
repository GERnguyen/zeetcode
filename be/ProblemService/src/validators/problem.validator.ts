import { z } from "zod";

export const CreateProblemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({
      message: "Difficulty must be one of easy, medium, or hard",
    }),
  }),
  tags: z.array(z.string()).optional(),
  editorial: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  testcases: z
    .array(
      z.object({
        input: z.string().min(1, "Test case input is required"),
        output: z.string().min(1, "Test case output is required"),
      }),
    )
    .min(1, "At least one test case is required"),
});

export const UpdateProblemSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  difficulty: z
    .enum(["easy", "medium", "hard"], {
      errorMap: () => ({
        message: "Difficulty must be one of easy, medium, or hard",
      }),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  editorial: z.string().optional(),
  category: z.string().min(1, "Category is required").optional(),
  testcases: z
    .array(
      z.object({
        input: z.string().min(1, "Test case input is required"),
        output: z.string().min(1, "Test case output is required"),
      }),
    )
    .min(1, "At least one test case is required")
    .optional(),
});

export const FindByDifficultySchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export type CreateProblemDto = z.infer<typeof CreateProblemSchema>;
export type UpdateProblemDto = z.infer<typeof UpdateProblemSchema>;
