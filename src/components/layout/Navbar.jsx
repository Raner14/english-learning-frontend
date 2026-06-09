import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/userService';
import { logout as logoutRequest } from '../../services/authService';
import { getLinksByRole } from '../../config/roleNavigation';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const userRole = user?.role || '';
  const navLinks = getLinksByRole(userRole);

  useEffect(() => {
    if (!user) return;

    getMe()
      .then((userData) => {
        setDisplayName(`${userData.firstName} ${userData.lastName}`);
      })
      .catch(() => {
        const role = user.role || 'User';
        setDisplayName(role.charAt(0).toUpperCase() + role.slice(1));
      });
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logoutRequest();
    } catch {
      // ignore backend error — client state is cleared regardless
    }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
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

          <button
            type="button"
            className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="navbar__backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={`navbar__mobile-menu${menuOpen ? ' navbar__mobile-menu--open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="navbar__mobile-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                isActive
                  ? 'navbar__mobile-link navbar__mobile-link--active'
                  : 'navbar__mobile-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar__mobile-footer">
          {displayName && (
            <p className="navbar__mobile-username">{displayName}</p>
          )}
          {userRole && (
            <span className="navbar__mobile-role">{userRole}</span>
          )}
          <button
            type="button"
            className="navbar__mobile-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
