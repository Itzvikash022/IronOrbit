import React from 'react';
import { POWERUP_META } from '../shared/config';
import { PowerUpType } from '../shared/types';

export const IronOrbitLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 360 76"
    className={className}
    fill="none"
    aria-label="Iron Orbit"
    role="img"
  >
    {/* Tactical tank reticle crest */}
    <g transform="translate(38, 38)">
      <circle cx="0" cy="0" r="28" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="14 6" />
      <circle cx="0" cy="0" r="20" fill="#131a24" stroke="#475569" strokeWidth="2" />
      {/* Mini tank silhouette */}
      <rect x="-11" y="-9" width="22" height="18" rx="3" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="-13" y="-12" width="26" height="4" rx="1.5" fill="#1e293b" />
      <rect x="-13" y="8" width="26" height="4" rx="1.5" fill="#1e293b" />
      <circle cx="0" cy="0" r="6.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="4" y="-2.2" width="15" height="4.4" rx="1" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.2" />
    </g>

    <text
      x="82"
      y="43"
      fill="#f8fafc"
      fontFamily="'Barlow Condensed', sans-serif"
      fontWeight="800"
      fontSize="44"
      letterSpacing="2"
    >
      IRON ORBIT
    </text>
    <text
      x="84"
      y="62"
      fill="#f59e0b"
      fontFamily="'JetBrains Mono', monospace"
      fontWeight="700"
      fontSize="11.5"
      letterSpacing="3.2"
    >
      2D MULTIPLAYER TANK ARENA
    </text>
  </svg>
);

export const PowerUpSvgIcon: React.FC<{
  type: PowerUpType;
  size?: number;
}> = ({ type, size = 20 }) => {
  const color = POWERUP_META[type].color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {type === 'speed' && (
        <>
          <path d="M4 6L11 12L4 18H8L15 12L8 6H4Z" fill={color} stroke="#0f172a" strokeWidth="1.2" />
          <path d="M11 6L18 12L11 18H15L22 12L15 6H11Z" fill={color} stroke="#0f172a" strokeWidth="1.2" />
        </>
      )}
      {type === 'infinite_ammo' && (
        <path
          d="M8.5 16C6.01 16 4 14.21 4 12C4 9.79 6.01 8 8.5 8C10.5 8 11.7 9.4 12 12C12.3 14.6 13.5 16 15.5 16C17.99 16 20 14.21 20 12C20 9.79 17.99 8 15.5 8C13.5 8 12.3 9.4 12 12C11.7 14.6 10.5 16 8.5 16Z"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}
      {type === 'shield' && (
        <path
          d="M12 3L20 6.5V12.5C20 16.9 16.6 20.7 12 22C7.4 20.7 4 16.9 4 12.5V6.5L12 3Z"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.6"
        />
      )}
      {type === 'rapid_fire' && (
        <>
          <rect x="4" y="5" width="4" height="14" rx="1.5" fill={color} stroke="#0f172a" strokeWidth="1.2" />
          <rect x="10" y="5" width="4" height="14" rx="1.5" fill={color} stroke="#0f172a" strokeWidth="1.2" />
          <rect x="16" y="5" width="4" height="14" rx="1.5" fill={color} stroke="#0f172a" strokeWidth="1.2" />
        </>
      )}
      {type === 'double_damage' && (
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fill={color}
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight="800"
          fontSize="15"
        >
          2X
        </text>
      )}
      {type === 'health_restore' && (
        <path
          d="M9.5 4H14.5V9.5H20V14.5H14.5V20H9.5V14.5H4V9.5H9.5V4Z"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.4"
        />
      )}
      {type === 'extra_ammo' && (
        <>
          <rect x="4" y="6" width="4.5" height="12" rx="1" fill={color} stroke="#0f172a" strokeWidth="1.2" />
          <rect x="9.75" y="6" width="4.5" height="12" rx="1" fill={color} stroke="#0f172a" strokeWidth="1.2" />
          <rect x="15.5" y="6" width="4.5" height="12" rx="1" fill={color} stroke="#0f172a" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
};
