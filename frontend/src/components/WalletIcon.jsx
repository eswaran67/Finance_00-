import React from 'react';

export default function WalletIcon({ className = "wallet-svg", containerBg = "#0b4c49" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top wallet strap/flap */}
      <rect x="3.5" y="4" width="17" height="3" rx="1.5" fill="#ffffff" />
      {/* Main pouch */}
      <rect x="3.5" y="8" width="17" height="12" rx="2.5" fill="#ffffff" />
      {/* Clasp button hole matching container bg */}
      <circle cx="16" cy="14" r="1.2" fill={containerBg} />
    </svg>
  );
}

