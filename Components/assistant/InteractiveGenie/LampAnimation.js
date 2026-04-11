'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenieCharacter, MagicLamp, HandsRubbing, MagicSmoke } from './GenieMascot';

export default function LampAnimation({ mode, chatbotToggleElement, isChatOpen }) {
  // We use local state to track micro-animations during transitions
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (mode === 'disappearing') {
      // Sequence: 
      // 0: Look at chatbot & snap
      // 1: Chatbot disappears, lamp appears
      // 2: Genie orbits and smoke appears
      setStep(0);
      const t1 = setTimeout(() => setStep(1), 400);
      const t2 = setTimeout(() => setStep(2), 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (mode === 'reappearing') {
      // Sequence:
      // 0: Hands rub lamp
      // 1: Smoke appears, Genie emerges
      // 2: Snap, chatbot reappears
      setStep(0);
      const t1 = setTimeout(() => setStep(1), 800);
      const t2 = setTimeout(() => setStep(2), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [mode]);

  // If the chat panel is open, we just force the 'chatbot' mode visually without animations
  const effectiveMode = isChatOpen ? 'chatbot' : mode;

  return (
    <div className="relative flex items-end gap-3 h-24 min-w-[140px] justify-end">
      {/* LAMP CONTAINER */}
      <div className="absolute right-0 bottom-0 flex items-center justify-center w-16 h-16 pointer-events-none">
        <AnimatePresence>
          {(effectiveMode === 'lamp' || effectiveMode === 'disappearing' || effectiveMode === 'reappearing') && (
            <motion.div
              key="lamp"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ 
                opacity: (effectiveMode === 'disappearing' && step >= 1) || effectiveMode === 'lamp' || (effectiveMode === 'reappearing' && step <= 1) ? 1 : 0, 
                scale: 1, 
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ duration: 0.4 }}
              className="absolute z-10"
            >
              <MagicLamp />
            </motion.div>
          )}

          {/* RUBBING HANDS */}
          {effectiveMode === 'reappearing' && step === 0 && (
            <motion.div
              key="hands"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-20 top-[-10px]"
            >
              <HandsRubbing />
            </motion.div>
          )}

          {/* SMOKE EFFECTS */}
          {effectiveMode === 'disappearing' && step === 2 && (
             <motion.div key="smoke-disappear" className="absolute bottom-6 right-2 z-30 pointer-events-none">
               <MagicSmoke />
             </motion.div>
          )}
          {effectiveMode === 'reappearing' && step >= 1 && step < 2 && (
             <motion.div key="smoke-appear" className="absolute bottom-6 right-2 z-30 pointer-events-none">
               <MagicSmoke />
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GENIE CONTAINER */}
      <AnimatePresence>
        {(effectiveMode === 'chatbot' || effectiveMode === 'disappearing' || effectiveMode === 'reappearing') && (
          <motion.div
            key="genie"
            initial={{ opacity: 0, scale: 0 }}
            animate={
              effectiveMode === 'disappearing'
                ? step === 0 
                  ? { rotate: 15, scale: 1.1, x: 10 } // Look at chatbot
                  : step === 1 
                  ? { rotate: 0, scale: 1, x: 0 } // Snap
                  : { opacity: 0, scale: 0.2, x: 50, y: 20, rotate: 360 } // Enters lamp
                : effectiveMode === 'reappearing'
                  ? step === 0
                    ? { opacity: 0, scale: 0 } // Hidden in lamp
                    : step === 1
                    ? { opacity: 1, scale: 1, y: -20, x: -20 } // Emerges from smoke
                    : { opacity: 1, scale: 1, y: 0, x: 0 } // Settles
                  : { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 } // Chatbot mode
            }
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className={`relative z-20 ${effectiveMode === 'chatbot' ? 'mr-2' : 'absolute right-16 bottom-2 z-40 pointer-events-none'}`}
          >
            <GenieCharacter />
            
            {/* SNAP GLOW */}
            {((effectiveMode === 'disappearing' && step === 1) || (effectiveMode === 'reappearing' && step === 2)) && (
               <motion.div 
                 initial={{ scale: 0, opacity: 1 }}
                 animate={{ scale: 2.5, opacity: 0 }}
                 transition={{ duration: 0.4 }}
                 className="absolute -right-4 top-10 w-4 h-4 bg-yellow-300 rounded-full blur-[2px]"
               />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHATBOT TOGGLE CONTAINER */}
      <AnimatePresence>
        {(effectiveMode === 'chatbot' || (effectiveMode === 'disappearing' && step === 0) || (effectiveMode === 'reappearing' && step === 2)) && (
          <motion.div
            key="chatbot-btn"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: effectiveMode === 'disappearing' && step >= 1 ? 0 : 1, 
              scale: effectiveMode === 'disappearing' && step >= 1 ? 0 : 1
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative z-30 pointer-events-auto"
          >
            {chatbotToggleElement}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
