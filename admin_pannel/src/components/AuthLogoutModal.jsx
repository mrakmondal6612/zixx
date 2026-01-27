import React, { useEffect, useState } from 'react';

export const AuthLogoutModal = ({ open, onConfirm, autoSeconds = 5 }) => {
  const [seconds, setSeconds] = useState(autoSeconds);

  // // add only admin can access this page
  // const { user } = useAuth();

  // if (!user) return null;

  // if (user.role !== 'admin') return null;

  // if (!open) return null;
  


  useEffect(() => {
    if (!open) return;
    setSeconds(autoSeconds);
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [open, autoSeconds]);

  useEffect(() => {
    if (!open) return;
    if (seconds <= 0) onConfirm();
  }, [seconds, open, onConfirm]);

  if (!open) return null;
  return (
    <div style={{position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 9999}}>
      <div style={{background: 'white', padding: 20, borderRadius: 8, width: 360, maxWidth: '90%'}}>
        <h3 style={{margin: 0, marginBottom: 8}}>Signed out</h3>
        <p style={{marginTop: 0, marginBottom: 16}}>You have been signed out. You will be redirected to the main site to sign in again.</p>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
          <div style={{color: '#6b7280'}}>Redirecting in {seconds}s</div>
          <div>
            <button onClick={onConfirm} style={{padding: '8px 12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 6}}>Go now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogoutModal;
