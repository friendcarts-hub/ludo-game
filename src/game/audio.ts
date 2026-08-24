// Web Audio API Synthesizer Engine for rich, zero-latency game sound effects
import { useState, useEffect } from 'react';

type SoundStateListener = (isMuted: boolean, volume: number) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private listeners: Set<SoundStateListener> = new Set();
  private hasInitializedListeners: boolean = false;

  constructor() {
    // Load persisted mute & volume preferences
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('ludoverse_sound_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('ludoverse_sound_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
      this.attachUnlockListeners();
    }
  }

  /**
   * Automatically unlocks AudioContext on first user interaction (browser policy compliant)
   */
  private attachUnlockListeners() {
    if (this.hasInitializedListeners || typeof window === 'undefined') return;
    this.hasInitializedListeners = true;

    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Subscribe to sound setting changes (mute / volume updates)
   */
  public subscribe(listener: SoundStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isMuted, this.volume);
      } catch {
        // Ignored
      }
    });
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludoverse_sound_muted', String(this.isMuted));
    }
    this.notify();
    if (!this.isMuted) {
      // Play brief playful chirp as unmute feedback
      this.playClick();
    }
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludoverse_sound_muted', String(this.isMuted));
    }
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludoverse_sound_volume', String(this.volume));
    }
    this.notify();
  }

  // ==========================================
  // SYNTHESIZED SOUND EFFECTS (Web Audio API)
  // ==========================================

  /**
   * UI Click - subtle tactile pop
   */
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignored
    }
  }

  /**
   * UI Error / Access Denied - low double buzz sound
   */
  public playError() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [180, 140];
      notes.forEach((freq, idx) => {
        const toneTime = now + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, toneTime);

        gain.gain.setValueAtTime(0.18 * this.volume, toneTime);
        gain.gain.exponentialRampToValueAtTime(0.001, toneTime + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(toneTime);
        osc.stop(toneTime + 0.09);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Rolling the dice - realistic multi-impact clattering wood tumble
   */
  public playDiceRoll() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const impacts = 6;
      for (let i = 0; i < impacts; i++) {
        const timeOffset = i * 0.058 + Math.random() * 0.015;
        const now = this.ctx.currentTime + timeOffset;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'triangle' : 'square';
        const baseFreq = 260 + Math.random() * 240;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, now + 0.04);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        const currentImpactVol = (0.22 - i * 0.025) * this.volume;
        gain.gain.setValueAtTime(Math.max(0.04, currentImpactVol), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
      }

      // Crisp final landing click
      const finalNow = this.ctx.currentTime + 0.38;
      const finalOsc = this.ctx.createOscillator();
      const finalGain = this.ctx.createGain();
      finalOsc.type = 'sine';
      finalOsc.frequency.setValueAtTime(420, finalNow);
      finalOsc.frequency.exponentialRampToValueAtTime(110, finalNow + 0.06);

      finalGain.gain.setValueAtTime(0.18 * this.volume, finalNow);
      finalGain.gain.exponentialRampToValueAtTime(0.001, finalNow + 0.06);

      finalOsc.connect(finalGain);
      finalGain.connect(this.ctx.destination);
      finalOsc.start(finalNow);
      finalOsc.stop(finalNow + 0.06);
    } catch {
      // Ignored
    }
  }

  /**
   * Moving a Ludo piece / pawn step - tactile melodic step
   */
  public playPawnStep(stepPitchOffset: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 540 + Math.min(stepPitchOffset * 25, 400);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.07);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch {
      // Ignored
    }
  }

  /**
   * Moving multiple squares in sequence
   */
  public playMultiStep(stepCount: number = 3) {
    if (this.isMuted) return;
    const count = Math.min(6, Math.max(1, stepCount));
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playPawnStep(i);
      }, i * 75);
    }
  }

  /**
   * Pawn exits base home yard onto track
   */
  public playExitBase() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [440, 659.25]; // A4 -> E5
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.16 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Star safe zone entry chime
   */
  public playSafeStar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.065;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.14 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Pawn captured / knocked out - impactful bass punch & slide
   */
  public playCapture() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low punch oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      // Secondary snap
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(800, now + 0.04);
      snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

      snapGain.gain.setValueAtTime(0.15 * this.volume, now + 0.04);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now + 0.04);
      snapOsc.stop(now + 0.18);
    } catch {
      // Ignored
    }
  }

  /**
   * Pawn enters home runway
   */
  public playHomeStretch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Pawn enters central home triangle
   */
  public playHomeGoal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Claiming Rewards - bright, sparkling gold coins chime & arpeggio
   */
  public playClaimReward() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const arpeggio = [
        { freq: 523.25, time: 0.0 },  // C5
        { freq: 659.25, time: 0.06 }, // E5
        { freq: 783.99, time: 0.12 }, // G5
        { freq: 987.77, time: 0.18 }, // B5
        { freq: 1046.5, time: 0.24 }, // C6
        { freq: 1318.5, time: 0.32 }, // E6
      ];

      arpeggio.forEach((note) => {
        const now = this.ctx!.currentTime + note.time;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now);

        gain.gain.setValueAtTime(0.18 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });

      // Shimmer overlay
      const shimmerNow = this.ctx.currentTime + 0.24;
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(1567.98, shimmerNow); // G6
      shimmerGain.gain.setValueAtTime(0.12 * this.volume, shimmerNow);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerNow + 0.45);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);
      shimmerOsc.start(shimmerNow);
      shimmerOsc.stop(shimmerNow + 0.45);
    } catch {
      // Ignored
    }
  }

  /**
   * Fast dual coin clink
   */
  public playCoinCollect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const tones = [1318.51, 1760]; // E6, A6
      tones.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.055;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Grand Victory Fanfare - multi-chord triumphant brass and shimmer
   */
  public playVictory() {
    this.playTriumphantFanfare();
  }

  /**
   * Triumphant brass fanfare with ascending harmonic arpeggios and sparkling high register
   */
  public playTriumphantFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Harmonic fanfare sequence (C5 -> E5 -> G5 -> C6 -> E6 -> G6)
      const chordNotes = [
        { freq: 523.25, time: 0.0, dur: 0.22, type: 'triangle' as OscillatorType },
        { freq: 659.25, time: 0.12, dur: 0.22, type: 'triangle' as OscillatorType },
        { freq: 783.99, time: 0.24, dur: 0.28, type: 'triangle' as OscillatorType },
        { freq: 1046.5, time: 0.42, dur: 0.6, type: 'triangle' as OscillatorType },
        { freq: 1318.51, time: 0.54, dur: 0.7, type: 'triangle' as OscillatorType },
        { freq: 1567.98, time: 0.66, dur: 0.9, type: 'sine' as OscillatorType },
      ];

      chordNotes.forEach((item) => {
        const now = this.ctx!.currentTime + item.time;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = item.type;
        osc.frequency.setValueAtTime(item.freq, now);

        gain.gain.setValueAtTime(0.24 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + item.dur);
      });

      // Celebratory sparkling bell chimes
      const bells = [
        { freq: 2093.0, time: 0.7 },
        { freq: 2637.0, time: 0.8 },
        { freq: 3135.96, time: 0.9 },
        { freq: 4186.01, time: 1.05 },
      ];

      bells.forEach((bell) => {
        const now = this.ctx!.currentTime + bell.time;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bell.freq, now);

        gain.gain.setValueAtTime(0.16 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Fast reward tally tick (for animated coin/xp counter)
   */
  public playTallyTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.025);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Ignored
    }
  }

  /**
   * Wheel tick sound for lucky spin
   */
  public playWheelTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.032);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.032);
    } catch {
      // Ignored
    }
  }

  /**
   * Turn notification ding
   */
  public playTurnAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [587.33, 880]; // D5, A5
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.14 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Chat message sent sound (crisp subtle ascending blip)
   */
  public playMessageSent() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignored
    }
  }

  /**
   * Chat message received / bot reaction sound (gentle warm double pop)
   */
  public playMessageReceived() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [750, 950];
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.1 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch {
      // Ignored
    }
  }
}

export const soundManager = new SoundEngine();

/**
 * React Hook to subscribe to Sound Manager state updates reactively
 */
export function useSoundManager() {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe((muted, vol) => {
      setIsMuted(muted);
      setVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  return {
    isMuted,
    volume,
    toggleMute: () => soundManager.toggleMute(),
    setMute: (muted: boolean) => soundManager.setMute(muted),
    setVolume: (vol: number) => soundManager.setVolume(vol),
    soundManager,
  };
}
