import { useState } from "react";
import { loginUser, registerUser } from "../../../lib/api/auth";
import { getAxiosMessage } from "../../../lib/api/http";
import { useAuthStore } from "../../../stores/authStore";
import { Button } from "../../ui/Button";
import { Field, Input } from "../../ui/Form";
import { cn } from "../../../lib/utils/cn";

export function AuthScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState("Ready");

  const submit = async () => {
    try {
      setStatus("Sending request...");
      if (mode === "register") {
        const response = await registerUser(form);
        setStatus(response.message);
        setMode("login");
        return;
      }

      const response = await loginUser({
        email: form.email,
        password: form.password,
      });
      setSession(
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.user,
      );
    } catch (error) {
      setStatus(getAxiosMessage(error));
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)] p-7 text-[var(--text)]">
      <section className="grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_390px] items-end gap-8 max-lg:grid-cols-1">
        <div>
          <p className="kicker">CodeBattle</p>
          <h1 className="m-0 max-w-3xl text-[clamp(42px,6vw,78px)] leading-[0.96]">
            Practice problems. Battle by runtime.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            Solve public practice sets, then take the same editor into realtime
            ranked rooms.
          </p>
        </div>

        <div className="grid gap-3.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-full bg-[#1d1f24] p-1.5">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                className={cn(
                  "min-h-9 rounded-full font-black text-[var(--muted)]",
                  mode === item && "bg-[var(--accent)] text-[#102019]",
                )}
                onClick={() => setMode(item)}
              >
                {item === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <Field label="Username">
              <Input
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </Field>
          )}
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </Field>
          <Button variant="primary" onClick={submit}>
            Enter arena
          </Button>
          <p className="m-0 text-sm text-[var(--muted)]">{status}</p>
        </div>
      </section>
    </main>
  );
}
