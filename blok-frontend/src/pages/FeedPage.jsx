import React, { useState, useEffect } from 'react';
import { getTaskFeed, acceptTask, getPiggybackTasks, getMe } from '../api';
import TaskCard from '../components/TaskCard';
import PiggybackPrompt from '../components/PiggybackPrompt';
import BottomNav from '../components/BottomNav';

function FeedPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [campusName, setCampusName] = useState('');
  const [confirmationTaskId, setConfirmationTaskId] = useState(null);
  const [piggybackTasks, setPiggybackTasks] = useState([]);
  const [showPiggyback, setShowPiggyback] = useState(false);

  const token = localStorage.getItem('blok_token');

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    setError('');
    try {
      // Get user info first
      const user = await getMe(token);
      setWalletBalance(user["wallet_balance"]);
      setCampusName(user["campus_id"]);

      // Store campus_id for future use
      const storedUser = localStorage.getItem('blok_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed["campus_id"] = user["campus_id"];
        localStorage.setItem('blok_user', JSON.stringify(parsed));
      }

      const feedData = await getTaskFeed(token, user["campus_id"]);
      setTasks(feedData);
    } catch (err) {
      setError(err.message || 'Failed to load feed');
      if (err.message && (err.message.includes('User not found') || err.message.includes('Unauthorized') || err.message.includes('not authorized') || err.message.includes('Token'))) {
        localStorage.removeItem('blok_token');
        localStorage.removeItem('blok_user');
        setTimeout(() => {
          window.location.href = '/onboarding';
        }, 2000);
      }
    }
    setLoading(false);
  }

  async function handleAccept(task) {
    try {
      await acceptTask(token, task["task_id"]);
      setConfirmationTaskId(task["task_id"]);

      // Remove from feed after brief confirmation
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t["task_id"] !== task["task_id"]));
        setConfirmationTaskId(null);
      }, 1500);

      // Check piggyback
      try {
        const piggyback = await getPiggybackTasks(token, task["task_id"]);
        if (piggyback.length > 0) {
          setPiggybackTasks(piggyback);
          setShowPiggyback(true);
        }
      } catch (e) {
        // Piggyback check is non-critical
      }
    } catch (err) {
      setError(err.message || 'Failed to accept task');
    }
  }

  function handleSkip(task) {
    setTasks((prev) => prev.filter((t) => t["task_id"] !== task["task_id"]));
  }

  async function handlePiggybackAccept(task) {
    try {
      await acceptTask(token, task["task_id"]);
      setPiggybackTasks((prev) => prev.filter((t) => t["task_id"] !== task["task_id"]));
      if (piggybackTasks.length <= 1) {
        setShowPiggyback(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to accept piggyback task');
    }
  }

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
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 800
      }}>
        <div>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 500,
            fontSize: '26px',
            color: '#3C3935',
            letterSpacing: '0.12em'
          }}>
            B L O K
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#A39E96',
            marginLeft: '12px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {campusName}
          </span>
        </div>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAE5DF',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#3C3935',
          letterSpacing: '0.05em'
        }}>
          ₹{Number(walletBalance).toFixed(0)}
        </div>
      </div>

      {/* Feed Content */}
      <div style={{
        padding: '20px 24px',
        paddingBottom: '88px'
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
            letterSpacing: '0.01em',
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#A39E96',
            fontSize: '14px',
            letterSpacing: '0.02em'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>✧</div>
            <span>Loading tasks...</span>
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#A39E96',
            background: '#FFFFFF',
            border: '1px solid #EAE5DF',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(140, 157, 134, 0.02)'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 500,
              color: '#3C3935',
              marginBottom: '10px',
              letterSpacing: '0.05em'
            }}>
              No tasks available
            </div>
            <div style={{
              fontSize: '13px',
              lineHeight: '1.6',
              maxWidth: '240px',
              margin: '0 auto',
              color: '#A39E96'
            }}>
              Check back later or post a task yourself!
            </div>
          </div>
        )}

        {tasks.map((task) => (
          <div key={task["task_id"]}>
            <TaskCard
              task={task}
              onAccept={handleAccept}
              onSkip={handleSkip}
            />
            {confirmationTaskId === task["task_id"] && (
              <div style={{
                color: '#10B981',
                fontSize: '14px',
                fontWeight: 700,
                textAlign: 'center',
                padding: '8px',
                marginBottom: '12px',
                animation: 'fadeIn 0.3s ease'
              }}>
                Task Locked In ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Piggyback Modal */}
      {showPiggyback && piggybackTasks.length > 0 && (
        <PiggybackPrompt
          tasks={piggybackTasks}
          onAccept={handlePiggybackAccept}
          onDismiss={() => setShowPiggyback(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default FeedPage;
