import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userRole = user?.role || 'student';
  const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">EnglishMaster</div>
      <div className="navbar__user-area">
        <span className="navbar__greeting">Hello, {roleLabel}</span>
        <button type="button" className="navbar__logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;