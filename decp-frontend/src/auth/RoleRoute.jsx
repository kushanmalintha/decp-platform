import { Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
