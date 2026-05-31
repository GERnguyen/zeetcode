import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  confirmPasswordChange,
  confirmSignup,
  resetPassword,
} from "../../../lib/api/auth";
import { getAxiosMessage } from "../../../lib/api/http";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Form";

type ActionState = "loading" | "success" | "error" | "form";

export function AuthEmailAction() {
  const location = useLocation();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") ?? "",
    [location.search],
  );
  const action = location.pathname.split("/").at(-1);
  const [state, setState] = useState<ActionState>(
    action === "reset-password" ? "form" : "loading",
  );
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This link is missing a token.");
      return;
    }

    if (action === "reset-password") {
      return;
    }

    const runAction = async () => {
      try {
        if (action === "confirm") {
          await confirmSignup(token);
          setMessage("Your email has been verified. You can log in now.");
        } else if (action === "confirm-change") {
          await confirmPasswordChange(token);
          setMessage("Your password change has been confirmed.");
        } else {
          throw new Error("Unsupported email action");
        }
        setState("success");
      } catch (error) {
        setMessage(getAxiosMessage(error));
        setState("error");
      }
    };

    runAction();
  }, [action, token]);

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setState("error");
      setMessage("This link is missing a token.");
      return;
    }

    setState("loading");
    try {
      await resetPassword({ token, newPassword });
      setMessage("Your password has been reset. You can log in now.");
      setState("success");
    } catch (error) {
      setMessage(getAxiosMessage(error));
      setState("form");
    }
  };

  return (
    <main className="auth-shell grid min-h-dvh place-items-center p-7 text-[var(--text)]">
      <section className="auth-card auth-action-card grid w-full max-w-md gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] p-5">
        <p className="kicker">Zeetcode</p>
        <h1 className="m-0 text-3xl font-black">
          {action === "reset-password" ? "Reset password" : "Email action"}
        </h1>

        {state === "loading" && (
          <p className="m-0 text-[var(--muted)]">Processing your link...</p>
        )}

        {state === "form" && (
          <form className="grid gap-3" onSubmit={submitReset}>
            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              New password
              <Input
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </label>
            {message && <p className="auth-status m-0 text-sm">{message}</p>}
            <Button type="submit" variant="primary">
              Reset password
            </Button>
          </form>
        )}

        {(state === "success" || state === "error") && (
          <>
            <p className="m-0 text-[var(--muted)]">{message}</p>
            <Link className="auth-action-link" to="/">
              Back to login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
