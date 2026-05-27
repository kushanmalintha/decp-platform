import { Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();
  const normalizedRole = user?.role?.toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
