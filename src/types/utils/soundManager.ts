/**
 * All sound effects are synthesized on the fly with the Web Audio API —
 * no binary audio assets to fetch or license. Every tone is a short
 * oscillator blip shaped with a gain envelope.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', peakGain = 0.14, delay = 0) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playTap() {
    this.tone(700 + Math.random() * 60, 0.045, 'square', 0.045);
  }

  playLevelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.13, i * 0.09));
  }

  playCountdownTick() {
    this.tone(440, 0.12, 'sine', 0.16);
  }

  playGo() {
    this.tone(880, 0.28, 'sawtooth', 0.18);
  }

  playWin() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, i * 0.08));
  }

  playLose() {
    [392, 329.63, 261.63].forEach((f, i) => this.tone(f, 0.32, 'sine', 0.12, i * 0.13));
  }

  playClick() {
    this.tone(320, 0.05, 'sine', 0.09);
  }

  playAlert() {
    this.tone(220, 0.18, 'sawtooth', 0.1);
  }
}

export const soundManager = new SoundManager();
