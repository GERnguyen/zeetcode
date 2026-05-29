import { type FormEvent, useState } from "react";
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
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell grid min-h-dvh place-items-center p-7 text-[var(--text)]">
      <section className="auth-layout grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_390px] items-end gap-8 max-lg:grid-cols-1">
        <div className="auth-copy">
          <p className="kicker">CodeBattle</p>
          <h1 className="m-0 max-w-3xl text-[clamp(42px,6vw,78px)] leading-[0.96]">
            Practice problems. Battle by runtime.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            Solve public practice sets, then take the same editor into realtime
            ranked rooms.
          </p>
        </div>

        <form
          className="auth-card grid gap-3.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-4"
          onSubmit={submit}
        >
          <div className="auth-tablist grid grid-cols-2 gap-1.5 rounded-full p-1.5">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={cn(
                  "auth-tab min-h-9 rounded-full font-black text-[var(--muted)]",
                  mode === item && "auth-tab-active",
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
                autoComplete="username"
                required={mode === "register"}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              autoComplete="email"
              required
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </Field>
          <Button
            className="auth-submit"
            disabled={isSubmitting}
            type="submit"
            variant="primary"
          >
            {isSubmitting && <span className="loading-spinner" aria-hidden="true" />}
            {isSubmitting
              ? mode === "login"
                ? "Entering..."
                : "Creating..."
              : "Enter arena"}
          </Button>
          {status && <p className="auth-status m-0 text-sm">{status}</p>}
        </form>
      </section>
    </main>
  );
}
