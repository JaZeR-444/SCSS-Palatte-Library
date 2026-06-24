let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export type SoundType = "click" | "open" | "close" | "success";

export function playSound(type: SoundType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (common browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "open") {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "close") {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "success") {
      // Arpeggio chord (C5 to E5, then G5 to C6)
      const osc1 = ctx.createOscillator();
      const gainNode1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gainNode1.gain.setValueAtTime(0.06, now);
      gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gainNode1);
      gainNode1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6
      gainNode2.gain.setValueAtTime(0.06, now + 0.08);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.33);
    }
  } catch (e) {
    console.warn("playSound failed", e);
  }
}
