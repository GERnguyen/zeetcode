import type { User } from "../../../types/domain";
import { Panel } from "../../ui/Panel";

export function ProfilePage({ user }: { user: User | null }) {
  return (
    <section className="profile-grid grid gap-4">
      <Panel className="profile-hero p-5">
        <p className="kicker">Player card</p>
        <h2 className="m-0 text-4xl font-black">{user?.username ?? "Coder"}</h2>
        <p className="text-[var(--muted)]">{user?.email}</p>
      </Panel>
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <Panel className="stat-card p-4">
          <span className="text-sm font-bold text-[var(--muted)]">ELO</span>
          <strong className="text-3xl">{user?.eloRating ?? 300}</strong>
        </Panel>
        <Panel className="stat-card p-4">
          <span className="text-sm font-bold text-[var(--muted)]">Handle</span>
          <strong className="text-2xl">{user?.username ?? "Coder"}</strong>
        </Panel>
        <Panel className="stat-card p-4">
          <span className="text-sm font-bold text-[var(--muted)]">Status</span>
          <strong className="text-2xl">Active</strong>
        </Panel>
      </div>
    </section>
  );
}
