import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLinksByRole } from '../../config/roleNavigation';
import './Sidebar.css';

function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role || 'student';

  const links = getLinksByRole(userRole);

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => (isActive ? 'sidebar__link active' : 'sidebar__link')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;