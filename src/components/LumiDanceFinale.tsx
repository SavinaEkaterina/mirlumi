import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LUMI_DANCE_VIDEO } from '../visualSystem/LumiAssetRegistry';

interface LumiDanceFinaleProps {
  soundEnabled: boolean;
  onFinishDance: () => void;
}

export const LumiDanceFinale: React.FC<LumiDanceFinaleProps> = ({
  soundEnabled,
  onFinishDance,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Attempt auto-play when component mounts (after voice phrase has completed)
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true);
          })
          .catch((err) => {
            console.warn('Video autoplay notice:', err);
            // If autoplay is blocked by browser, try playing muted or allow manual tap
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
      }
    }
  }, [soundEnabled]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
      videoRef.current.play().then(() => setHasStarted(true)).catch(() => {});
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-3 px-4 relative overflow-hidden select-none">
      {/* Background Soft Celebration Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full bg-radial from-amber-400/30 via-indigo-500/15 to-transparent blur-2xl"
        />
      </div>

      {/* Title Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="mb-3 z-10 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 border-2 border-amber-300 shadow-md text-amber-950 font-black text-base sm:text-xl"
      >
        <span>🎉</span>
        <span>Танцуем вместе с Луми! ✨</span>
      </motion.div>

      {/* Video Container - Optimized for mobile & desktop with object-contain */}
      <div className="relative w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300/90 bg-slate-950 flex items-center justify-center z-10 group">
        <video
          ref={videoRef}
          src={LUMI_DANCE_VIDEO}
          autoPlay
          playsInline
          controls={false}
          onEnded={onFinishDance}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Play Overlay Button if Autoplay was blocked */}
        {!hasStarted && (
          <button
            type="button"
            onClick={handleManualPlay}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white font-bold cursor-pointer transition-all hover:bg-slate-900/40"
          >
            <span className="w-16 h-16 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform">
              ▶
            </span>
            <span className="text-sm sm:text-base text-amber-200">Нажми, чтобы смотреть танец! 💃</span>
          </button>
        )}
      </div>

      {/* Skip / Finish Button */}
      <div className="mt-4 z-10">
        <button
          type="button"
          onClick={onFinishDance}
          className="px-6 py-2.5 rounded-xl bg-amber-200/90 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm shadow-xs border border-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Завершить танец</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};
