import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { AuthScreen } from "../../components/features/auth/AuthScreen";
import { AppShell } from "../../components/features/layout/AppShell";
import { PracticeHome } from "../../components/features/practice/PracticeHome";
import { ProblemWorkspace } from "../../components/features/practice/ProblemWorkspace";
import { ProfilePage } from "../../components/features/profile/ProfilePage";
import { Placeholder } from "../../components/ui/Placeholder";
import { useMe } from "../../hooks/useMe";
import { useAuthStore } from "../../stores/authStore";

export function AppRouter() {
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

  if (!accessToken) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/practice" replace />} />
        <Route path="/practice" element={<PracticeHome />} />
        <Route path="/practice/:problemId" element={<ProblemWorkspace />} />
        <Route path="/battle" element={<Placeholder title="Battle room" />} />
        <Route path="/history" element={<Placeholder title="Match history" />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
      </Route>
    </Routes>
  );
}
