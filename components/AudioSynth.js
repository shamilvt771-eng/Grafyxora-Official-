/* ==========================================================================
   GRAFYXORA 2026 — AAA AUDIO SYNTHESIS ENGINE (Web Audio API)
   ========================================================================== */

export class AudioSynth {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.initialized = false;
    
    // Engine sound nodes
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    
    // Wind ambient nodes
    this.windNoise = null;
    this.windGain = null;
    
    // Tire screech nodes
    this.screechOsc = null;
    this.screechGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
      
      this.setupEngineSynth();
      this.setupWindSynth();
      this.setupScreechSynth();
      
      console.log("AAA Game Audio Synth Online.");
    } catch (e) {
      console.error("Web Audio API failed to load", e);
    }
  }

  setMute(state) {
    this.isMuted = state;
    if (!this.isMuted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.windGain) this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.screechGain) this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      if (this.windGain) this.windGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    }
  }

  // --- Engine Sound Synthesis ---
  setupEngineSynth() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Core Engine Oscillator (Sawtooth representing cylinder combustion cycles)
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(50, now); // Idle frequency
    
    // Filter to remove harsh harmonics and give deep rumble
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, now);
    
    // Gain / Volume controller
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, now);
    
    // Connections
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    
    this.engineOsc.start(0);
  }

  updateEngine(speedRatio, isNitro = false) {
    if (this.isMuted || !this.initialized || !this.engineOsc) return;
    
    const now = this.ctx.currentTime;
    // Map speed percentage to audio pitch
    const baseFreq = 45 + (speedRatio * 130); // 45Hz at idle, 175Hz at max speed
    const targetFreq = isNitro ? baseFreq * 1.35 : baseFreq;
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    
    // Map pitch filter according to RPM
    const filterFreq = 120 + (speedRatio * 240) + (isNitro ? 100 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.15);
    
    // Engine cylinder volume modulation
    const volume = 0.035 + (speedRatio * 0.04) + (isNitro ? 0.03 : 0);
    this.engineGain.gain.setTargetAtTime(volume, now, 0.08);
  }

  // --- Environmental Wind Ambient ---
  setupWindSynth() {
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Generate white noise array
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;
    
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(this.isMuted ? 0 : 0.02, this.ctx.currentTime);
    
    this.windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    
    this.windNoise.start(0);
    
    // Ambient volume LFO modulation
    this.modulateWind(windFilter);
  }

  modulateWind(filter) {
    if (!this.ctx || !this.initialized) return;
    
    setInterval(() => {
      if (this.isMuted) return;
      const now = this.ctx.currentTime;
      // Synthesize random gusts by varying center frequency
      const gustFreq = 300 + (Math.random() * 350);
      filter.frequency.exponentialRampToValueAtTime(gustFreq, now + 1.8);
    }, 2000);
  }

  // --- Drift Screech Synthesis ---
  setupScreechSynth() {
    if (!this.ctx) return;
    
    this.screechOsc = this.ctx.createOscillator();
    this.screechOsc.type = 'triangle';
    this.screechOsc.frequency.setValueAtTime(320, this.ctx.currentTime);
    
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1000, this.ctx.currentTime);
    
    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    this.screechOsc.connect(bandpass);
    bandpass.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);
    
    this.screechOsc.start(0);
  }

  setTireScreech(intensity) {
    if (this.isMuted || !this.initialized || !this.screechGain) return;
    const now = this.ctx.currentTime;
    
    // Vary pitch and volume dynamically on tires drift sliding
    const targetVolume = Math.min(0.08, intensity * 0.08);
    this.screechGain.gain.setTargetAtTime(targetVolume, now, 0.05);
    
    const targetFreq = 280 + (intensity * 90) + (Math.random() * 20);
    this.screechOsc.frequency.setValueAtTime(targetFreq, now);
  }

  // --- Temple Bell Chime FM Synthesis ---
  playTempleBell() {
    if (this.isMuted || !this.initialized) return;
    
    const now = this.ctx.currentTime;
    
    // Modulator Node (metallic overtone frequency)
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(155, now);
    
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(120, now);
    
    // Carrier Node (fundamental deep ring pitch)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(80, now); // Low deep resonance gong
    
    const carrierGain = this.ctx.createGain();
    carrierGain.gain.setValueAtTime(0.25, now);
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5); // long ring decay
    
    // Connections
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // Frequency modulation
    
    carrier.connect(carrierGain);
    carrierGain.connect(this.ctx.destination);
    
    modulator.start(now);
    carrier.start(now);
    
    modulator.stop(now + 4.5);
    carrier.stop(now + 4.5);
  }

  // --- UI feedback triggers ---
  playClick() {
    if (this.isMuted || !this.initialized) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playHover() {
    if (this.isMuted || !this.initialized) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playSuccess() {
    if (this.isMuted || !this.initialized) return;
    const now = this.ctx.currentTime;
    
    const playTone = (freq, delay, dur) => {
      setTimeout(() => {
        if (this.isMuted) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(0.08, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(0);
        o.stop(this.ctx.currentTime + dur);
      }, delay * 1000);
    };
    
    playTone(523.25, 0.0, 0.25); // C5
    playTone(659.25, 0.1, 0.25); // E5
    playTone(783.99, 0.2, 0.4);  // G5
  }
}
