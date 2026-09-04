import React from 'react';
import { Eye } from 'lucide-react';

interface SensitiveValueProps {
  revealed: boolean;
  onReveal: () => void;
  children: React.ReactNode;
}

/**
 * Click-to-reveal blur for an individual sensitive figure (salary, monthly
 * total, left-after-bills, etc). Independent of the app-wide privacy screen
 * — stays blurred even when that's switched off — and unblurs only this
 * one value once clicked, not every sensitive figure on the page.
 */
export const SensitiveValue: React.FC<SensitiveValueProps> = ({ revealed, onReveal, children }) => {
  if (revealed) return <>{children}</>;

  return (
    <span
      role="button"
      tabIndex={0}
      title="Click to reveal"
      onClick={(e) => {
        e.stopPropagation();
        onReveal();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onReveal();
        }
      }}
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
    >
      <span aria-hidden="true" style={{ filter: 'blur(7px)', userSelect: 'none', display: 'inline-block' }}>
        {children}
      </span>
      <Eye
        size={13}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'var(--ha-muted)',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};
