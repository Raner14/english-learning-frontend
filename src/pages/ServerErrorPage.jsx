function ServerErrorPage() {
  function handleRetry() {
    window.location.reload();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      }}
    >
      <h1 style={{ fontSize: '5rem', margin: '0', color: '#dc2626', fontWeight: 800 }}>500</h1>
      <h2 style={{ margin: '8px 0 16px', color: '#0f172a', fontWeight: 600 }}>
        Server Error
      </h2>
      <p style={{ margin: '0 0 32px', color: '#64748b', maxWidth: '420px' }}>
        Something went wrong on our end. The server may be temporarily unavailable. Please try again in a moment.
      </p>
      <button
        onClick={handleRetry}
        style={{
          padding: '12px 28px',
          borderRadius: '12px',
          background: '#dc2626',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export default ServerErrorPage;
