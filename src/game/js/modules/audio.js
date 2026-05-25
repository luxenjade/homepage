let audioCtx = null;
let muted = false;

function getAudioCtx() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function playSound(type) {
  if (muted) return;
  try {
    const ac = getAudioCtx();
    const now = ac.currentTime;

    switch (type) {
      case "shoot": {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case "enemy_die": {
        const buf = ac.createBuffer(1, ac.sampleRate * 0.15, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ac.createBufferSource();
        const gain = ac.createGain();
        const filt = ac.createBiquadFilter();
        src.buffer = buf;
        filt.type = "bandpass";
        filt.frequency.value = 400;
        src.connect(filt);
        filt.connect(gain);
        gain.connect(ac.destination);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        src.start(now);
        break;
      }

      case "hit": {
        const len = ac.sampleRate * 0.35;
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
        const noise = ac.createBufferSource();
        const noiseGain = ac.createGain();
        const noiseFilt = ac.createBiquadFilter();
        noise.buffer = buf;
        noiseFilt.type = "bandpass";
        noiseFilt.frequency.value = 800;
        noiseFilt.Q.value = 0.8;
        noise.connect(noiseFilt);
        noiseFilt.connect(noiseGain);
        noiseGain.connect(ac.destination);
        noiseGain.gain.setValueAtTime(1.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        noise.start(now);

        const thud = ac.createOscillator();
        const thudGain = ac.createGain();
        thud.connect(thudGain);
        thudGain.connect(ac.destination);
        thud.type = "sine";
        thud.frequency.setValueAtTime(120, now);
        thud.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        thudGain.gain.setValueAtTime(1.0, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        thud.start(now);
        thud.stop(now + 0.3);

        const crack = ac.createOscillator();
        const crackGain = ac.createGain();
        const dist = ac.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 8);
        dist.curve = curve;
        crack.connect(dist);
        dist.connect(crackGain);
        crackGain.connect(ac.destination);
        crack.type = "sawtooth";
        crack.frequency.setValueAtTime(200, now);
        crack.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        crackGain.gain.setValueAtTime(0.4, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        crack.start(now);
        crack.stop(now + 0.1);
        break;
      }

      case "pickup": {
        const freqs = [523, 659, 784];
        freqs.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          const t = now + i * 0.07;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.start(t);
          osc.stop(t + 0.15);
        });
        break;
      }

      case "life": {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          const t = now + i * 0.08;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.start(t);
          osc.stop(t + 0.18);
        });
        break;
      }

      case "levelup": {
        const freqs = [392, 494, 587, 784];
        freqs.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.type = "triangle";
          osc.frequency.value = freq;
          const t = now + i * 0.1;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
        });
        break;
      }

      case "boss_spawn": {
        const freqs = [110, 138, 165, 220];
        freqs.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.type = "sawtooth";
          osc.frequency.value = freq;
          const t = now + i * 0.12;
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.start(t);
          osc.stop(t + 0.4);
        });
        break;
      }

      case "boss_die": {
        for (let layer = 0; layer < 3; layer++) {
          const blen = ac.sampleRate * (0.4 + layer * 0.15);
          const bbuf = ac.createBuffer(1, blen, ac.sampleRate);
          const bdata = bbuf.getChannelData(0);
          for (let i = 0; i < blen; i++)
            bdata[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / blen, 0.8);
          const bsrc = ac.createBufferSource();
          const bgain = ac.createGain();
          const bfilt = ac.createBiquadFilter();
          bsrc.buffer = bbuf;
          bfilt.type = "lowpass";
          bfilt.frequency.value = 600 - layer * 150;
          bsrc.connect(bfilt);
          bfilt.connect(bgain);
          bgain.connect(ac.destination);
          bgain.gain.setValueAtTime(0.8, now + layer * 0.1);
          bgain.gain.exponentialRampToValueAtTime(
            0.001,
            now + 0.5 + layer * 0.15,
          );
          bsrc.start(now + layer * 0.1);
        }
        const bosc = ac.createOscillator();
        const bogain = ac.createGain();
        bosc.connect(bogain);
        bogain.connect(ac.destination);
        bosc.type = "sine";
        bosc.frequency.setValueAtTime(80, now);
        bosc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        bogain.gain.setValueAtTime(1.0, now);
        bogain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        bosc.start(now);
        bosc.stop(now + 0.6);
        break;
      }

      case "boss_shoot": {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case "gameover": {
        const freqs = [392, 330, 262, 196];
        freqs.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.type = "sawtooth";
          osc.frequency.value = freq;
          const t = now + i * 0.18;
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }
    }
  } catch (e) {
    // Audio API unsupported.
  }
}
