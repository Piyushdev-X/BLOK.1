import React from 'react';
import TrustBadge from './TrustBadge';

function TaskCard({ task, onAccept, onSkip }) {
  // Compute time left from expires_at
  function getTimeLeft() {
    const now = new Date();
    const expires = new Date(task.expires_at);
    const diffMs = expires - now;
    if (diffMs <= 0) {
      return 'Expired';
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return hours + 'h ' + minutes + 'm left';
    }
    return minutes + 'm left';
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAE5DF',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 4px 20px rgba(140, 157, 134, 0.03)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      {/* Row 1: Title + Reward */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 600,
          fontSize: '20px',
          color: '#3C3935',
          flex: 1,
          marginRight: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em'
        }}>
          {task.title}
        </span>
        <span style={{
          background: '#F0F4EF',
          color: '#798A73',
          borderRadius: '20px',
          padding: '4px 12px',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap'
        }}>
          ₹{Number(task.reward_amount).toFixed(0)}
        </span>
      </div>

      {/* Row 2: Category + Distance */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <span style={{
          border: '1px solid #EAE5DF',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          color: '#A39E96',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500
        }}>
          {task.category}
        </span>
        <span style={{
          fontSize: '12px',
          color: '#A39E96',
          letterSpacing: '0.01em'
        }}>
          {task.base_block} → {task.target_block}
        </span>
      </div>

      {/* Row 3: Time Left */}
      <div style={{
        fontSize: '12px',
        color: '#A39E96',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>⏱</span> <span>{getTimeLeft()}</span>
      </div>

      {/* Row 4: Trust Badge */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <TrustBadge trust_score={task.poster_trust_score || 5.0} />
        <span style={{
          fontSize: '12px',
          color: '#A39E96',
          fontWeight: 400
        }}>
          {task.poster_full_name || 'Anonymous'}
        </span>
      </div>

      {/* Row 5: Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => onAccept(task)}
          style={{
            background: '#798A73',
            color: '#FFFFFF',
            flex: 2,
            padding: '10px 16px',
            borderRadius: '24px',
            border: 'none',
            fontWeight: 500,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)',
            transition: 'opacity 0.2s, transform 0.1s'
          }}
        >
          Accept
        </button>
        <button
          onClick={() => onSkip(task)}
          style={{
            background: '#F4F0EB',
            color: '#A39E96',
            flex: 1,
            padding: '10px 16px',
            borderRadius: '24px',
            border: '1px solid #EAE5DF',
            fontWeight: 500,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
