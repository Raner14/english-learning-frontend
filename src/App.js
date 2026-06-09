import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import PlaceholderView from './components/common/PlaceholderView';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LessonsPage from './pages/lessons/LessonsPage';
import ProgressPage from './pages/progress/ProgressPage';
import TeachersPage from './pages/teachers/TeachersPage';
import TeacherProfilePage from './pages/teachers/TeacherProfilePage';
import MatchTeacherPage from './pages/teachers/MatchTeacherPage';
import SettingsPage from './pages/settings/SettingsPage';
import StudentsPage from './pages/students/StudentsPage';
import ReviewsPage from './pages/reviews/ReviewsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { APP_ROUTES } from './config/appRoutes';

const REAL_PAGES = {
  '/dashboard': <DashboardPage />,
  '/': <DashboardPage />,
  '/lessons': <LessonsPage />,
  '/progress': <ProgressPage />,
  '/teachers': <TeachersPage />,
  '/match-teacher': <MatchTeacherPage />,
  '/settings': <SettingsPage />,
  '/students': <StudentsPage />,
  '/reviews': <ReviewsPage />,
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;