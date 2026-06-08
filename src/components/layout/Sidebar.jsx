import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role || 'student';

  function getLinksByRole(role) {
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Manage Users', path: '/users' },
        { label: 'Manage Lessons', path: '/lessons' },
        { label: 'Settings', path: '/settings' },
      ];
    }

    if (role === 'teacher') {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'My Students', path: '/students' },
        { label: 'My Reviews', path: '/reviews' },
        { label: 'Settings', path: '/settings' },
      ];
    }

    return [
      { label: 'Dashboard', path: '/' },
      { label: 'Lessons', path: '/lessons' },
      { label: 'My Progress', path: '/progress' },
      { label: 'Teachers', path: '/teachers' },
      { label: 'Match Teacher', path: '/match-teacher' },
      { label: 'Settings', path: '/settings' },
    ];
  }

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