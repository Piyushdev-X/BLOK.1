import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskDetail, acceptTask, startTask, disputeTask } from '../api';
import TrustBadge from '../components/TrustBadge';
import ProofSubmitModal from '../components/ProofSubmitModal';
import BottomNav from '../components/BottomNav';

function TaskDetailPage() {
  const { task_id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('blok_token');
  const storedUser = localStorage.getItem('blok_user');
  const currentUserId = storedUser ? JSON.parse(storedUser)["user_id"] : null;

  useEffect(() => {
    loadTask();
  }, [task_id]);

  async function loadTask() {
    setLoading(true);
    try {
      const data = await getTaskDetail(token, task_id);
      setTask(data);
    } catch (err) {
      setError(err.message || 'Failed to load task');
    }
    setLoading(false);
  }

  async function handleAccept() {
    setActionLoading(true);
    try {
      await acceptTask(token, task_id);
      await loadTask();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  }

  async function handleStart() {
    setActionLoading(true);
    try {
      await startTask(token, task_id);
      await loadTask();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  }

  async function handleDispute() {
    setActionLoading(true);
    try {
      await disputeTask(token, task_id);
      await loadTask();
    } catch (err) {
      setError(err.message);
    }
    setActionLoading(false);
  }

  function handleProofSuccess() {
    setShowProofModal(false);
    loadTask();
  }

  function getTimeLeft() {
    if (!task) return '';
    const now = new Date();
    const expires = new Date(task["expires_at"]);
    const diffMs = expires - now;
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return hours + 'h ' + minutes + 'm left';
    return minutes + 'm left';
  }

  function getStateBadgeStyle(state) {
    let bg = '#F4F0EB';
    let color = '#A39E96';
    if (state === 'Published' || state === 'Completed') {
      bg = '#F0F4EF';
      color = '#798A73';
    } else if (state === 'Accepted') {
      bg = '#FAF5F0';
      color = '#D1AC8C';
    } else if (state === 'In-Progress') {
      bg = '#FDFBF7';
      color = '#B89C8C';
    } else if (state === 'Disputed') {
      bg = '#FAF2F0';
      color = '#C07D6D';
    }
    return {
      background: bg,
      color: color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      display: 'inline-block',
      marginBottom: '16px',
      border: '1px solid ' + (state === 'Disputed' ? '#EAE5DF' : bg)
    };
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '80px 20px',
        textAlign: 'center',
        color: '#A39E96',
        fontSize: '14px',
        letterSpacing: '0.02em',
        background: '#F9F6F0',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>✧</div>
        Loading task...
      </div>
    );
  }

  if (error && !task) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '80px 20px',
        textAlign: 'center',
        color: '#C07D6D',
        background: '#FAF2F0',
        border: '1px solid #EAE5DF',
        borderRadius: '16px',
        margin: '24px'
      }}>
        {error}
      </div>
    );
  }

  if (!task) return null;

  const isPoster = task["poster_id"] === currentUserId;
  const isPerformer = task["performer_id"] === currentUserId;

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#F9F6F0'
    }}>

      {/* Top Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#F9F6F0',
        borderBottom: '1px solid #EAE5DF',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 800
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#3C3935',
            padding: '0'
          }}
        >
          ←
        </button>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          fontSize: '22px',
          color: '#3C3935',
          letterSpacing: '0.05em'
        }}>
          Task Details
        </span>
      </div>

      {/* Task Content */}
      <div style={{ padding: '24px', paddingBottom: '88px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAE5DF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(140, 157, 134, 0.02)'
        }}>
          {error && (
            <div style={{
              color: '#C07D6D',
              fontSize: '13px',
              padding: '14px',
              background: '#FAF2F0',
              border: '1px solid #EAE5DF',
              borderRadius: '12px',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              {error}
            </div>
          )}

          {/* State Badge */}
          <div style={getStateBadgeStyle(task["task_state"])}>
            {task["task_state"]}
          </div>

          {/* Title + Reward */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '12px'
          }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#3C3935',
              flex: 1,
              lineHeight: '1.25',
              letterSpacing: '0.01em',
              margin: 0
            }}>
              {task["title"]}
            </h1>
            <span style={{
              background: '#F0F4EF',
              color: '#798A73',
              borderRadius: '20px',
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap'
            }}>
              ₹{Number(task["reward_amount"]).toFixed(0)}
            </span>
          </div>


        {/* Description */}
        <p style={{
          fontSize: '14px',
          color: '#374151',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          {task["description"]}
        </p>

        {/* Info Grid */}
        <div style={{
          background: '#F9F9F9',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Category</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{task["category"]}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Route</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
              {task["base_block"]} → {task["target_block"]}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Pricing</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{task["pricing_type"]}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Time Left</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{getTimeLeft()}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0'
          }}>
            <span style={{ fontSize: '13px', color: '#A39E96' }}>Remote</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3C3935' }}>
              {task["is_remote"] ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Poster Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '14px 16px',
          background: '#FAF8F5',
          border: '1px solid #EAE5DF',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#E9EFE6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#798A73',
            fontWeight: 600,
            fontSize: '15px'
          }}>
            {(task["poster_full_name"] || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#3C3935', marginBottom: '2px' }}>
              {task["poster_full_name"] || 'Unknown'}
            </div>
            <TrustBadge trust_score={task["poster_trust_score"] || 5.0} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Published — can accept */}
          {task["task_state"] === 'Published' && !isPoster && (
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              style={{
                background: '#798A73',
                color: '#FFFFFF',
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)'
              }}
            >
              {actionLoading ? 'Accepting...' : 'Accept Task'}
            </button>
          )}

          {/* Accepted — performer can start */}
          {task["task_state"] === 'Accepted' && isPerformer && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              style={{
                background: '#D1AC8C',
                color: '#FFFFFF',
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(209, 172, 140, 0.2)'
              }}
            >
              {actionLoading ? 'Starting...' : 'Start Task'}
            </button>
          )}

          {/* In-Progress — performer can complete */}
          {task["task_state"] === 'In-Progress' && isPerformer && (
            <button
              onClick={() => setShowProofModal(true)}
              style={{
                background: '#798A73',
                color: '#FFFFFF',
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)'
              }}
            >
              Mark Complete
            </button>
          )}

          {/* Chat button — for poster or performer on active tasks */}
          {(isPoster || isPerformer) && task["performer_id"] && (
            <button
              onClick={() => navigate('/chat/' + task_id)}
              style={{
                background: '#FFFFFF',
                color: '#798A73',
                width: '100%',
                padding: '12px',
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
              💬 Open Chat
            </button>
          )}

          {/* Dispute — poster or performer on active tasks */}
          {(isPoster || isPerformer) &&
            task["task_state"] !== 'Completed' &&
            task["task_state"] !== 'Expired' &&
            task["task_state"] !== 'Disputed' &&
            task["task_state"] !== 'Published' && (
            <button
              onClick={handleDispute}
              disabled={actionLoading}
              style={{
                background: '#FAF2F0',
                color: '#C07D6D',
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: '1px solid #EAE5DF',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              ⚠ Raise Dispute
            </button>
          )}

          {/* Rate — after completion */}
          {task["task_state"] === 'Completed' && (isPoster || isPerformer) && (
            <button
              onClick={() => navigate('/task/' + task_id + '/rate')}
              style={{
                background: '#FAF5F0',
                color: '#D1AC8C',
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: '1px solid #EAE5DF',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ★ Rate Peer
            </button>
          )}
        </div>
      </div>
      </div>


      {/* Proof Submit Modal */}
      {showProofModal && (
        <ProofSubmitModal
          task_id={task_id}
          token={token}
          onSuccess={handleProofSuccess}
          onClose={() => setShowProofModal(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default TaskDetailPage;
