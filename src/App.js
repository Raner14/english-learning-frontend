import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import PlaceholderView from './components/common/PlaceholderView';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { APP_ROUTES } from './config/appRoutes';

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
                element={<PlaceholderView title={route.title} />}
              />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;