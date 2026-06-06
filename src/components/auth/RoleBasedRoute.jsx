import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RoleBasedRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const userRole = user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}

export default RoleBasedRoute;