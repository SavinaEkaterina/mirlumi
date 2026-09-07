import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { speakLumi } from '../utils/voiceManager';
import {
  getLumiAssetPath,
  LUMI_ASSETS,
  normalizeLumiState,
  LumiState,
} from '../visualSystem/LumiAssetRegistry';

interface LumiProps {
  emotion?: LumiState | string;
  state?: LumiState | string;
  message?: string;
  speechBubble?: string;
  subText?: string;
  speaking?: boolean;
  size?: 'small' | 'medium' | 'large';
  soundEnabled?: boolean;
  autoSpeak?: boolean;
  className?: string;
  showBubble?: boolean;
  onClick?: () => void;
}

export const LumiCharacter: React.FC<LumiProps> = ({
  emotion,
  state,
  message,
  speechBubble,
  subText,
  speaking = false,
  size = 'medium',
  soundEnabled = true,
  autoSpeak = false,
  className = '',
  showBubble = true,
  onClick,
}) => {
  const rawState = emotion || state;
  const normalizedState = normalizeLumiState(rawState);

  // Expressive emotional states (support, happy, victory, clap, surprised, thinking, retry, etc.)
  // must take absolute priority over generic 'speaking'.
  // 'speaking' asset is only used when no explicit expressive emotional state is set.
  const currentState =
    rawState && normalizedState !== 'neutral' && normalizedState !== 'speaking'
      ? normalizedState
      : speaking
      ? 'speaking'
      : normalizedState;
  const actualMessage = message || speechBubble || '';
  const lastSpokenRef = useRef<string>('');

  // Synchronously derive image source with fallback tracking if image fails to load
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());

  const targetSrc = getLumiAssetPath(currentState);
  const imgSrc = failedAssets.has(targetSrc) ? LUMI_ASSETS.neutral : targetSrc;

  const handleImageError = () => {
    if (targetSrc !== LUMI_ASSETS.neutral && !failedAssets.has(targetSrc)) {
      console.warn(`Lumi asset for state '${currentState}' failed to load at ${targetSrc}, falling back to lumi_neutral.webp`);
      setFailedAssets((prev) => new Set(prev).add(targetSrc));
    }
  };

  // Auto-speak when message changes (if autoSpeak is enabled)
  useEffect(() => {
    if (autoSpeak && actualMessage && actualMessage !== lastSpokenRef.current) {
      lastSpokenRef.current = actualMessage;
      speakLumi(actualMessage, { soundEnabled, speechKey: 'lumi_char_' + actualMessage });
    }
  }, [actualMessage, autoSpeak, soundEnabled]);

  const handleReplaySpeech = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onClick) {
      onClick();
    }
    if (actualMessage) {
      speakLumi(actualMessage, { soundEnabled, force: true, cancelPrevious: true });
    }
  };

  // Size classes for responsive layout
  const avatarSizeClass =
    size === 'small'
      ? 'w-12 h-12 sm:w-16 sm:h-16'
      : size === 'large'
      ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32'
      : 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24';

  const avatarNode = (
    <motion.div
      onClick={handleReplaySpeech}
      title="Нажми на Луми, чтобы послушать ещё раз! 🔊"
      className="relative shrink-0 flex flex-col items-center justify-center group select-none cursor-pointer z-10"
      animate={
        currentState === 'victory' || currentState === 'clap'
          ? { y: [0, -3, 0], scale: [1, 1.02, 1], rotate: [0, 1.5, -1.5, 0] }
          : currentState === 'surprised' || currentState === 'attention'
          ? { scale: [1, 1.02, 1] }
          : currentState === 'speaking'
          ? { y: [0, -2, 0], scale: [1, 1.01, 1] }
          : { y: [0, -2, 0] }
      }
      transition={{
        duration: currentState === 'victory' || currentState === 'clap' ? 0.8 : 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Bounded Inner Frame Container with object-contain & overflow-hidden */}
      <div className={`relative ${avatarSizeClass} overflow-hidden rounded-2xl flex items-center justify-center p-1 bg-amber-100/50 border border-amber-200/60 shadow-2xs shrink-0`}>
        <img
          src={imgSrc}
          alt={`Персонаж Луми - ${currentState}`}
          onError={handleImageError}
          className="w-full h-full object-contain filter drop-shadow-xs select-none pointer-events-none"
        />
      </div>

      {/* Floating badge for voice indicator */}
      <span className="mt-1 bg-amber-200/90 text-amber-950 font-black text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs flex items-center gap-0.5 group-hover:bg-amber-300 transition-colors pointer-events-none shrink-0">
        <span>Луми</span>
        <span className="text-[8px] sm:text-[9px]">🔊</span>
      </span>
    </motion.div>
  );

  // If bubble is turned off or there is no message, render avatar standalone
  if (!showBubble || !actualMessage) {
    return (
      <div className={`inline-flex flex-col items-center justify-center p-1 relative z-10 ${className}`}>
        {avatarNode}
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto flex flex-row items-center gap-2.5 sm:gap-4 bg-amber-50/95 border-2 border-amber-200/90 rounded-2xl p-2.5 sm:p-4 shadow-xs my-1.5 sm:my-2 transition-all relative overflow-hidden ${className}`}
    >
      {avatarNode}

      {/* Speech Bubble Container */}
      <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={handleReplaySpeech}>
        <div className="relative bg-white border-2 border-amber-300 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs group hover:border-amber-400 transition-colors overflow-hidden">
          {/* Pointer arrow on left side */}
          <div className="hidden sm:block absolute -left-2 top-4 sm:top-5 w-0 h-0 border-t-6 border-t-transparent border-r-6 border-r-amber-300 border-b-6 border-b-transparent" />
          <div className="hidden sm:block absolute -left-1.5 top-4 sm:top-5 w-0 h-0 border-t-5 border-t-transparent border-r-5 border-r-white border-b-5 border-b-transparent" />

          <div className="flex items-center justify-between gap-1.5">
            <p className="text-amber-950 font-bold text-xs sm:text-base leading-snug break-words min-w-0 flex-1">
              {actualMessage}
            </p>
            <button
              type="button"
              onClick={handleReplaySpeech}
              className="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 shrink-0 cursor-pointer text-xs sm:text-sm min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Послушать голос Луми"
            >
              🔊
            </button>
          </div>

          {subText && (
            <p className="text-amber-800 text-[10px] sm:text-xs mt-1 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 inline-block break-words max-w-full">
              {subText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
