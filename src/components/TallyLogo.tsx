import React from 'react';
import Image from 'next/image';

interface TallyLogoProps {
  size?: number;
}

export const TallyLogo: React.FC<TallyLogoProps> = ({ size = 36 }) => {
  return (
    <Image
      src="/tally-logo.png"
      alt="Tally"
      width={size}
      height={size}
      style={{ borderRadius: size * 0.22, display: 'block' }}
      priority
    />
  );
};
