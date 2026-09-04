import React from 'react';
import { EyeOff } from 'lucide-react';
import { TallyLogo } from './TallyLogo';

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
        <div className="ha-privacy-overlay">
          <div className="ha-privacy-card" role="dialog" aria-modal="true" aria-labelledby="privacy-screen-title">
            <div className="ha-privacy-brand" aria-hidden="true">
              <TallyLogo size={30} />
            </div>
            <div className="ha-privacy-icon" aria-hidden="true">
              <EyeOff size={24} />
            </div>
            <div id="privacy-screen-title" className="ha-privacy-title">
              Screen hidden for privacy
            </div>
            <p className="ha-privacy-copy">Your household figures are safely obscured.</p>
            <button type="button" className="btn btn-primary ha-privacy-reveal" onClick={onReveal} autoFocus>
              Reveal Tally
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
