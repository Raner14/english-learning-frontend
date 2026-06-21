import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import PlaceholderView from './components/common/PlaceholderView';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LessonDetailPage from './pages/lessons/LessonDetailPage';
import LessonVocabPage from './pages/lessons/LessonVocabPage';
import AssessmentPage from './pages/assessment/AssessmentPage';
import ReviewTeacherPage from './pages/reviews/ReviewTeacherPage';
import GrammarPage from './pages/grammar/GrammarPage';
import StudentProgressPage from './pages/students/StudentProgressPage';
import ConversationsPage from './pages/conversations/ConversationsPage';
import ConversationDetailPage from './pages/conversations/ConversationDetailPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LessonsPage from './pages/lessons/LessonsPage';
import ProgressPage from './pages/progress/ProgressPage';
import TeachersPage from './pages/teachers/TeachersPage';
import TeacherProfilePage from './pages/teachers/TeacherProfilePage';
import MatchTeacherPage from './pages/teachers/MatchTeacherPage';
import MyTeachersPage from './pages/teachers/MyTeachersPage';
import SettingsPage from './pages/settings/SettingsPage';
import StudentsPage from './pages/students/StudentsPage';
import ReviewsPage from './pages/reviews/ReviewsPage';
import UsersPage from './pages/users/UsersPage';
import RelationsPage from './pages/relations/RelationsPage';
import WarmUpPage from './pages/exercises/WarmUpPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { APP_ROUTES } from './config/appRoutes';

const REAL_PAGES = {
  '/dashboard': <DashboardPage />,
  '/': <DashboardPage />,
  '/lessons': <LessonsPage />,
  '/progress': <ProgressPage />,
  '/teachers': <TeachersPage />,
  '/my-teachers': <MyTeachersPage />,
  '/match-teacher': <MatchTeacherPage />,
  '/settings': <SettingsPage />,
  '/students': <StudentsPage />,
  '/reviews': <ReviewsPage />,
  '/users': <UsersPage />,
  '/assessment': <AssessmentPage />,
  '/review-teacher': <ReviewTeacherPage />,
  '/grammar': <GrammarPage />,
  '/conversations': <ConversationsPage />,
  '/relations': <RelationsPage />,
  '/exercises': <WarmUpPage />,
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Outlet />
                </MainLayout>
              </ProtectedRoute>
            }
          >
            {APP_ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  REAL_PAGES[route.path] ?? <PlaceholderView title={route.title} />
                }
              />
            ))}
            <Route path="/teachers/:teacherId" element={<TeacherProfilePage />} />
            <Route path="/lessons/:lessonId" element={<LessonDetailPage />} />
            <Route path="/lessons/:lessonId/vocab" element={<LessonVocabPage />} />
            <Route path="/students/:studentId" element={<StudentProgressPage />} />
            <Route path="/conversations/:conversationId" element={<ConversationDetailPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </SocketProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;