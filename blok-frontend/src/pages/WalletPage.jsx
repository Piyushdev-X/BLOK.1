import React, { useState, useEffect } from 'react';
import { getMe, topupWallet } from '../api';
import BottomNav from '../components/BottomNav';

function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const token = localStorage.getItem('blok_token');

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    setPageLoading(true);
    try {
      const user = await getMe(token);
      setBalance(user["wallet_balance"]);
    } catch (err) {
      setError(err.message || 'Failed to load wallet');
    }
    setPageLoading(false);
  }

  async function handleTopup() {
    setError('');
    setSuccess('');
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const result = await topupWallet(token, numAmount);
      setBalance(result["wallet_balance"]);
      setAmount('');
      setSuccess('₹' + numAmount.toFixed(0) + ' added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Top-up failed');
    }
    setLoading(false);
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
        zIndex: 800
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          fontSize: '24px',
          color: '#3C3935',
          letterSpacing: '0.05em'
        }}>
          Wallet
        </span>
      </div>

      <div style={{ padding: '24px', paddingBottom: '88px' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAE5DF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(140, 157, 134, 0.02)'
        }}>
          {/* Balance Display */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            padding: '24px 16px',
            background: '#FAF8F5',
            border: '1px solid #EAE5DF',
            borderRadius: '12px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#A39E96',
              marginBottom: '6px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Available Balance
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '44px',
              fontWeight: 500,
              color: '#3C3935',
              lineHeight: 1.1
            }}>
              {pageLoading ? '...' : '₹' + Number(balance).toFixed(0)}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#A39E96',
              marginTop: '6px'
            }}>
              BLOK Credits
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              color: '#C07D6D',
              fontSize: '13px',
              padding: '12px 14px',
              background: '#FAF2F0',
              border: '1px solid #EAE5DF',
              borderRadius: '12px',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              color: '#798A73',
              fontSize: '13px',
              padding: '12px 14px',
              background: '#F0F4EF',
              border: '1px solid #EAE5DF',
              borderRadius: '12px',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              {success}
            </div>
          )}

          {/* Top-up Section */}
          <div style={{
            marginBottom: '24px'
          }}>
            <label style={{
              fontSize: '11px',
              color: '#A39E96',
              marginBottom: '8px',
              display: 'block',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Add Credits
            </label>

            {/* Quick amounts */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(String(val))}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    border: amount === String(val) ? '1px solid #798A73' : '1px solid #EAE5DF',
                    borderRadius: '20px',
                    background: amount === String(val) ? '#F0F4EF' : '#FFFFFF',
                    color: '#3C3935',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Or enter custom amount"
              min="1"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #EAE5DF',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#3C3935',
                outline: 'none',
                marginBottom: '12px',
                background: '#FFFFFF'
              }}
            />
            <button
              onClick={handleTopup}
              disabled={loading || !amount}
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
                cursor: (loading || !amount) ? 'not-allowed' : 'pointer',
                opacity: (loading || !amount) ? 0.5 : 1,
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)'
              }}
            >
              {loading ? 'Adding...' : 'Add Credits'}
            </button>
          </div>

          {/* Note */}
          <div style={{
            fontSize: '11px',
            color: '#A39E96',
            lineHeight: '1.5',
            textAlign: 'center',
            padding: '12px 16px',
            background: '#FAF8F5',
            border: '1px solid #EAE5DF',
            borderRadius: '12px'
          }}>
            Credits are internal to BLOK and non-withdrawable.
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default WalletPage;
