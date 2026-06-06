function Loader() {
  return (
    <div
      aria-label="Loading"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '4px solid #cbd5e1',
        borderTopColor: '#2563eb',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

export default Loader;