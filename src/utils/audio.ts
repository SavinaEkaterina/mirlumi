// Web Audio API Synthesizer for child-friendly sound effects

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let currentDanceMelodyNodes: { stop: () => void }[] = [];

export const stopDanceCelebrationMusic = () => {
  currentDanceMelodyNodes.forEach((node) => {
    try {
      node.stop();
    } catch {}
  });
  currentDanceMelodyNodes = [];
};

export const playDanceCelebrationMusic = (enabled = true): (() => void) => {
  if (!enabled) return () => {};
  try {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    stopDanceCelebrationMusic();

    const now = ctx.currentTime;

    // Cheerful, gentle marimba/xylophone melody (~6.5s)
    const melody = [
      // Phrase 1 (Clap step)
      { note: 523.25, time: 0.0, dur: 0.28 },  // C5
      { note: 659.25, time: 0.35, dur: 0.28 }, // E5
      { note: 783.99, time: 0.7, dur: 0.38 },  // G5
      { note: 659.25, time: 1.15, dur: 0.28 }, // E5
      { note: 880.00, time: 1.5, dur: 0.38 },  // A5

      // Phrase 2 (Stomp step)
      { note: 587.33, time: 2.0, dur: 0.28 },  // D5
      { note: 659.25, time: 2.35, dur: 0.28 }, // E5
      { note: 783.99, time: 2.7, dur: 0.28 },  // G5
      { note: 880.00, time: 3.05, dur: 0.38 }, // A5
      { note: 783.99, time: 3.45, dur: 0.38 }, // G5

      // Phrase 3 (Squat step)
      { note: 659.25, time: 3.9, dur: 0.28 },  // E5
      { note: 783.99, time: 4.25, dur: 0.28 }, // G5
      { note: 987.77, time: 4.6, dur: 0.35 },  // B5
      { note: 1046.50, time: 4.95, dur: 0.45 },// C6

      // Phrase 4 (Free celebration finish chime)
      { note: 783.99, time: 5.4, dur: 0.25 },  // G5
      { note: 880.00, time: 5.65, dur: 0.25 }, // A5
      { note: 1046.50, time: 5.9, dur: 0.8 },  // C6
      { note: 1318.51, time: 5.9, dur: 0.8 },  // E6
    ];

    melody.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);

      currentDanceMelodyNodes.push({
        stop: () => {
          try {
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
            osc.stop(ctx.currentTime + 0.04);
          } catch {}
        },
      });
    });

    return stopDanceCelebrationMusic;
  } catch (err) {
    console.warn('Dance music error:', err);
    return () => {};
  }
};

export const playSound = (type: 'correct' | 'wrong' | 'self_correction' | 'break' | 'click' | 'cheer' | 'hint' | 'bell' | 'drum', enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'bell': {
        // Bright resonant bell chime (crystal clear 2-harmonic sine)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc2.frequency.setValueAtTime(1318.51, now); // E6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        break;
      }

      case 'drum': {
        // Soft acoustic wooden/percussion drum tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'correct': {
        // High cheery 2-tone chord
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

        osc2.frequency.setValueAtTime(659.25, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.05);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        break;
      }

      case 'self_correction': {
        // Uplifting "Aha!" sequence
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(392, now); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.1); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'wrong': {
        // Soft non-punitive gentle low tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.linearRampToValueAtTime(196, now + 0.2); // G3

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'break': {
        // Fun broken electrical zap/wobble for traffic light breakdown
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.1);
        osc.frequency.linearRampToValueAtTime(120, now + 0.25);
        osc.frequency.linearRampToValueAtTime(300, now + 0.35);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'hint': {
        // Gentle bell chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'cheer': {
        // Victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.09;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.15, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.2);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};
