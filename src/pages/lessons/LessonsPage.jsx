import { useAuth } from '../../context/AuthContext';
import LessonCatalog from './LessonCatalog';
import PlaceholderView from '../../components/common/PlaceholderView';
import './LessonsPage.css';

function LessonsPage() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <LessonCatalog />;
  }

  // Admin: lesson management will be implemented in a later stage
  return <PlaceholderView title="Lesson Management" />;
}

export default LessonsPage;
