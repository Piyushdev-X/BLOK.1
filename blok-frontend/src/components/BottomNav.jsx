import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Feed', path: '/feed', icon: '🏠' },
    { label: 'Post Task', path: '/post', icon: '➕' },
    { label: 'Wallet', path: '/wallet', icon: '💰' },
    { label: 'Profile', path: '/profile', icon: '👤' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxWidth: '480px',
      margin: '0 auto',
      height: '60px',
      background: '#FFFFFF',
      borderTop: '1px solid #EAE5DF',
      boxShadow: '0 -2px 10px rgba(140, 157, 134, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 900
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: isActive ? '#798A73' : '#A39E96',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              padding: '6px 0',
              gap: '4px',
              flex: 1,
              height: '100%',
              transition: 'color 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px', filter: isActive ? 'none' : 'grayscale(1)' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default BottomNav;
