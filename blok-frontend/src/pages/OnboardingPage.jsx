import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../api';

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [campusId, setCampusId] = useState('');
  const [studentIdPhoto, setStudentIdPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Step 2 fields
  const [penaltyAgreement, setPenaltyAgreement] = useState(false);
  const [privacyAgreement, setPrivacyAgreement] = useState(false);

  // Login mode
  const [isLoginMode, setIsLoginMode] = useState(false);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setStudentIdPhoto(file);
      const reader = new FileReader();
      reader.onload = function (event) {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleVerifyAndContinue() {
    setError('');
    if (!email || !password || !fullName || !institutionEmail || !campusId) {
      setError('Please fill in all required fields.');
      return;
    }
    setStep(2);
  }

  async function handleCreateAccount() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        email: email,
        password: password,
        full_name: fullName,
        institution_email: institutionEmail,
        campus_id: campusId,
        penalty_agreement: penaltyAgreement,
        privacy_agreement: privacyAgreement
      };
      if (photoPreview) {
        payload["student_id_photo_url"] = photoPreview;
      }

      await registerUser(payload);

      // Auto-login after registration
      const loginData = await loginUser(email, password);
      localStorage.setItem('blok_token', loginData["access_token"]);
      localStorage.setItem('blok_user', JSON.stringify({
        user_id: loginData["user_id"],
        campus_id: campusId
      }));

      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
    setLoading(false);
  }

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const loginData = await loginUser(email, password);
      localStorage.setItem('blok_token', loginData["access_token"]);
      localStorage.setItem('blok_user', JSON.stringify({
        user_id: loginData["user_id"]
      }));
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
    setLoading(false);
  }

  const bothChecked = penaltyAgreement && privacyAgreement;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F6F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Logo / Brand */}
        <div style={{
          textAlign: 'center',
          marginBottom: '36px'
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '48px',
            fontWeight: 400,
            color: '#3C3935',
            letterSpacing: '0.15em',
            marginBottom: '8px'
          }}>
            B L O K
          </div>
          <div style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '11px',
            color: '#A39E96',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Campus micro-gig marketplace
          </div>
        </div>

        {/* Login Mode */}
        {isLoginMode && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #EAE5DF',
            boxShadow: '0 4px 24px rgba(140, 157, 134, 0.03)'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 500,
              color: '#3C3935',
              marginBottom: '24px',
              letterSpacing: '0.02em'
            }}>
              Welcome Back
            </div>

            {error && (
              <div style={{
                color: '#C07D6D',
                fontSize: '13px',
                marginBottom: '16px',
                padding: '12px 14px',
                background: '#FAF2F0',
                border: '1px solid #EAE5DF',
                borderRadius: '12px',
                lineHeight: 1.5
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: '#798A73',
                color: '#FFFFFF',
                padding: '12px 0',
                width: '100%',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)',
                marginBottom: '18px',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { setIsLoginMode(false); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#798A73',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  letterSpacing: '0.01em'
                }}
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        )}

        {/* Registration Step 1 */}
        {!isLoginMode && step === 1 && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #EAE5DF',
            boxShadow: '0 4px 24px rgba(140, 157, 134, 0.03)'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 500,
              color: '#3C3935',
              marginBottom: '6px',
              letterSpacing: '0.02em'
            }}>
              Verify Identity
            </div>
            <div style={{
              fontSize: '13px',
              color: '#A39E96',
              marginBottom: '24px',
              lineHeight: '1.4'
            }}>
              Join our campus community to continue
            </div>

            {error && (
              <div style={{
                color: '#C07D6D',
                fontSize: '13px',
                marginBottom: '16px',
                padding: '12px 14px',
                background: '#FAF2F0',
                border: '1px solid #EAE5DF',
                borderRadius: '12px',
                lineHeight: 1.5
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Personal Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Institution Email
              </label>
              <input
                type="email"
                value={institutionEmail}
                onChange={(e) => setInstitutionEmail(e.target.value)}
                placeholder="you@university.edu.in"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Campus Name
              </label>
              <input
                type="text"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                placeholder="e.g., IIT-Delhi"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #EAE5DF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3C3935',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A39E96', marginBottom: '6px', display: 'block' }}>
                Student ID Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{
                  color: '#A39E96',
                  fontSize: '12px'
                }}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Student ID preview"
                  style={{
                    marginTop: '10px',
                    borderRadius: '8px',
                    maxHeight: '120px',
                    border: '1px solid #EAE5DF',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>

            <button
              onClick={handleVerifyAndContinue}
              style={{
                background: '#798A73',
                color: '#FFFFFF',
                padding: '12px 0',
                width: '100%',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)',
                marginBottom: '18px'
              }}
            >
              Continue
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { setIsLoginMode(true); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#798A73',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}

        {/* Registration Step 2 — Agreements */}
        {!isLoginMode && step === 2 && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #EAE5DF',
            boxShadow: '0 4px 24px rgba(140, 157, 134, 0.03)'
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '24px',
              fontWeight: 500,
              color: '#3C3935',
              marginBottom: '6px',
              letterSpacing: '0.02em'
            }}>
              Agreements
            </div>
            <div style={{
              fontSize: '13px',
              color: '#A39E96',
              marginBottom: '24px',
              lineHeight: '1.4'
            }}>
              Please accept our community terms to proceed
            </div>

            {error && (
              <div style={{
                color: '#C07D6D',
                fontSize: '13px',
                marginBottom: '16px',
                padding: '12px 14px',
                background: '#FAF2F0',
                border: '1px solid #EAE5DF',
                borderRadius: '12px',
                lineHeight: 1.5
              }}>
                {error}
              </div>
            )}

            {/* Penalty Agreement */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '20px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={penaltyAgreement}
                onChange={(e) => setPenaltyAgreement(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  flexShrink: 0,
                  accentColor: '#798A73'
                }}
              />
              <span style={{
                fontSize: '13px',
                color: '#5C5955',
                lineHeight: '1.5'
              }}>
                I understand that abandoning an accepted task without verified cause will result in a 50% deduction of the task reward from my wallet balance.
              </span>
            </label>

            {/* Privacy Agreement */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '28px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={privacyAgreement}
                onChange={(e) => setPrivacyAgreement(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  flexShrink: 0,
                  accentColor: '#798A73'
                }}
              />
              <span style={{
                fontSize: '13px',
                color: '#5C5955',
                lineHeight: '1.5'
              }}>
                I agree to maintain absolute privacy regarding all peer data accessed through BLOK.
              </span>
            </label>

            <button
              onClick={handleCreateAccount}
              disabled={!bothChecked || loading}
              style={{
                background: '#798A73',
                color: '#FFFFFF',
                padding: '12px 0',
                width: '100%',
                borderRadius: '24px',
                border: 'none',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: (!bothChecked || loading) ? 'not-allowed' : 'pointer',
                opacity: (!bothChecked || loading) ? 0.4 : 1,
                boxShadow: '0 2px 8px rgba(121, 138, 115, 0.2)',
                marginBottom: '18px',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#A39E96',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'block',
                width: '100%',
                textAlign: 'center',
                fontWeight: 500
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;


