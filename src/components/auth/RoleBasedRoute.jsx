import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isRoleAllowed } from '../../config/roleNavigation';

function RoleBasedRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const userRole = user?.role;

  if (!isRoleAllowed(userRole, allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}

export default RoleBasedRoute;