import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getTaskDetail } from '../api';

function ChatPage() {
  const { task_id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('blok_token');
  const storedUser = localStorage.getItem('blok_user');
  const currentUserId = storedUser ? JSON.parse(storedUser)["user_id"] : null;

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [task_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function loadChat() {
    setLoading(true);
    try {
      const taskData = await getTaskDetail(token, task_id);
      setTask(taskData);
      await loadMessages();
    } catch (err) {
      setError(err.message || 'Failed to load chat');
    }
    setLoading(false);
  }

  async function loadMessages() {
    try {
      const msgs = await getMessages(token, task_id);
      setMessages(msgs);
    } catch (err) {
      // Silently fail on poll
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !task) return;

    // Determine receiver
    let receiverId = null;
    if (task["poster_id"] === currentUserId) {
      receiverId = task["performer_id"];
    } else {
      receiverId = task["poster_id"];
    }

    if (!receiverId) {
      setError('No peer assigned to this task yet.');
      return;
    }

    setSending(true);
    try {
      await sendMessage(token, task_id, {
        receiver_id: receiverId,
        body: newMessage.trim()
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      setError(err.message || 'Failed to send');
    }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function getPeerName() {
    if (!task) return 'Peer';
    if (task["poster_id"] === currentUserId) {
      return task["performer_full_name"] || 'Performer';
    }
    return task["poster_full_name"] || 'Poster';
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '60px 20px',
        textAlign: 'center',
        color: '#6B7280'
      }}>
        Loading chat...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF'
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#0A0A0A',
            padding: '0'
          }}
        >
          ←
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#0A0A0A' }}>
            Task Chat
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            with {getPeerName()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {error && (
          <div style={{
            color: '#EF4444',
            fontSize: '13px',
            padding: '10px',
            background: '#FEF2F2',
            borderRadius: '8px',
            marginBottom: '8px'
          }}>
            {error}
          </div>
        )}

        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg["sender_id"] === currentUserId;
          return (
            <div
              key={msg["message_id"]}
              style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isOwn ? '#0A0A0A' : '#F3F4F6',
                color: isOwn ? '#FFFFFF' : '#0A0A0A',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {!isOwn && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6B7280',
                    marginBottom: '4px'
                  }}>
                    {msg["sender_name"] || 'Peer'}
                  </div>
                )}
                <div>{msg["body"]}</div>
                <div style={{
                  fontSize: '10px',
                  color: isOwn ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {new Date(msg["created_at"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        borderTop: '1px solid #E5E7EB',
        padding: '12px 16px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        background: '#FFFFFF',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#0A0A0A',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          style={{
            background: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (sending || !newMessage.trim()) ? 'not-allowed' : 'pointer',
            opacity: (sending || !newMessage.trim()) ? 0.5 : 1,
            fontSize: '16px',
            flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
