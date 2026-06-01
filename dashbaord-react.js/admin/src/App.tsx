import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { LoginGate } from "./components/LoginGate";
import { OverviewPage } from "./pages/OverviewPage";
import { UsersPage } from "./pages/UsersPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CommentsPage } from "./pages/CommentsPage";
import { LogsPage } from "./pages/LogsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGate />} />
      <Route element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
