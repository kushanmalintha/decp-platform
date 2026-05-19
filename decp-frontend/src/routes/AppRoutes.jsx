import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import JobDetails from "../pages/jobs/JobDetails";
import JobList from "../pages/jobs/JobList";
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
      <Route path="/jobs" element={<JobList />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/profile" element={<MyProfile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
