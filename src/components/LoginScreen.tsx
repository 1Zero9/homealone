import React, { useState } from 'react';
import type { UserProfile } from '../types/expense';
import { ArrowRight, KeyRound, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

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

  // Send Magic OTP Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });

      const data = await res.json();
      if (data.status === 'ok' && data.user) {
        try {
          localStorage.setItem('homealone_user', JSON.stringify(data.user));
        } catch {}
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
        maxWidth: '420px',
        width: '100%',
        backgroundColor: 'var(--ha-white)',
        border: '1px solid var(--ha-line)',
        borderRadius: 'var(--ha-radius-lg)',
        boxShadow: 'var(--ha-shadow-elevated)',
        padding: '2.5rem 2rem',
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
            fontSize: '2.1rem',
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
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.4rem' }}>
                Your email address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="var(--ha-muted)" style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. scranfield@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ha-input"
                  style={{ paddingLeft: '2.5rem' }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
                We'll send a 6-digit magic code to sign in or create your account.
              </p>
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
                padding: '0.85rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--ha-ink)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your 6-Digit Magic Code
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ha-blue)', letterSpacing: '0.2em', marginTop: '0.2rem' }}>
                  {generatedCode}
                </div>
                <button
                  type="button"
                  onClick={() => setCode(generatedCode)}
                  style={{
                    marginTop: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--ha-blue)',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Click to autofill code
                </button>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ha-ink)', display: 'block', marginBottom: '0.35rem' }}>
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
                  onChange={(e) => setCode(e.target.value.trim())}
                  className="ha-input tabular-nums"
                  style={{ paddingLeft: '2.5rem', letterSpacing: '0.15em', fontSize: '1.15rem', fontWeight: 600 }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--ha-muted)', marginTop: '0.35rem' }}>
                Sent to <strong>{email}</strong>
              </p>
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
                disabled={isLoading || code.length < 6}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: '0.85rem' }}
              >
                <CheckCircle2 size={15} />
                <span>Verify & Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
