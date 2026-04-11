'use client';

import React, { useEffect, useState } from 'react';
import LampAnimation from './LampAnimation';

/**
 * ScrollController manages the IntersectionObserver to detect the footer and
 * delegates the animation state to the LampAnimation component.
 */
export default function ScrollController({ chatbotToggleElement, isChatOpen }) {
  // States: 'chatbot' | 'disappearing' | 'lamp' | 'reappearing'
  const [animationMode, setAnimationMode] = useState('chatbot');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer = document.querySelector('footer#footer') || document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isNearFooter = entry.isIntersecting;
        
        // Only trigger animations if the chat panel is NOT open
        if (isNearFooter && animationMode === 'chatbot' && !isChatOpen) {
          setAnimationMode('disappearing');
          setTimeout(() => {
            setAnimationMode('lamp');
          }, 1500); // 1.5s for the disappearing + entering lamp sequence
        } else if (!isNearFooter && animationMode === 'lamp') {
          setAnimationMode('reappearing');
          setTimeout(() => {
            setAnimationMode('chatbot');
          }, 2000); // 2s for reappearing sequence
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
  }, [animationMode, isChatOpen]);

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
