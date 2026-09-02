import React from 'react';

interface TallyLogoProps {
  size?: number;
  color?: string;
}

export const TallyLogo: React.FC<TallyLogoProps> = ({ size = 36, color = 'var(--ha-blue)' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="6" y2="34" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="14" y1="6" x2="14" y2="34" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="22" y1="6" x2="22" y2="34" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="6" x2="30" y2="34" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="2" y1="30" x2="34" y2="10" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};
