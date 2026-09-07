import React from 'react';
import { motion } from 'motion/react';

interface DistractorsProps {
  enabled: boolean;
}

export const Distractors: React.FC<DistractorsProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-70">
      {/* Floating Cloud 1 */}
      <motion.div
        className="absolute top-8 left-6 text-sky-200 text-4xl"
        animate={{ x: [0, 25, 0], y: [0, -5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>

      {/* Floating Cloud 2 */}
      <motion.div
        className="absolute top-16 right-10 text-sky-200 text-5xl"
        animate={{ x: [0, -30, 0], y: [0, 6, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>

      {/* Butterfly */}
      <motion.div
        className="absolute top-1/3 left-12 text-2xl"
        animate={{
          x: [0, 60, 120, 40, 0],
          y: [0, -40, 20, -20, 0],
          rotate: [0, 15, -15, 10, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        🦋
      </motion.div>

      {/* Little Star */}
      <motion.div
        className="absolute bottom-16 right-12 text-amber-200 text-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ⭐
      </motion.div>
    </div>
  );
};
