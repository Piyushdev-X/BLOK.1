import React, { useState } from 'react';
import { completeTask } from '../api';

function ProofSubmitModal({ task_id, token, onSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState('passcode');
  const [passcode, setPasscode] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = function (event) {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handlePasscodeSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await completeTask(token, task_id, { passcode: passcode });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to complete task');
    }
    setSubmitting(false);
  }

  async function handlePhotoSubmit() {
    setSubmitting(true);
    setError('');
    try {
      // For now, send the base64 data as the proof_photo_url
      // In production, this would upload to Supabase Storage first
      await completeTask(token, task_id, { proof_photo_url: photoPreview });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to complete task');
    }
    setSubmitting(false);
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A' }}>
            Complete Task
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#6B7280',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <button
            onClick={() => setActiveTab('passcode')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'passcode' ? '2px solid #0A0A0A' : '2px solid transparent',
              fontWeight: activeTab === 'passcode' ? 700 : 400,
              color: activeTab === 'passcode' ? '#0A0A0A' : '#6B7280',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Passcode
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'photo' ? '2px solid #0A0A0A' : '2px solid transparent',
              fontWeight: activeTab === 'photo' ? 700 : 400,
              color: activeTab === 'photo' ? '#0A0A0A' : '#6B7280',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Photo Proof
          </button>
        </div>

        {error && (
          <div style={{
            color: '#EF4444',
            fontSize: '13px',
            marginBottom: '12px',
            padding: '8px 12px',
            background: '#FEF2F2',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}

        {/* Passcode Tab */}
        {activeTab === 'passcode' && (
          <div>
            <input
              type="text"
              placeholder="Enter completion passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#0A0A0A',
                outline: 'none',
                marginBottom: '16px'
              }}
            />
            <button
              onClick={handlePasscodeSubmit}
              disabled={submitting || !passcode}
              style={{
                background: '#0A0A0A',
                color: '#FFFFFF',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting || !passcode ? 0.4 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{
                width: '100%',
                marginBottom: '12px',
                fontSize: '14px'
              }}
            />
            {photoPreview && (
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={photoPreview}
                  alt="Proof preview"
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    maxHeight: '200px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
            <button
              onClick={handlePhotoSubmit}
              disabled={submitting || !photoPreview}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting || !photoPreview ? 0.4 : 1
              }}
            >
              {submitting ? 'Uploading...' : 'Upload & Complete Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProofSubmitModal;
