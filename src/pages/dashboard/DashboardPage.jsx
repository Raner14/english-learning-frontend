import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'student') return <StudentDashboard />;
  if (role === 'teacher') return <TeacherDashboard />;
  if (role === 'admin') return <AdminDashboard />;

  return null;
}

export default DashboardPage;
