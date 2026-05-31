import { type ComponentProps, type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
} from "../../../lib/api/auth";
import { getAxiosMessage } from "../../../lib/api/http";
import { useAuthStore } from "../../../stores/authStore";
import { Button } from "../../ui/Button";
import { Field, Input } from "../../ui/Form";
import { cn } from "../../../lib/utils/cn";

export function AuthScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    confirm: false,
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("");
      if (mode === "register") {
        if (form.password !== confirmPassword) {
          setStatus("Passwords do not match.");
          return;
        }

        const response = await registerUser(form);
        setStatus(response.message);
        setMode("login");
        setConfirmPassword("");
        setShowVerifyModal(true);
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

  const submitForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSendingReset) {
      return;
    }

    try {
      setIsSendingReset(true);
      setForgotStatus("");
      const response = await requestPasswordReset({ email: forgotEmail });
      setForgotStatus(response.message);
    } catch (error) {
      setForgotStatus(getAxiosMessage(error));
    } finally {
      setIsSendingReset(false);
    }
  };

  const openForgotPassword = () => {
    setForgotEmail(form.email);
    setForgotStatus("");
    setShowForgotModal(true);
  };

  return (
    <main className="auth-shell grid min-h-dvh place-items-center p-7 text-[var(--text)]">
      <section className="auth-layout grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_390px] items-end gap-8 max-lg:grid-cols-1">
        <div className="auth-copy">
          <p className="kicker">Zeetcode</p>
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
                onClick={() => {
                  setMode(item);
                  setStatus("");
                  setConfirmPassword("");
                }}
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
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              isVisible={visiblePasswords.password}
              onToggleVisibility={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  password: !current.password,
                }))
              }
              value={form.password}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </Field>
          {mode === "register" && (
            <Field label="Confirm password">
              <PasswordInput
                isVisible={visiblePasswords.confirm}
                onToggleVisibility={() =>
                  setVisiblePasswords((current) => ({
                    ...current,
                    confirm: !current.confirm,
                  }))
                }
                value={confirmPassword}
                autoComplete="new-password"
                required
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Field>
          )}
          {mode === "login" && (
            <div className="auth-forgot-row">
              <button type="button" onClick={openForgotPassword}>
                Forgot password?
              </button>
            </div>
          )}
          <Button
            className="auth-submit"
            disabled={isSubmitting}
            type="submit"
            variant="primary"
          >
            {isSubmitting && (
              <span className="loading-spinner" aria-hidden="true" />
            )}
            {isSubmitting
              ? mode === "login"
                ? "Entering..."
                : "Creating..."
              : "Enter arena"}
          </Button>
          {status && <p className="auth-status m-0 text-sm">{status}</p>}
        </form>
      </section>
      {showForgotModal && (
        <div className="auth-modal-backdrop" role="presentation">
          <form
            aria-labelledby="forgot-password-title"
            aria-modal="true"
            className="auth-modal auth-forgot-modal"
            onSubmit={submitForgotPassword}
            role="dialog"
          >
            <p className="kicker">Password recovery</p>
            <h2 id="forgot-password-title">Reset your password</h2>
            <p>
              Enter your account email and we will send a secure reset link.
            </p>
            <Field label="Email">
              <Input
                autoComplete="email"
                autoFocus
                onChange={(event) => {
                  setForgotEmail(event.target.value);
                  setForgotStatus("");
                }}
                required
                type="email"
                value={forgotEmail}
              />
            </Field>
            {forgotStatus && (
              <p className="auth-status auth-forgot-status m-0 text-sm">
                {forgotStatus}
              </p>
            )}
            <div className="auth-modal-actions">
              <Button
                disabled={isSendingReset}
                onClick={() => setShowForgotModal(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                className="auth-modal-action"
                disabled={isSendingReset}
                type="submit"
                variant="primary"
              >
                {isSendingReset && (
                  <span className="loading-spinner" aria-hidden="true" />
                )}
                Send reset link
              </Button>
            </div>
          </form>
        </div>
      )}
      {showVerifyModal && (
        <div className="auth-modal-backdrop" role="presentation">
          <div
            aria-labelledby="verify-email-title"
            aria-modal="true"
            className="auth-modal"
            role="dialog"
          >
            <p className="kicker">Verify email</p>
            <h2 id="verify-email-title">Check your mailbox</h2>
            <p>
              We sent a verification link to your email. Open that link to
              activate your Zeetcode account.
            </p>
            <Button
              className="auth-modal-action"
              onClick={() => setShowVerifyModal(false)}
              variant="primary"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function PasswordInput({
  isVisible,
  onToggleVisibility,
  ...props
}: ComponentProps<typeof Input> & {
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="auth-password-control">
      <Input
        {...props}
        className={cn("auth-password-input", props.className)}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="auth-password-toggle"
        onClick={onToggleVisibility}
        type="button"
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
