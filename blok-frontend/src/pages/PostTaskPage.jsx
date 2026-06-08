import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postTask } from '../api';
import PriceAdvisoryWidget from '../components/PriceAdvisoryWidget';
import BottomNav from '../components/BottomNav';

function PostTaskPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('blok_token');
  const storedUser = localStorage.getItem('blok_user');
  const campusId = storedUser ? JSON.parse(storedUser)["campus_id"] : '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricingType, setPricingType] = useState('Flat Reward');
  const [rewardAmount, setRewardAmount] = useState('');
  const [baseBlock, setBaseBlock] = useState('');
  const [targetBlock, setTargetBlock] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [completionPasscode, setCompletionPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Errand',
    'Delivery',
    'Academic Support',
    'Queue Stander',
    'Moving Help',
    'Other'
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title || !description || !category || !rewardAmount || !baseBlock || !targetBlock || !expiresAt) {
      setError('Please fill in all required fields.');
      return;
    }

    if (title.length > 60) {
      setError('Title must be 60 characters or fewer.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title,
        description: description,
        category: category,
        pricing_type: pricingType,
        reward_amount: parseFloat(rewardAmount),
        campus_id: campusId,
        base_block: baseBlock,
        target_block: targetBlock,
        is_remote: isRemote,
        expires_at: new Date(expiresAt).toISOString()
      };

      if (deadlineAt) {
        payload["deadline_at"] = new Date(deadlineAt).toISOString();
      }
      if (completionPasscode) {
        payload["completion_passcode"] = completionPasscode;
      }

      await postTask(token, payload);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Failed to post task');
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #EAE5DF',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#3C3935',
    outline: 'none',
    background: '#FFFFFF',
    transition: 'border-color 0.2s ease'
  };

  const labelStyle = {
    fontSize: '11px',
    color: '#A39E96',
    marginBottom: '6px',
    display: 'block',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

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
        zIndex: 800
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          fontSize: '24px',
          color: '#3C3935',
          letterSpacing: '0.05em'
        }}>
          Post a Task
        </span>
      </div>

      <div style={{ padding: '24px', paddingBottom: '88px' }}>
        <form onSubmit={handleSubmit} style={{
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

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="What do you need done?"
            style={inputStyle}
          />
          <div style={{
            textAlign: 'right',
            fontSize: '12px',
            color: title.length > 55 ? '#EF4444' : '#6B7280',
            marginTop: '4px'
          }}>
            {title.length}/60
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed instructions..."
            rows={4}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              ...inputStyle,
              appearance: 'auto'
            }}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Pricing Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Pricing Type</label>
          <select
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value)}
            style={{
              ...inputStyle,
              appearance: 'auto'
            }}
          >
            <option value="Flat Reward">Flat Reward</option>
            <option value="Variable Reimbursement + Reward">Variable Reimbursement + Reward</option>
          </select>
        </div>

        {/* Reward Amount */}
        <div style={{ marginBottom: '4px' }}>
          <label style={labelStyle}>Reward Amount (₹)</label>
          <input
            type="number"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            min="0"
            placeholder="50"
            style={inputStyle}
          />
        </div>

        {/* Price Advisory Widget */}
        <div style={{ marginBottom: '16px' }}>
          <PriceAdvisoryWidget
            category={category}
            base_block={baseBlock}
            target_block={targetBlock}
            campus_id={campusId}
            token={token}
          />
        </div>

        {/* Base Block */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Base Block (from)</label>
          <input
            type="text"
            value={baseBlock}
            onChange={(e) => setBaseBlock(e.target.value)}
            placeholder="e.g., Block A"
            style={inputStyle}
          />
        </div>

        {/* Target Block */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Target Block (to)</label>
          <input
            type="text"
            value={targetBlock}
            onChange={(e) => setTargetBlock(e.target.value)}
            placeholder="e.g., Main Gate"
            style={inputStyle}
          />
        </div>

        {/* Remote Toggle */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#10B981'
              }}
            />
            <span style={{ fontSize: '14px', color: '#0A0A0A' }}>
              This is a remote task
            </span>
          </label>
        </div>

        {/* Expiry */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Expiry Date & Time</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Deadline (optional) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Deadline (optional)</label>
          <input
            type="datetime-local"
            value={deadlineAt}
            onChange={(e) => setDeadlineAt(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Completion Passcode (optional) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Completion Passcode (optional)</label>
          <input
            type="text"
            value={completionPasscode}
            onChange={(e) => setCompletionPasscode(e.target.value)}
            placeholder="Secret passcode for verification"
            style={inputStyle}
          />
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            If set, the performer must enter this to mark the task complete.
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#798A73',
            color: '#FFFFFF',
            width: '100%',
            padding: '12px 20px',
            borderRadius: '24px',
            border: 'none',
            fontWeight: 500,
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)',
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Posting...' : 'Post Task'}
        </button>
      </form>
      </div>

      <BottomNav />
    </div>
  );
}

export default PostTaskPage;
