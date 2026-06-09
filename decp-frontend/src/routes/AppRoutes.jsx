import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";
import MainLayout from "../layouts/MainLayout";
import RoleManagement from "../pages/admin/RoleManagement";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import Feed from "../pages/feed/Feed";
import PostDetails from "../pages/feed/PostDetails";
import CreateJob from "../pages/jobs/CreateJob";
import EditJob from "../pages/jobs/EditJob";
import JobApplications from "../pages/jobs/JobApplications";
import JobDetails from "../pages/jobs/JobDetails";
import JobList from "../pages/jobs/JobList";
import MyApplications from "../pages/jobs/MyApplications";
import RecruiterDashboard from "../pages/jobs/RecruiterDashboard";
import SavedJobs from "../pages/jobs/SavedJobs";
import Notifications from "../pages/notifications/Notifications";
import EditProfile from "../pages/profile/EditProfile";
import MyProfile from "../pages/profile/MyProfile";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/feed/posts/:id" element={<PostDetails />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/jobs" element={<JobList />} />
      <Route
        path="/jobs/create"
        element={
          <RoleRoute allowedRoles={["ALUMNI", "ADMIN"]}>
            <CreateJob />
          </RoleRoute>
        }
      />
      <Route
        path="/jobs/:id/edit"
        element={
          <RoleRoute allowedRoles={["ALUMNI", "ADMIN"]}>
            <EditJob />
          </RoleRoute>
        }
      />
      <Route
        path="/jobs/:id/applications"
        element={
          <RoleRoute allowedRoles={["ALUMNI"]}>
            <JobApplications />
          </RoleRoute>
        }
      />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route
        path="/recruiter/dashboard"
        element={
          <RoleRoute allowedRoles={["ALUMNI"]}>
            <RecruiterDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/jobs/saved"
        element={
          <RoleRoute allowedRoles={["STUDENT"]}>
            <SavedJobs />
          </RoleRoute>
        }
      />
      <Route
        path="/applications/me"
        element={
          <RoleRoute allowedRoles={["STUDENT"]}>
            <MyApplications />
          </RoleRoute>
        }
      />
      <Route path="/profile" element={<MyProfile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route
        path="/admin/roles"
        element={
          <RoleRoute allowedRoles={["ADMIN"]}>
            <RoleManagement />
          </RoleRoute>
        }
      />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
