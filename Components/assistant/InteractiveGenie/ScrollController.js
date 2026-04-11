'use client';

import React, { useEffect, useState, useRef } from 'react';
import LampAnimation from './LampAnimation';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function ScrollController({ chatbotToggleElement, isChatOpen }) {
  const [animationMode, setAnimationMode] = useState('idle');
  const modeRef = useRef('idle');
  const sequenceRunning = useRef(false);

  const updateMode = (m) => {
    modeRef.current = m;
    setAnimationMode(m);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer = document.querySelector('footer#footer') || document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        const isNearFooter = entry.isIntersecting;
        
        if (isNearFooter && !isChatOpen && !sequenceRunning.current && modeRef.current === 'idle') {
          sequenceRunning.current = true;
          
          updateMode('snap');
          await delay(400);
          
          updateMode('chatbotPop');
          await delay(400);
          
          updateMode('lampAppear');
          await delay(300);
          
          updateMode('genieEnter');
          await delay(1200); // 1.2s for cinematic easing swirl
          
          updateMode('lampIdle');
          sequenceRunning.current = false;

        } else if (!isNearFooter && !sequenceRunning.current && modeRef.current === 'lampIdle') {
          sequenceRunning.current = true;
          
          updateMode('lampRub');
          await delay(600);
          
          updateMode('genieExit');
          await delay(800);
          
          updateMode('chatbotReturn');
          await delay(500);
          
          updateMode('idle');
          sequenceRunning.current = false;
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, [isChatOpen]); // modeRef keeps state without triggering effect loop, observer runs on intersection change

  return (
    <div className="z-[60]">
      <LampAnimation 
        mode={animationMode} 
        chatbotToggleElement={chatbotToggleElement} 
        isChatOpen={isChatOpen}
      />
    </div>
  );
}
