import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ProtectedRoute, { AdminRoute } from './components/RouteGuards.jsx';
import { PublicLayout, DashboardLayout } from './components/Layouts.jsx';

/* ------------------------------- pages ---------------------------------- */
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ReportLost = lazy(() => import('./pages/ReportLost.jsx'));
const ReportFound = lazy(() => import('./pages/ReportFound.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const ItemDetails = lazy(() => import('./pages/ItemDetails.jsx'));
const Matches = lazy(() => import('./pages/Matches.jsx'));
const MyReports = lazy(() => import('./pages/MyReports.jsx'));
const Claims = lazy(() => import('./pages/Claims.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminItemsList = lazy(() => import('./pages/admin/AdminItemsList.jsx'));
const AdminClaims = lazy(() => import('./pages/admin/AdminClaims.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics.jsx'));
const AdminHeatmap = lazy(() => import('./pages/admin/AdminHeatmap.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));

/* ----------------------------- loading fallback ------------------------- */
function PageFallback() {
  return (
    <div className="route-loading">
      <LoadingSpinner label="Loading FindIt…" />
    </div>
  );
}

/* --------------------------- admin layout helper ------------------------ */
function AdminLayout({ children }) {
  return <DashboardLayout admin>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* public */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Landing />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <Register />
            </PublicLayout>
          }
        />
        <Route
          path="/search"
          element={
            <PublicLayout>
              <Search />
            </PublicLayout>
          }
        />
        <Route
          path="/matches"
          element={
            <PublicLayout>
              <Matches />
            </PublicLayout>
          }
        />
        <Route
          path="/item/:id"
          element={
            <PublicLayout>
              <ItemDetails />
            </PublicLayout>
          }
        />
        <Route
          path="/item/:kind/:id"
          element={
            <PublicLayout>
              <ItemDetails />
            </PublicLayout>
          }
        />

        {/* user dashboard (protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-lost"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReportLost />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-found"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReportFound />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MyReports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/claims"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Claims />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Messages />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* admin (admin only) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/lost-items"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminItemsList />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/found-items"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminItemsList />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/claims"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminClaims />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/heatmap"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminHeatmap />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
