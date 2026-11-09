import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function playNewOrderSound() {
  // 1. Mobile Haptics
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 250);
  } catch {}

  // 2. Web Audio Context Synthesizer (Instant, 0 assets, 100% reliable)
  try {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        // Note 1: 587.33 Hz (D5) - soft bell
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Note 2: 880 Hz (A5) - ascending chime
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.16);
        gain2.gain.setValueAtTime(0.4, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.16);
        osc2.stop(now + 0.55);

        // Note 3: 1174.66 Hz (D6) - bright chime finish
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(1174.66, now + 0.32);
        gain3.gain.setValueAtTime(0.35, now + 0.32);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.32);
        osc3.stop(now + 0.85);
      }
    }
  } catch (err) {
    console.warn('Sound alert error:', err);
  }
}

