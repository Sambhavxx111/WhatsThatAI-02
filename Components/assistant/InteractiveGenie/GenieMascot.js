'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

// A smart wrapper that tries to load a Lottie from URL, and falls back to a premium SVG if it fails
const LottieWithFallback = ({ url, fallback: FallbackSVG, className, loop = true }) => {
  const [animationData, setAnimationData] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!isCancelled) setHasError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  if (hasError || !animationData) {
    return <FallbackSVG className={className} />;
  }

  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={loop} />
    </div>
  );
};

// Premium Cinematic SVG Fallbacks in case public free Lottie URLs expire
const PremiumGenieSVG = ({ className = '' }) => (
  <motion.div
    className={`relative h-20 w-20 shrink-0 ${className}`}
    animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
  >
    <div className="absolute bottom-0 left-1/2 h-14 w-12 -translate-x-1/2 rounded-[20px] bg-gradient-to-t from-transparent via-cyan-600/80 to-blue-900 shadow-xl blur-[1px]" />
    <div className="absolute bottom-9 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 shadow-[0_0_20px_rgba(34,211,238,0.6)] flex items-center justify-center overflow-hidden">
      <div className="absolute top-[16px] left-[10px] h-2 w-2 rounded-full bg-white shadow-[0_0_5px_white]" />
      <div className="absolute top-[16px] right-[10px] h-2 w-2 rounded-full bg-white shadow-[0_0_5px_white]" />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,1)]" />
    </div>
    <div className="absolute bottom-6 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-blue-600 border border-t border-cyan-300/50 shadow-lg" z-index="10" />
    <div className="absolute bottom-16 left-1/2 h-5 w-14 -translate-x-1/2 rounded-full bg-indigo-700/90 shadow-md" />
  </motion.div>
);

const PremiumLampSVG = ({ className = '' }) => (
  <div className={`relative h-20 w-24 shrink-0 flex items-end justify-center ${className}`}>
    <motion.svg 
      viewBox="0 0 100 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-full h-full drop-shadow-[0_10px_25px_rgba(250,204,21,0.4)]"
      animate={{ filter: ['drop-shadow(0px 10px 25px rgba(250,204,21,0.4))', 'drop-shadow(0px 10px 40px rgba(250,204,21,0.8))', 'drop-shadow(0px 10px 25px rgba(250,204,21,0.4))'] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M40 55 C40 50, 60 50, 60 55 Z" fill="#926B00"/>
      <path d="M25 35 C25 15, 75 15, 75 35 C75 55, 25 55, 25 35 Z" fill="url(#lampGrad)"/>
      <path d="M30 35 C30 20, 70 20, 70 35 C70 50, 30 50, 30 35 Z" fill="#FDE047"/>
      <path d="M25 35 Q10 35 5 25 Q15 25 28 30 Z" fill="url(#lampGrad)"/>
      <path d="M72 35 C85 35, 95 25, 85 15 C80 10, 70 20, 70 25" stroke="url(#lampGrad)" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M45 18 C45 10, 55 10, 55 18 Z" fill="#926B00"/>
      <circle cx="50" cy="10" r="3" fill="#FDE047"/>
      <defs>
        <linearGradient id="lampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </motion.svg>
  </div>
);

const PremiumSmokeSVG = ({ className = '' }) => (
  <motion.div className={`relative h-24 w-24 ${className}`}>
    <motion.svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <motion.circle cx="50" cy="80" r="10" fill="#38BDF8" className="opacity-80 blur-lg"
        animate={{ y: [0, -40], x: [0, -10], scale: [1, 3], opacity: [0.8, 0] }}
        transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity }}
      />
      <motion.circle cx="50" cy="80" r="15" fill="#818CF8" className="opacity-80 blur-xl"
        animate={{ y: [0, -50], x: [0, 20], scale: [1, 4], opacity: [0.8, 0] }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.2, repeat: Infinity }}
      />
      <motion.circle cx="50" cy="80" r="20" fill="#60A5FA" className="opacity-90 blur-2xl"
        animate={{ y: [0, -60], scale: [0.8, 5], opacity: [0.9, 0] }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.4, repeat: Infinity }}
      />
    </motion.svg>
  </motion.div>
);

const PremiumHandsSVG = ({ className = '' }) => (
  <motion.div className={`relative h-16 w-20 ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <motion.path 
        d="M20 70 Q40 40 60 40 Q70 40 80 50 Q70 60 50 60 Q30 60 20 70 Z" 
        fill="#FDE68A"
        animate={{ x: [-8, 8, -8], y: [-3, 3, -3] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path 
        d="M80 30 Q60 60 40 60 Q30 60 20 50 Q30 40 50 40 Q70 40 80 30 Z" 
        fill="#FCD34D"
        animate={{ x: [8, -8, 8], y: [3, -3, 3] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
);

// Lottie Component Wrappers
export const GenieCharacter = ({ className }) => (
  <LottieWithFallback 
    url="https://assets3.lottiefiles.com/packages/lf20_tovnzt22.json" 
    fallback={PremiumGenieSVG} 
    className={className} 
  />
);

export const MagicLamp = ({ className }) => (
  <LottieWithFallback 
    url="https://assets2.lottiefiles.com/packages/lf20_magic_lamp.json" 
    fallback={PremiumLampSVG} 
    className={className} 
  />
);

export const MagicSmoke = ({ className, loop = false }) => (
  <LottieWithFallback 
    url="https://assets1.lottiefiles.com/packages/lf20_smoke.json" 
    fallback={PremiumSmokeSVG} 
    className={className}
    loop={loop}
  />
);

export const HandsRubbing = ({ className }) => (
  <LottieWithFallback 
    url="https://assets4.lottiefiles.com/packages/lf20_hands.json" 
    fallback={PremiumHandsSVG} 
    className={className} 
  />
);
