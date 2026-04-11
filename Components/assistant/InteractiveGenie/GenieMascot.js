'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const GenieCharacter = ({ className = '' }) => (
  <motion.div
    className={`relative h-20 w-20 shrink-0 ${className}`}
    animate={{ y: [0, -6, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    {/* Body / Smoke tail */}
    <div className="absolute bottom-0 left-1/2 h-11 w-12 -translate-x-1/2 rounded-[18px] bg-gradient-to-b from-slate-900 to-indigo-900 shadow-[0_12px_30px_rgba(15,23,42,0.4)]" />
    
    {/* Head */}
    <div className="absolute bottom-9 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 shadow-[0_10px_24px_rgba(14,116,144,0.3)] flex items-center justify-center">
      {/* Eyes */}
      <div className="absolute top-[14px] left-2 h-2 w-2 rounded-full bg-white/95" />
      <div className="absolute top-[14px] right-2 h-2 w-2 rounded-full bg-white/95" />
      {/* Turban Center Gem */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
    </div>

    {/* Arms (folded) */}
    <div className="absolute bottom-6 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-blue-600 border border-t border-sky-400/30" z-index="10" />
    
    {/* Turban wrapping */}
    <div className="absolute bottom-16 left-1/2 h-4 w-12 -translate-x-1/2 rounded-full bg-indigo-600/90" />
    
    {/* Magic sparkles */}
    <motion.div
      className="absolute bottom-1 left-0 h-1.5 w-1.5 rounded-full bg-sky-200"
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="absolute bottom-4 right-[-4px] h-2 w-2 rounded-full bg-sky-300"
      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
    />
  </motion.div>
);

export const MagicLamp = ({ className = '' }) => (
  <div className={`relative h-20 w-24 shrink-0 flex items-end justify-center ${className}`}>
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_8px_16px_rgba(250,204,21,0.25)]">
      {/* Base */}
      <path d="M40 55 C40 50, 60 50, 60 55 Z" fill="#B48608"/>
      {/* Body */}
      <path d="M25 35 C25 15, 75 15, 75 35 C75 55, 25 55, 25 35 Z" fill="#DAA520"/>
      <path d="M30 35 C30 20, 70 20, 70 35 C70 50, 30 50, 30 35 Z" fill="#F4D03F"/>
      {/* Spout */}
      <path d="M25 35 Q10 35 5 25 Q15 25 28 30 Z" fill="#DAA520"/>
      {/* Handle */}
      <path d="M72 35 C85 35, 95 25, 85 15 C80 10, 70 20, 70 25" stroke="#DAA520" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Lid */}
      <path d="M45 18 C45 10, 55 10, 55 18 Z" fill="#B48608"/>
      <circle cx="50" cy="10" r="3" fill="#F4D03F"/>
    </svg>
  </div>
);

export const HandsRubbing = ({ className = '' }) => (
  <motion.div className={`relative h-16 w-20 ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <motion.path 
        d="M20 70 Q40 40 60 40 Q70 40 80 50 Q70 60 50 60 Q30 60 20 70 Z" 
        fill="#FDE68A"
        animate={{ x: [-5, 5, -5], y: [-2, 2, -2] }}
        transition={{ duration: 0.4, repeat: 3, ease: 'easeInOut' }}
      />
      <motion.path 
        d="M80 30 Q60 60 40 60 Q30 60 20 50 Q30 40 50 40 Q70 40 80 30 Z" 
        fill="#FCD34D"
        animate={{ x: [5, -5, 5], y: [2, -2, 2] }}
        transition={{ duration: 0.4, repeat: 3, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
);

export const MagicSmoke = ({ className = '' }) => (
  <motion.div className={`relative h-24 w-24 ${className}`}>
    <motion.svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <motion.circle cx="30" cy="50" r="15" fill="#38BDF8" className="opacity-60 blur-md"
        animate={{ y: [0, -30], x: [0, -10], scale: [1, 2], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.circle cx="70" cy="60" r="20" fill="#818CF8" className="opacity-60 blur-md"
        animate={{ y: [0, -40], x: [0, 15], scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
      />
      <motion.circle cx="50" cy="40" r="25" fill="#60A5FA" className="opacity-70 blur-xl"
        animate={{ y: [0, -50], scale: [0.8, 3], opacity: [0.7, 0] }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
      />
    </motion.svg>
  </motion.div>
);
