import type { User } from "../../../types/domain";
import { Panel } from "../../ui/Panel";

export function ProfilePage({ user }: { user: User | null }) {
  return (
    <Panel className="max-w-xl p-4">
      <h2 className="m-0 text-xl font-black">Profile</h2>
      <p className="text-[var(--muted)]">{user?.email}</p>
    </Panel>
  );
}
