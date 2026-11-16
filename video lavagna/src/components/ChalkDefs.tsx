import React from 'react';

/**
 * Filtri SVG condivisi: bordi ruvidi e grana "gesso".
 * Si usano con style={{filter: 'url(#chalk)'}} sia su HTML sia su SVG.
 */
export const ChalkDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="11" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.05" result="grainAlpha" />
        <feComposite in="rough" in2="grainAlpha" operator="in" result="grainy" />
        <feGaussianBlur in="grainy" stdDeviation="0.35" />
      </filter>
    </defs>
  </svg>
);
