import React from 'react';
import { EyeOff } from 'lucide-react';

interface PrivacyBlurOverlayProps {
  isBlurred: boolean;
  onReveal: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PrivacyBlurOverlay: React.FC<PrivacyBlurOverlayProps> = ({
  isBlurred,
  onReveal,
  children,
  style,
}) => {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        style={{
          filter: isBlurred ? 'blur(14px)' : 'none',
          transition: 'filter 0.15s ease',
          pointerEvents: isBlurred ? 'none' : 'auto',
          userSelect: isBlurred ? 'none' : 'auto',
        }}
        aria-hidden={isBlurred}
      >
        {children}
      </div>

      {isBlurred && (
        <div
          onClick={onReveal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onReveal();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(244, 246, 242, 0.4)',
            zIndex: 60,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--ha-white)',
              border: '1px solid var(--ha-line)',
              borderRadius: 'var(--ha-radius-lg)',
              boxShadow: 'var(--ha-shadow-elevated)',
              padding: '1.5rem 2rem',
              textAlign: 'center',
            }}
          >
            <EyeOff size={26} color="var(--ha-muted)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700, color: 'var(--ha-ink)', fontSize: '0.95rem' }}>
              Screen hidden for privacy
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ha-muted)', marginTop: '0.25rem' }}>
              Click to reveal
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
