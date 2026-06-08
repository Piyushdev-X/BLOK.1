import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api';
import TrustBadge from '../components/TrustBadge';
import BottomNav from '../components/BottomNav';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('blok_token');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getMe(token);
      setUser(data);
      setHostelBlock(data["hostel_block"] || '');
      setRoomNumber(data["room_number"] || '');
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    }
    setLoading(false);
  }

  async function handleSave() {
    // TODO: Add PATCH /api/users/me endpoint for profile updates
    setEditing(false);
  }

  function handleLogout() {
    localStorage.removeItem('blok_token');
    localStorage.removeItem('blok_user');
    navigate('/onboarding');
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
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '60px 20px',
        textAlign: 'center',
        color: '#EF4444'
      }}>
        {error || 'Could not load profile'}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#FFFFFF'
    }}>
      {/* Top Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 800
      }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A' }}>
          Profile
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid #EF4444',
            color: '#EF4444',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: '24px', paddingBottom: '80px' }}>
        {/* Avatar + Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '24px',
            flexShrink: 0
          }}>
            {user["full_name"][0].toUpperCase()}
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0A0A0A',
              marginBottom: '4px'
            }}>
              {user["full_name"]}
            </div>
            <TrustBadge trust_score={user["trust_score"]} />
            {user["onboarding_done"] && (
              <span style={{
                marginLeft: '10px',
                background: '#ECFDF5',
                color: '#10B981',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            flex: 1,
            background: '#F9F9F9',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0A0A0A',
              marginBottom: '4px'
            }}>
              {user["tasks_posted"] || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              Tasks Posted
            </div>
          </div>
          <div style={{
            flex: 1,
            background: '#F9F9F9',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0A0A0A',
              marginBottom: '4px'
            }}>
              {user["tasks_completed"] || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              Tasks Completed
            </div>
          </div>
        </div>

        {/* Info Card */}
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
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Campus</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
              {user["campus_id"]}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Hostel Block</span>
            {editing ? (
              <input
                type="text"
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                style={{
                  width: '120px',
                  padding: '4px 8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textAlign: 'right',
                  outline: 'none'
                }}
              />
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
                {user["hostel_block"] || '—'}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Room Number</span>
            {editing ? (
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                style={{
                  width: '120px',
                  padding: '4px 8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textAlign: 'right',
                  outline: 'none'
                }}
              />
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
                {user["room_number"] || '—'}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Trust Score</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
              {Number(user["trust_score"]).toFixed(1)} / 5.0
            </span>
          </div>
        </div>

        {/* Edit / Save Button */}
        {editing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                color: '#6B7280',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#0A0A0A',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default ProfilePage;
