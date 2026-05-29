import { Code2, History, LogOut, Swords, TerminalSquare, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";

const navItems: Array<[string, LucideIcon, string]> = [
  ["/practice", Code2, "Practice"],
  ["/battle", Swords, "Battle"],
  ["/history", History, "History"],
  ["/profile", UserRound, "Profile"],
];

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="grid min-h-dvh grid-cols-[244px_minmax(0,1fr)] bg-[var(--bg)] text-[var(--text)] max-lg:grid-cols-1">
      <aside className="flex flex-col gap-6 border-r border-[var(--line)] bg-[#14161a] p-5 max-lg:min-h-0">
        <div className="flex items-center gap-2.5 text-lg font-black">
          <TerminalSquare size={22} />
          <span>CodeBattle</span>
        </div>
        <nav className="grid gap-2">
          {navItems.map(([href, Icon, label]) => (
            <Link
              key={href}
              className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 font-bold text-[var(--muted)] no-underline hover:bg-[#22252b] hover:text-[var(--text)]"
              to={href}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <button
          className="mt-auto flex min-h-10 items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 font-bold text-[var(--muted)] hover:bg-[#22252b] hover:text-[var(--text)]"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="min-w-0 p-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="kicker">ELO {user?.eloRating ?? 300}</p>
            <h1 className="m-0 text-3xl font-black">{user?.username ?? "Coder"}</h1>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
