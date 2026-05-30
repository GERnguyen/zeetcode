import {
  ChevronDown,
  Code2,
  History,
  LogOut,
  Pencil,
  Swords,
  TerminalSquare,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { cn } from "../../../lib/utils/cn";

const navItems: Array<[string, LucideIcon, string]> = [
  ["/practice", Code2, "Practice"],
  ["/battle", Swords, "Battle"],
  ["/history", History, "History"],
  ["/profile", UserRound, "Profile"],
];

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const elo = user?.eloRating ?? 300;
  const rankClass =
    elo > 1400 ? "rank-glow" : elo >= 1000 ? "rank-green" : "rank-gray";
  const showBattleCta = location.pathname === "/practice";

  return (
    <div className="app-shell grid min-h-dvh grid-cols-[244px_minmax(0,1fr)] text-[var(--text)] max-lg:grid-cols-1">
      <aside className="app-sidebar flex flex-col gap-6 border-r border-[var(--line)] p-5 max-lg:min-h-0">
        <div className="brand-mark flex items-center gap-2.5 text-lg font-black">
          <TerminalSquare size={22} />
          <span>Zeetcode</span>
        </div>
        <nav className="grid gap-2">
          {navItems.map(([href, Icon, label]) => (
            <NavLink
              key={href}
              className={({ isActive }) =>
                cn(
                  "nav-item flex min-h-10 items-center gap-2.5 rounded-xl px-3 font-bold text-[var(--muted)] no-underline",
                  isActive && "nav-item-active",
                )
              }
              to={href}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-main min-w-0 p-6">
        <header className="app-topbar mb-5 flex items-center justify-between gap-4">
          <div className="user-menu relative">
            <button
              aria-expanded={userMenuOpen}
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen((open) => !open)}
              type="button"
            >
              <span className="user-avatar">
                <UserRound size={22} />
              </span>
              <span className="grid text-left">
                <strong>{user?.username ?? "Coder"}</strong>
                <span className={cn("user-elo", rankClass)}>Elo: {elo}</span>
              </span>
              <ChevronDown
                className={cn(
                  "user-menu-chevron",
                  userMenuOpen && "rotate-180",
                )}
                size={17}
              />
            </button>

            {userMenuOpen && (
              <div className="user-menu-popover">
                <button
                  className="user-menu-option"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/profile");
                  }}
                  type="button"
                >
                  <Pencil size={16} />
                  <span>Edit profile</span>
                </button>
                <button
                  className="user-menu-option danger"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

          {showBattleCta && (
            <button
              className="battle-cta"
              onClick={() => navigate("/battle")}
              type="button"
            >
              <Swords size={22} />
              <span>BATTLE NOW!!</span>
            </button>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
}
