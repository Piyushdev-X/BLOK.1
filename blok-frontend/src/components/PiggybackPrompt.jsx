import React from 'react';

function PiggybackPrompt({ tasks, onAccept, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px 16px 0 0',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: '18px',
          color: '#0A0A0A',
          marginBottom: '4px'
        }}>
          🔁 You're already there!
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '16px'
        }}>
          Pick up an extra task on your route.
        </div>

        {tasks.map((task) => (
          <div
            key={task.task_id}
            style={{
              background: '#F9F9F9',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1, marginRight: '10px' }}>
              <div style={{
                fontWeight: 700,
                fontSize: '14px',
                color: '#0A0A0A',
                marginBottom: '4px'
              }}>
                {task.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6B7280'
              }}>
                {task.base_block} → {task.target_block}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                color: '#10B981',
                fontWeight: 700,
                fontSize: '14px'
              }}>
                ₹{Number(task.reward_amount).toFixed(0)}
              </span>
              <button
                onClick={() => onAccept(task)}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Accept
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={onDismiss}
          style={{
            color: '#6B7280',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            marginTop: '12px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            textAlign: 'center'
          }}
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

export default PiggybackPrompt;
