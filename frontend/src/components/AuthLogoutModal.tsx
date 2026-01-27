import React from 'react';

type Props = {
  open: boolean;
  onConfirm: () => void;
};

const AuthLogoutModal: React.FC<Props> = ({ open, onConfirm }) => {
  const [seconds, setSeconds] = React.useState(5);
  React.useEffect(() => {
    if (!open) return;
    setSeconds(5);
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [open]);
  React.useEffect(() => { if (open && seconds <= 0) onConfirm(); }, [seconds, open, onConfirm]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 9999 }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, maxWidth: '95%' }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Signed out</h3>
        <p style={{ marginTop: 0, marginBottom: 16 }}>You were signed out from another tab. You will be redirected to the main site to sign in again.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ color: '#6b7280' }}>Redirecting in {seconds}s</div>
          <div>
            <button onClick={onConfirm} style={{ padding: '8px 12px', background: '#1f2937', color: 'white', border: 'none', borderRadius: 6 }}>Go now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogoutModal;
