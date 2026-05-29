import { Panel } from "./Panel";

export function Placeholder({ title }: { title: string }) {
  return (
    <Panel className="p-4">
      <h2 className="m-0 text-xl font-black">{title}</h2>
      <p className="text-[var(--muted)]">
        This route is available while the practice rebuild lands.
      </p>
    </Panel>
  );
}
