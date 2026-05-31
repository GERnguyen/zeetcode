import { z } from "zod";

const youtubeUrlSchema = z
  .string()
  .url("Video link must be a valid URL")
  .refine(
    (value) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(value),
    {
      message: "Video link must be a YouTube URL",
    },
  );

const editorialSchema = z
  .object({
    videoLink: youtubeUrlSchema.optional(),
    text: z.string().optional(),
  })
  .refine((data) => Boolean(data.videoLink || data.text), {
    message: "Editorial must include at least videoLink or text",
  });

export const CreateProblemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({
      message: "Difficulty must be one of easy, medium, or hard",
    }),
  }),
  tags: z.array(z.string()).optional(),
  isForBattle: z.boolean().default(false),
  editorial: editorialSchema.optional(),
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
  isForBattle: z.boolean().optional(),
  editorial: editorialSchema.optional(),
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

export const BatchProblemLookupSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one problem id is required"),
});

export const ProblemListQuerySchema = z.object({
  practice: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tag: z.string().trim().optional(),
  sort: z.enum(["title", "difficulty"]).default("title"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProblemDto = z.infer<typeof CreateProblemSchema>;
export type UpdateProblemDto = z.infer<typeof UpdateProblemSchema>;
export type BatchProblemLookupDto = z.infer<typeof BatchProblemLookupSchema>;
export type ProblemListQueryDto = z.infer<typeof ProblemListQuerySchema>;
