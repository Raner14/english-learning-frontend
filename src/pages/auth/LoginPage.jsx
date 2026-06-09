import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/forms/LoginForm';
import { useAuth } from '../../context/AuthContext';
import { login as loginRequest } from '../../services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const justRegistered = location.state?.registered === true;

  // Already authenticated — send straight to dashboard
  if (user?.token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async ({ email, password }) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      const userData = await loginRequest(email, password);
      const token = userData?.token;

      if (!token || !userData) {
        throw new Error('Login failed.');
      }

      login(token, userData);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(
        error?.response?.data?.error?.message || error.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          borderRadius: '24px',
          background: '#ffffff',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', color: '#0f172a' }}>Sign in</h1>
        <p style={{ margin: '0 0 24px', color: '#475569' }}>Welcome back to Lingua.</p>

        {justRegistered && (
          <p style={{
            margin: '0 0 16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#16a34a',
            fontSize: '0.88rem',
          }}>
            Account created! Please sign in.
          </p>
        )}

        {serverError && (
          <p style={{ margin: '0 0 16px', color: '#dc2626', fontSize: '0.95rem' }}>{serverError}</p>
        )}

        <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;