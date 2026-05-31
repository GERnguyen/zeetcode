import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthEmailAction } from "../../components/features/auth/AuthEmailAction";
import { AuthScreen } from "../../components/features/auth/AuthScreen";
import { BattlePage } from "../../components/features/battle/BattlePage";
import { BattleRoomPage } from "../../components/features/battle/BattleRoomPage";
import { PrivateBattleRoomPage } from "../../components/features/battle/PrivateBattleRoomPage";
import { HistoryPage } from "../../components/features/history/HistoryPage";
import { AppShell } from "../../components/features/layout/AppShell";
import { PracticeHome } from "../../components/features/practice/PracticeHome";
import { ProblemWorkspace } from "../../components/features/practice/ProblemWorkspace";
import { ProfilePage } from "../../components/features/profile/ProfilePage";
import { useMe } from "../../hooks/useMe";
import { useAuthStore } from "../../stores/authStore";

export function AppRouter() {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const meQuery = useMe(Boolean(accessToken));

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      logout();
    }
  }, [meQuery.isError, logout]);

  if (location.pathname.startsWith("/auth/")) {
    return (
      <Routes>
        <Route path="/auth/confirm" element={<AuthEmailAction />} />
        <Route path="/auth/confirm-change" element={<AuthEmailAction />} />
        <Route path="/auth/reset-password" element={<AuthEmailAction />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!accessToken) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/practice" replace />} />
        <Route path="/practice" element={<PracticeHome />} />
        <Route path="/practice/:problemId" element={<ProblemWorkspace />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/battle/room/:roomId" element={<BattleRoomPage />} />
        <Route path="/battle/private/:roomId" element={<PrivateBattleRoomPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
      </Route>
    </Routes>
  );
}
