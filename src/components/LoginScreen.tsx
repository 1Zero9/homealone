import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types/expense';
import { ArrowRight, KeyRound, CheckCircle2, AlertCircle, Mail, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [householdUsers, setHouseholdUsers] = useState<UserProfile[]>([]);

  // Load existing household accounts for 1-click quick access
  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'ok' && Array.isArray(data.users)) {
          setHouseholdUsers(data.users);
        }
      })
      .catch(() => {});
  }, []);

  // Send Magic OTP Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setGeneratedCode(data.code || null);
        setStep('code');
      } else {
        setErrorMessage(data.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Code and Sign In
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (data.status === 'ok' && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.message || 'Invalid or expired code');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Quick Login for household members
  const handleQuickLogin = async (userId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (data.status === 'ok' && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage(data.message || 'Quick login failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--ha-paper)',
      padding: '1.5rem',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'var(--ha-white)',
        border: '1px solid var(--ha-line)',
        borderRadius: 'var(--ha-radius-lg)',
        boxShadow: 'var(--ha-shadow-elevated)',
        padding: '2.25rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/home-alone-logo-mark.png"
            alt="Home Alone logo mark"
            style={{ height: '48px', width: '48px', objectFit: 'contain', marginBottom: '0.75rem' }}
          />

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--ha-ink)',
            lineHeight: 1.1,
            fontFamily: 'var(--ha-font-display)',
            letterSpacing: '0.02em',
          }}>
            Home Alone
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--ha-muted)', marginTop: '4px' }}>
            Simple records. Clearer days.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div style={{
            backgroundColor: 'var(--ha-red-tint)',
            border: '1px solid var(--ha-red)',
            borderRadius: 'var(--ha-radius-sm)',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--ha-red)',
            fontSize: '0.82rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 'email' ? (
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Email address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="var(--ha-muted)" style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  placeholder="scranfield@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ha-input"
                  style={{ paddingLeft: '2.5rem' }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              <span>{isLoading ? 'Sending code...' : 'Continue with Magic Code'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          /* STEP 2: Enter 6-Digit Code */
          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {generatedCode && (
              <div style={{
                backgroundColor: 'var(--ha-lime-tint)',
                border: '1px solid var(--ha-lime)',
                borderRadius: 'var(--ha-radius-sm)',
                padding: '0.75rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ha-ink)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your 6-Digit Magic Code
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ha-blue)', letterSpacing: '0.2em', marginTop: '0.2rem' }}>
                  {generatedCode}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ha-muted)', marginTop: '0.2rem' }}>
                  Valid for 15 minutes for {email}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
                Enter verification code
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={16} color="var(--ha-muted)" style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  required
                  placeholder="6-digit code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="ha-input tabular-nums"
                  style={{ paddingLeft: '2.5rem', letterSpacing: '0.15em', fontSize: '1.1rem', fontWeight: 600 }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setGeneratedCode(null); }}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.85rem' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: '0.85rem' }}
              >
                <CheckCircle2 size={15} />
                <span>Verify & Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* Household Member 1-Click Quick Access */}
        {householdUsers.length > 0 && (
          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--ha-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ha-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Household Quick Sign-In
              </span>
              <ShieldCheck size={14} color="var(--ha-blue)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {householdUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id)}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--ha-radius-md)',
                    backgroundColor: '#fafaf7',
                    border: '1px solid var(--ha-line)',
                    color: 'var(--ha-ink)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--ha-radius-sm)',
                      backgroundColor: u.role === 'ADMIN' ? 'var(--ha-blue-light)' : u.role === 'BACKUP_ADMIN' ? 'var(--ha-red-tint)' : '#e7e8ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: u.role === 'ADMIN' ? 'var(--ha-blue)' : u.role === 'BACKUP_ADMIN' ? 'var(--ha-red)' : 'var(--ha-ink)',
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ha-muted)' }}>{u.email}</div>
                    </div>
                  </div>

                  <span className={u.role === 'ADMIN' ? 'ha-badge ha-badge-blue' : u.role === 'BACKUP_ADMIN' ? 'ha-badge ha-badge-red' : 'ha-badge ha-badge-neutral'} style={{ fontSize: '0.65rem' }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
