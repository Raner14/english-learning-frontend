import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
      }}
    >
      <h1 style={{ fontSize: '5rem', margin: '0', color: '#0ea5e9', fontWeight: 800 }}>404</h1>
      <h2 style={{ margin: '8px 0 16px', color: '#0f172a', fontWeight: 600 }}>Page Not Found</h2>
      <p style={{ margin: '0 0 32px', color: '#64748b', maxWidth: '420px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        style={{
          padding: '12px 28px',
          borderRadius: '12px',
          background: '#0ea5e9',
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
