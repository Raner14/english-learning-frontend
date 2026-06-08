const ROLE_NAVIGATION = {
  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Manage Users', path: '/users' },
    { label: 'Manage Lessons', path: '/lessons' },
    { label: 'Settings', path: '/settings' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Students', path: '/students' },
    { label: 'My Reviews', path: '/reviews' },
    { label: 'Settings', path: '/settings' },
  ],
  student: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Lessons', path: '/lessons' },
    { label: 'My Progress', path: '/progress' },
    { label: 'Teachers', path: '/teachers' },
    { label: 'Match Teacher', path: '/match-teacher' },
    { label: 'Settings', path: '/settings' },
  ],
};

function getLinksByRole(role) {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.student;
}

function isRoleAllowed(userRole, allowedRoles = []) {
  if (!userRole) {
    return false;
  }

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  return allowedRoles.includes(userRole);
}

export { ROLE_NAVIGATION, getLinksByRole, isRoleAllowed };
