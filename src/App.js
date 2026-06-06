import { useState } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

function createView(title) {
  return function View() {
    return (
      <div
        style={{
          minHeight: '320px',
          padding: '28px',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.75rem' }}>{title}</h2>
      </div>
    );
  };
}

const DashboardView = createView('Dashboard View');
const UsersView = createView('Users View');
const LessonsView = createView('Lessons View');
const StudentsView = createView('Students View');
const ProgressView = createView('Progress View');
const SettingsView = createView('Settings View');
const TeachersView = createView('Teachers View');
const MatchTeacherView = createView('Match Teacher View');
const ReviewsView = createView('Reviews View');

function App() {
  const [currentRole, setCurrentRole] = useState('student');

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 1100,
          display: 'flex',
          gap: '8px',
          padding: '10px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.96)',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
          border: '1px solid #e2e8f0',
        }}
      >
        {['admin', 'teacher', 'student'].map((role) => {
          const isActive = currentRole === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => setCurrentRole(role)}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.7rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: isActive ? '#ffffff' : '#334155',
                background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f8fafc',
                boxShadow: isActive ? '0 8px 18px rgba(37, 99, 235, 0.24)' : 'none',
                transition: 'transform 0.2s ease, background-color 0.2s ease, color 0.2s ease',
              }}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          );
        })}
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout userRole={currentRole}>
                  <Outlet />
                </MainLayout>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/" element={<DashboardView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="/lessons" element={<LessonsView />} />
            <Route path="/students" element={<StudentsView />} />
            <Route path="/progress" element={<ProgressView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/teachers" element={<TeachersView />} />
            <Route path="/match-teacher" element={<MatchTeacherView />} />
            <Route path="/reviews" element={<ReviewsView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;