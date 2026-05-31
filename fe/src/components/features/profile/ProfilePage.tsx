import { useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { requestPasswordChange, updateMe } from "../../../lib/api/auth";
import { getAxiosMessage } from "../../../lib/api/http";
import { useAuthStore } from "../../../stores/authStore";
import type { User } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Form";
import { Panel } from "../../ui/Panel";

function rankInfo(elo = 300) {
  if (elo > 1400) return { label: "Gold", className: "gold" };
  if (elo >= 1000) return { label: "Green", className: "green" };
  return { label: "Iron", className: "iron" };
}

function joinedText(createdAt?: string) {
  if (!createdAt) return "Recently joined";
  const created = new Date(createdAt).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  if (diffDays < 1) return "Joined today";
  if (diffDays < 30) return `Joined ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Joined ${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `Joined ${years} year${years === 1 ? "" : "s"} ago`;
}

export function ProfilePage({ user }: { user: User | null }) {
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState(user?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  const rank = useMemo(() => rankInfo(user?.eloRating ?? 300), [user?.eloRating]);

  const updateProfileMutation = useMutation({
    mutationFn: () => updateMe({ username: username.trim() }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setProfileMessage("Username updated.");
    },
    onError: (error) => setProfileMessage(getAxiosMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      return requestPasswordChange({ currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Confirmation email sent. Check your inbox to finish the password change.");
    },
    onError: (error) => setPasswordMessage(getAxiosMessage(error)),
  });

  const usernameChanged = username.trim() && username.trim() !== user?.username;
  const passwordReady =
    currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <section className="profile-page grid gap-5">
      <Panel className="profile-hero-card">
        <div className="profile-identity">
          <div className="profile-avatar">
            <UserRound size={34} />
          </div>
          <div>
            <p className="kicker">Player card</p>
            <h2>{user?.username ?? "Coder"}</h2>
            <span>{user?.email}</span>
          </div>
        </div>
        <div className={`profile-elo-badge ${rank.className}`}>
          <Sparkles size={24} />
          <div>
            <span>{rank.label} rank</span>
            <strong>{user?.eloRating ?? 300}</strong>
          </div>
        </div>
      </Panel>

      <div className="profile-stat-grid">
        <Panel className="profile-stat-card">
          <ShieldCheck size={22} />
          <span>Status</span>
          <strong>Active</strong>
        </Panel>
        <Panel className="profile-stat-card">
          <CalendarDays size={22} />
          <span>Account age</span>
          <strong>{joinedText(user?.createdAt)}</strong>
        </Panel>
        <Panel className="profile-stat-card">
          <KeyRound size={22} />
          <span>Security</span>
          <strong>Email verified flow</strong>
        </Panel>
      </div>

      <div className="profile-settings-grid">
        <Panel className="profile-settings-card">
          <div className="profile-card-heading">
            <h3>Edit profile</h3>
            <p>Change your public handle instantly.</p>
          </div>
          <label>
            Username
            <Input
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setProfileMessage("");
              }}
            />
          </label>
          <Button
            disabled={!usernameChanged || updateProfileMutation.isPending}
            onClick={() => updateProfileMutation.mutate()}
            variant="primary"
          >
            {updateProfileMutation.isPending && <Loader2 className="animate-spin" size={17} />}
            Save username
          </Button>
          {profileMessage && <p className="profile-message">{profileMessage}</p>}
        </Panel>

        <Panel className="profile-settings-card">
          <div className="profile-card-heading">
            <h3>Change password</h3>
            <p>We will send a confirmation link to your email.</p>
          </div>
          <label>
            Current password
            <ProfilePasswordInput
              isVisible={visiblePasswords.current}
              onToggleVisibility={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  current: !current.current,
                }))
              }
              value={currentPassword}
              autoComplete="current-password"
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setPasswordMessage("");
              }}
            />
          </label>
          <label>
            New password
            <ProfilePasswordInput
              isVisible={visiblePasswords.next}
              onToggleVisibility={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  next: !current.next,
                }))
              }
              value={newPassword}
              autoComplete="new-password"
              onChange={(event) => {
                setNewPassword(event.target.value);
                setPasswordMessage("");
              }}
            />
          </label>
          <label>
            Confirm password
            <ProfilePasswordInput
              isVisible={visiblePasswords.confirm}
              onToggleVisibility={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  confirm: !current.confirm,
                }))
              }
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setPasswordMessage("");
              }}
            />
          </label>
          <Button
            disabled={!passwordReady || passwordMutation.isPending}
            onClick={() => passwordMutation.mutate()}
            variant="primary"
          >
            {passwordMutation.isPending && <Loader2 className="animate-spin" size={17} />}
            Send confirmation email
          </Button>
          {passwordMessage && <p className="profile-message">{passwordMessage}</p>}
        </Panel>
      </div>
    </section>
  );
}

function ProfilePasswordInput({
  isVisible,
  onToggleVisibility,
  ...props
}: ComponentProps<typeof Input> & {
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="profile-password-control">
      <Input
        {...props}
        className={`profile-password-input ${props.className ?? ""}`.trim()}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="profile-password-toggle"
        onClick={onToggleVisibility}
        type="button"
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
