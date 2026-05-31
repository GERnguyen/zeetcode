import { Panel } from "./Panel";

export function Placeholder({ title }: { title: string }) {
  return (
    <Panel className="placeholder-panel p-5">
      <p className="kicker">Arena wing</p>
      <h2 className="m-0 text-3xl font-black">{title}</h2>
      <p className="text-[var(--muted)]">
        This route is available while the practice rebuild lands.
      </p>
    </Panel>
  );
}
