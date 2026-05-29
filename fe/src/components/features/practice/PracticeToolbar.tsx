import { Search } from "lucide-react";
import type { Difficulty } from "../../../types/domain";
import { Input, Select } from "../../ui/Form";

type PracticeToolbarProps = {
  search: string;
  difficulty: "" | Difficulty;
  tag: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: "" | Difficulty) => void;
  onTagChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export function PracticeToolbar({
  search,
  difficulty,
  tag,
  sort,
  onSearchChange,
  onDifficultyChange,
  onTagChange,
  onSortChange,
}: PracticeToolbarProps) {
  return (
    <div className="toolbar-panel flex min-h-[76px] items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-3 max-lg:grid">
      <div className="search-shell flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[#22252b] px-3 max-sm:min-w-0">
        <Search size={18} />
        <input
          className="min-h-10 w-full border-0 bg-transparent p-0 text-[var(--text)] outline-none placeholder:text-[#707783]"
          placeholder="Search problems"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <Select
        value={difficulty}
        onChange={(event) =>
          onDifficultyChange(event.target.value as "" | Difficulty)
        }
      >
        <option value="">All difficulty</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </Select>
      <Input
        placeholder="Tag"
        value={tag}
        onChange={(event) => onTagChange(event.target.value)}
      />
      <Select value={sort} onChange={(event) => onSortChange(event.target.value)}>
        <option value="title">Sort by title</option>
        <option value="difficulty">Sort by difficulty</option>
      </Select>
    </div>
  );
}
