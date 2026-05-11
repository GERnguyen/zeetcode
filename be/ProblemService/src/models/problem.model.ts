import mongoose, { Document } from "mongoose";

export interface ITestCase {
  input: string;
  output: string;
}

export interface IProblem extends Document {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  editorial?: string;
  testcases: ITestCase[];
}

const TestSchema = new mongoose.Schema<ITestCase>(
  {
    input: { required: [true, "Input is required"], trim: true },
    output: {
      required: [true, "Output is required"],
      trim: true,
    },
  },
  {
    // _id: false
  },
);

const ProblemSchema = new mongoose.Schema<IProblem>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxLength: [100, "Title cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Invalid difficulty level",
      },
      default: "easy",
      required: [true, "Difficulty level is required"],
    },
    category: { type: String, required: [true, "Category is required"] },
    tags: [{ type: String }],
    editorial: { type: String, trim: true },
    testcases: [TestSchema],
  },
  { timestamps: true },
);

ProblemSchema.index({ title: 1 }, { unique: true });
ProblemSchema.index({ difficulty: 1 });

const Problem = mongoose.model<IProblem>("Problem", ProblemSchema);

export default Problem;
