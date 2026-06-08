import React from 'react';

function TrustBadge({ trust_score }) {
  let color = '#C07D6D'; // soft terracotta
  if (trust_score >= 4.0) {
    color = '#798A73'; // sage green
  } else if (trust_score >= 2.5) {
    color = '#D1AC8C'; // warm ochre/sand
  }

  return (
    <span style={{
      color: color,
      fontSize: '11px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      letterSpacing: '0.05em'
    }}>
      ★ {Number(trust_score).toFixed(1)}
    </span>
  );
}

export default TrustBadge;
