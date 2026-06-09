import { useAuth } from '../../context/AuthContext';
import LessonCatalog from './LessonCatalog';
import LessonsAdminPage from './LessonsAdminPage';
import PlaceholderView from '../../components/common/PlaceholderView';
import './LessonsPage.css';

function LessonsPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'student') return <LessonCatalog />;
  if (role === 'admin') return <LessonsAdminPage />;
  return <PlaceholderView title="Lessons" />;
}

export default LessonsPage;
