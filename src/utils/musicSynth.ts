import { encodeWavFromFloat32, midiToFreq, noteNameToMidi } from './pulgiLogic';

export interface MusicNote {
  note: string;
  startBeat: number;
  durationBeats: number;
  track: 'melody' | 'bass' | 'pad' | string;
}

export interface MusicComposition {
  title: string;
  bpm: number;
  genre: string;
  key: string;
  lyrics: string;
  notes: MusicNote[];
}

let activeCtx: AudioContext | null = null;
let stopTimer: number | null = null;

export function stopMusicPlayback() {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeCtx) {
    activeCtx.close().catch(() => {});
    activeCtx = null;
  }
}

function scheduleNote(
  ctx: BaseAudioContext,
  note: MusicNote,
  beatSec: number,
  startOffsetSec = 0.05
) {
  const midi = noteNameToMidi(note.note);
  const freq = midiToFreq(midi);
  const startTime = startOffsetSec + note.startBeat * beatSec;
  const dur = Math.max(0.12, note.durationBeats * beatSec);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (note.track === 'bass') {
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
  } else if (note.track === 'pad') {
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
  } else {
    osc.type = 'sawtooth';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1900, startTime);
    osc.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, startTime);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.03);
    return;
  }

  osc.frequency.setValueAtTime(freq, startTime);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.03);
}

export function playMusicComposition(
  composition: MusicComposition,
  onEnded?: () => void
) {
  stopMusicPlayback();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  activeCtx = ctx;

  const beatSec = 60 / Math.max(50, Math.min(200, composition.bpm || 110));
  let maxEnd = 1;

  for (const n of composition.notes) {
    scheduleNote(ctx, n, beatSec, 0.08);
    maxEnd = Math.max(maxEnd, (n.startBeat + n.durationBeats) * beatSec + 0.25);
  }

  stopTimer = window.setTimeout(() => {
    stopMusicPlayback();
    onEnded?.();
  }, maxEnd * 1000);
}

export function playSoundEffectPreset(type: 'chime' | 'jump' | 'laser' | 'coin' | 'ambient') {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'coin') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.36);
  } else if (type === 'jump') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.24);
  } else if (type === 'laser') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'chime') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.62);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc.start(now);
    osc.stop(now + 1.45);
  }

  setTimeout(() => ctx.close().catch(() => {}), 1600);
}

export async function renderCompositionToWavBlob(composition: MusicComposition): Promise<Blob> {
  const sampleRate = 44100;
  const beatSec = 60 / Math.max(50, Math.min(200, composition.bpm || 110));
  const totalSec = Math.max(
    2,
    composition.notes.reduce((acc, n) => Math.max(acc, (n.startBeat + n.durationBeats) * beatSec + 0.4), 2)
  );
  const offline = new OfflineAudioContext(1, Math.ceil(totalSec * sampleRate), sampleRate);
  for (const n of composition.notes) {
    scheduleNote(offline, n, beatSec, 0.05);
  }
  const rendered = await offline.startRendering();
  const channelData = rendered.getChannelData(0);
  const wavBytes = encodeWavFromFloat32(channelData, sampleRate);
  return new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
}
