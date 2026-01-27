import React from 'react';

const AuthFallback = () => {
  const isProd = !!(import.meta && import.meta.env && import.meta.env.PROD);
  let frontend = import.meta.env.VITE_FRONTEND_URL;
  if (!frontend) {
    frontend = isProd ? 'https://zixx.in' : `http://${window.location.hostname}`;
  }
  try { const u = new URL(frontend); frontend = u.origin; } catch (e) {}
  const token = localStorage.getItem('token');
  if (token) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
        <h2>Loading...</h2>
      </div>
    );
  }
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
      <h2>This page isn't the main login page</h2>
      <p>If you reached here from the admin app, please go to the site login:</p>
      <a href={`${frontend}/auth`} style={{padding:'8px 12px',background:'#1976d2',color:'#fff',borderRadius:6,textDecoration:'none'}}>Go to site login</a>
      <p style={{color:'#666',marginTop:12}}>Or check that your frontend is running at {frontend}</p>
    </div>
  );
};

export default AuthFallback;
