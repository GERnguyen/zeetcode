import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPracticeProblems } from "../../../lib/api/problems";
import { getAcceptedProblems } from "../../../lib/api/submissions";
import { getAxiosMessage } from "../../../lib/api/http";
import type { Difficulty } from "../../../types/domain";
import { CompletionRing } from "./CompletionRing";
import { PracticeToolbar } from "./PracticeToolbar";
import { ProblemTable } from "./ProblemTable";

const limit = 10;

export function PracticeHome() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"" | Difficulty>("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("title");

  const problemsQuery = useQuery({
    queryKey: ["practiceProblems", page, search, difficulty, tag, sort],
    queryFn: () =>
      getPracticeProblems({ page, limit, search, difficulty, tag, sort }),
  });
  const acceptedQuery = useQuery({
    queryKey: ["acceptedProblems"],
    queryFn: getAcceptedProblems,
  });

  const solvedIds = new Set(acceptedQuery.data?.problemIds ?? []);
  const items =
    problemsQuery.data?.problems.map((problem) => ({
      ...problem,
      isSolved: solvedIds.has(problem.id),
    })) ?? [];
  const stats = problemsQuery.data?.stats ?? { easy: 0, medium: 0, hard: 0 };
  const solvedStats = acceptedQuery.data?.stats.byDifficulty ?? {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  const total = problemsQuery.data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / limit));
  const error =
    problemsQuery.error || acceptedQuery.error
      ? getAxiosMessage(problemsQuery.error || acceptedQuery.error)
      : "";

  return (
    <section className="grid gap-6">
      <div className="grid min-h-[250px] grid-cols-[minmax(0,1fr)_440px] items-center gap-6 max-lg:grid-cols-1">
        <div>
          <p className="kicker">Practice set</p>
          <h2 className="m-0 text-5xl font-black">Core skills</h2>
          <p className="max-w-2xl text-[var(--muted)]">
            Build interview fundamentals with public problems. Only accepted
            submissions count toward completion.
          </p>
        </div>
        <CompletionRing
          solved={solvedIds.size}
          total={stats.easy + stats.medium + stats.hard}
          stats={stats}
          solvedStats={solvedStats}
        />
      </div>

      <PracticeToolbar
        search={search}
        difficulty={difficulty}
        tag={tag}
        sort={sort}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onDifficultyChange={(value) => {
          setPage(1);
          setDifficulty(value);
        }}
        onTagChange={(value) => {
          setPage(1);
          setTag(value);
        }}
        onSortChange={setSort}
      />

      <ProblemTable
        items={items}
        loading={problemsQuery.isLoading || acceptedQuery.isLoading}
        error={error}
        page={page}
        maxPage={maxPage}
        onPageChange={setPage}
        onProblemClick={(problemId) => navigate(`/practice/${problemId}`)}
      />
    </section>
  );
}
