export default function RouteLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(64, 224, 208, 0.15)',
        borderTopColor: 'var(--accent-color)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>Loading tool...</span>
    </div>
  );
}
