import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/userService';
import { logout as logoutRequest } from '../../services/authService';
import { getLinksByRole } from '../../config/roleNavigation';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const userRole = user?.role || '';
  const navLinks = getLinksByRole(userRole);

  useEffect(() => {
    if (!user) return;

    getMe()
      .then((userData) => {
        setDisplayName(`${userData.firstName} ${userData.lastName}`);
      })
      .catch(() => {
        // fallback to role label if the fetch fails
        const role = user.role || 'User';
        setDisplayName(role.charAt(0).toUpperCase() + role.slice(1));
      });
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore backend error — client state is cleared regardless
    }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">Lingua</div>

      <nav className="navbar__nav" aria-label="Main navigation">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar__user-area">
        {userRole && <span className="navbar__role-badge">{userRole}</span>}
        {displayName && <span className="navbar__username">Hello, {displayName}</span>}
        <button type="button" className="navbar__logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
