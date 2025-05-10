// frontend/src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Page Components (ensure these paths are correct)
import LoginPage from './pages/Login.tsx';
import RegisterPage from './pages/Register.tsx';
import IndexPage from './pages/Index.tsx'; // Main dashboard for regular users
import DocumentsPage from './pages/Documents.tsx';
import UploadPage from './pages/Upload.tsx';
import SearchPage from './pages/Search.tsx';
import ProfilePage from './pages/Profile.tsx';
import PythonIntegrationPage from './pages/PythonIntegration.tsx';
import NotFoundPage from './pages/NotFound.tsx';

// Admin specific pages
import AdminDashboardPage from './pages/Dashboard.tsx'; // Or wherever your AdminDashboard.tsx is
// Note: You listed pages/Dashboard.tsx earlier, ensure correct path for admin one
import AdminDocumentsPage from './pages/Documents.tsx'; // If distinct from user's DocumentsPage
import UserManagementPage from './pages/admin/UserManagement.tsx';
import AdminSettingsPage from './pages/admin/Settings.tsx';

// Layout & Auth Components
import MainLayout from './components/Layout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const userRole = user?.role;

  if (isLoading) {
    return <div>Loading session...</div>; // Or a global loading spinner
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />

      {/* Protected routes (within MainLayout) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout>
              <Outlet />
            </MainLayout>
          </ProtectedRoute>
        }
      >
        {/* Default route for authenticated users */}
        <Route index element={userRole === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <IndexPage />} />

        {/* User routes */}
        <Route path="dashboard" element={<IndexPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="python-integration" element={<PythonIntegrationPage />} />

        {/* Admin-specific section */}
        {userRole === 'admin' && (
          <Route path="admin">
            <Route index element={<Navigate to="dashboard" replace />} /> {/* Redirect /admin to /admin/dashboard */}
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="documents" element={<AdminDocumentsPage />} /> {/* Ensure this is admin specific if needed */}
            <Route path="user-management" element={<UserManagementPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            {/* Add other admin sub-routes here */}
          </Route>
        )}

        {/* Catch-all for any other route not matched within the protected area */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;