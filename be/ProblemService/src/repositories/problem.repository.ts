import Problem, { IProblem } from "../models/problem.model";
import { ProblemListQueryDto } from "../validators/problem.validator";

export interface IProblemRepository {
  createProblem(problem: Partial<IProblem>): Promise<IProblem>;
  getAllProblems(): Promise<{ problems: IProblem[]; total: number }>;
  listProblems(
    query: ProblemListQueryDto,
  ): Promise<{ problems: Partial<IProblem>[]; total: number; stats: Record<string, number> }>;
  getProblemById(id: string): Promise<IProblem | null>;
  getProblemsByIds(ids: string[]): Promise<IProblem[]>;
  updateProblem(
    id: string,
    updateData: Partial<IProblem>,
  ): Promise<IProblem | null>;
  deleteProblem(id: string): Promise<boolean>;
  findByDifficulty(difficulty: "easy" | "medium" | "hard"): Promise<IProblem[]>;
  searchProblems(query: string): Promise<IProblem[]>;
}

export class ProblemRepository implements IProblemRepository {
  async createProblem(problem: Partial<IProblem>): Promise<IProblem> {
    const newProblem = new Problem(problem);
    return await newProblem.save();
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    return await Problem.findById(id);
  }

  async getProblemsByIds(ids: string[]): Promise<IProblem[]> {
    return await Problem.find({ _id: { $in: ids } }).sort({ createdAt: -1 });
  }

  async getAllProblems(): Promise<{ problems: IProblem[]; total: number }> {
    const problems = await Problem.find().sort({ createdAt: -1 });
    const total = await Problem.countDocuments();
    return { problems, total };
  }

  async listProblems(query: ProblemListQueryDto): Promise<{
    problems: Partial<IProblem>[];
    total: number;
    stats: Record<string, number>;
  }> {
    const filter: Record<string, unknown> = {};
    if (query.practice) filter.isForBattle = false;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ title: regex }, { tags: regex }, { category: regex }];
    }

    const sortDirection = query.order === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      [query.sort]: sortDirection,
    };
    const skip = (query.page - 1) * query.limit;

    const problemQuery =
      query.sort === "difficulty"
        ? Problem.aggregate([
            { $match: filter },
            {
              $addFields: {
                difficultyRank: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$difficulty", "easy"] }, then: 1 },
                      { case: { $eq: ["$difficulty", "medium"] }, then: 2 },
                      { case: { $eq: ["$difficulty", "hard"] }, then: 3 },
                    ],
                    default: 4,
                  },
                },
              },
            },
            { $sort: { difficultyRank: sortDirection, title: 1 } },
            { $skip: skip },
            { $limit: query.limit },
            {
              $project: {
                title: 1,
                difficulty: 1,
                category: 1,
                tags: 1,
                isForBattle: 1,
              },
            },
          ])
        : Problem.find(filter)
            .select("title difficulty category tags isForBattle")
            .sort(sort)
            .skip(skip)
            .limit(query.limit);

    const [problems, total, groupedStats] = await Promise.all([
      problemQuery,
      Problem.countDocuments(filter),
      Problem.aggregate([
        { $match: query.practice ? { isForBattle: false } : {} },
        { $group: { _id: "$difficulty", total: { $sum: 1 } } },
      ]),
    ]);

    const stats = { easy: 0, medium: 0, hard: 0 };
    for (const item of groupedStats) {
      if (item._id in stats) {
        stats[item._id as keyof typeof stats] = item.total;
      }
    }

    return { problems, total, stats };
  }

  async updateProblem(
    id: string,
    updateData: Partial<IProblem>,
  ): Promise<IProblem | null> {
    return await Problem.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteProblem(id: string): Promise<boolean> {
    const result = await Problem.findByIdAndDelete(id);
    return result !== null;
  }

  async findByDifficulty(
    difficulty: "easy" | "medium" | "hard",
  ): Promise<IProblem[]> {
    return await Problem.find({ difficulty }).sort({ createdAt: -1 });
  }

  async searchProblems(query: string): Promise<IProblem[]> {
    const regex = new RegExp(query, "i");
    return await Problem.find({
      $or: [{ title: regex }, { description: regex }],
    }).sort({ createdAt: -1 });
  }
}
