'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenieCharacter, MagicLamp, HandsRubbing, MagicSmoke } from './GenieMascot';

// Custom easings for cinematic feel
const easeSpring = [0.175, 0.885, 0.32, 1.275]; // Classic back-out
const easeCinematic = [0.87, 0, 0.13, 1]; // Smooth acceleration and deceleration

export default function LampAnimation({ mode, chatbotToggleElement, isChatOpen }) {
  // If panel is open, force visually idle
  const effectiveMode = isChatOpen ? 'idle' : mode;

  return (
    <div className="relative flex items-end gap-3 h-32 min-w-[140px] justify-end">
      {/* GLOWS & PARTICLES CONTAINER */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
         <AnimatePresence>
            {effectiveMode === 'snap' && (
               <motion.div 
                 initial={{ scale: 0, opacity: 1 }}
                 animate={{ scale: 3, opacity: 0 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.5, ease: easeCinematic }}
                 className="absolute right-6 bottom-16 w-8 h-8 rounded-full bg-cyan-300 blur-sm mix-blend-screen"
               />
            )}
            {effectiveMode === 'chatbotPop' && (
               <motion.div 
                 initial={{ scale: 0.5, opacity: 1 }}
                 animate={{ scale: 4, opacity: 0 }}
                 transition={{ duration: 0.6, ease: easeCinematic }}
                 className="absolute right-0 bottom-4 w-12 h-12 rounded-full border-2 border-indigo-500 blur-[1px]"
               />
            )}
         </AnimatePresence>
      </div>

      {/* LAMP CONTAINER */}
      <div className="absolute right-0 bottom-0 flex items-center justify-center w-20 h-20 pointer-events-none z-10">
        <AnimatePresence>
          {['lampAppear', 'genieEnter', 'lampIdle', 'lampRub', 'genieExit'].includes(effectiveMode) && (
            <motion.div
              key="lamp-body"
              initial={{ opacity: 0, scale: 0, rotate: -20, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: effectiveMode === 'lampRub' ? [-5, 5, -5, 5, 0] : 0,
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ duration: 0.6, ease: easeSpring }}
              className="absolute z-10"
            >
              <MagicLamp className="w-16 h-16 drop-shadow-[0_10px_20px_rgba(250,204,21,0.6)]" />
              
              {/* Lamp Ambient Glow */}
              <motion.div 
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl -z-10"
              />
            </motion.div>
          )}

          {/* RUBBING HANDS */}
          {effectiveMode === 'lampRub' && (
            <motion.div
              key="hands"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute z-20 top-[-10px] right-2"
            >
              <HandsRubbing className="w-16 h-12" />
            </motion.div>
          )}

          {/* SMOKE EFFECTS */}
          <AnimatePresence>
            {['genieEnter', 'genieExit'].includes(effectiveMode) && (
               <motion.div 
                 key="smoke"
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1.5 }}
                 exit={{ opacity: 0, scale: 2 }}
                 transition={{ duration: 0.8 }}
                 className="absolute bottom-8 right-0 z-30 pointer-events-none"
               >
                 <MagicSmoke className="w-24 h-24 mix-blend-screen" loop={true} />
               </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>

      {/* GENIE CONTAINER */}
      <AnimatePresence>
        {['idle', 'snap', 'chatbotPop', 'lampAppear', 'genieEnter', 'genieExit', 'chatbotReturn'].includes(effectiveMode) && (
          <motion.div
            key="genie-mascot"
            initial={effectiveMode === 'genieExit' ? { opacity: 0, scale: 0, y: 50, x: 20 } : { opacity: 0, scale: 0, x: -50 }}
            animate={
              effectiveMode === 'idle'
                ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                : effectiveMode === 'snap'
                  ? { opacity: 1, scale: 1.1, x: 10, y: -5, rotate: 10 }
                  : effectiveMode === 'lampAppear'
                    ? { opacity: 1, scale: 0.9, x: 15, y: -15, rotate: 15 } // Looks down at lamp
                  : effectiveMode === 'genieEnter'
                    ? { opacity: 0, scale: 0.1, x: 60, y: 50, rotate: 720 } // Swirls in
                  : effectiveMode === 'genieExit'
                    ? { opacity: 1, scale: 1.1, x: 10, y: -10, rotate: -10 } // Bursts out
                  : effectiveMode === 'chatbotReturn'
                    ? { opacity: 1, scale: 1.1, x: 10, y: -5, rotate: 10 } // Snaps chatbot back
                  : { opacity: 1, scale: 1, x: 0, y: 0 }
            }
            exit={{ opacity: 0, scale: 0 }}
            transition={
               ['genieEnter', 'genieExit'].includes(effectiveMode)
                 ? { duration: 1.2, ease: easeCinematic }
                 : { duration: 0.5, type: 'spring', bounce: 0.4 }
            }
            className={`relative z-40 ${effectiveMode === 'idle' ? 'mr-3' : 'absolute right-[4.5rem] bottom-4 pointer-events-none'}`}
          >
            <GenieCharacter className="w-20 h-20 drop-shadow-2xl" />
            
            {/* Ambient magic aura around Genie */}
            <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-2xl -z-10 mix-blend-screen" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHATBOT WIDGET TOGGLE CONTAINER */}
      <AnimatePresence>
        {['idle', 'snap', 'chatbotReturn'].includes(effectiveMode) && (
          <motion.div
            key="chatbot-toggle"
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ 
               opacity: 0, 
               scale: 0.4, 
               y: 20,
               transition: { duration: 0.4, ease: easeCinematic } 
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative z-30 pointer-events-auto"
          >
            {chatbotToggleElement}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
