import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvString,
  encodeWavFromFloat32,
  generateRandomPulgiDraft,
  HAIR_STYLES,
  midiToFreq,
  noteNameToMidi,
  parseMentions,
  sanitizeFileName,
  selectPulgisForTask,
  validatePulgiDraft,
} from './pulgiLogic';
import { analyzeMessageEmotion, EMOTION_PROFILES } from './emotionTracker';
import type { Pulgi } from '../types/pulgi';

test('validatePulgiDraft catches invalid inputs and accepts complete drafts', () => {
  const bad = validatePulgiDraft({ name: 'A', role: '', personality: 'ok' });
  assert.equal(bad.valid, false);
  assert.equal(bad.errors.length, 3);

  const good = validatePulgiDraft({
    name: 'Luma',
    role: 'Web Designer',
    personality: 'Criativa, gentil e apaixonada por cores suaves.',
  });
  assert.equal(good.valid, true);
  assert.equal(good.errors.length, 0);
});

test('generateRandomPulgiDraft produces deterministic complete character structure', () => {
  const draft = generateRandomPulgiDraft(42);
  assert.ok(draft.name.length >= 2);
  assert.ok(draft.interests.length >= 1);
  assert.ok(draft.appearance.bodyColor.startsWith('#'));
});

test('parseMentions matches @name case-insensitively', () => {
  const list = [
    { id: 'p1', name: 'Luma' },
    { id: 'p2', name: 'Pip' },
    { id: 'p3', name: 'Sol' },
  ];
  const mentioned = parseMentions('Oi @luma e @SOL, vamos criar!', list);
  assert.deepEqual(mentioned, ['p1', 'p3']);
});

test('selectPulgisForTask prioritizes matching domain Pulgis', () => {
  const makePulgi = (id: string, name: string, role: string, interests: string[]): Pulgi => ({
    id,
    name,
    role,
    personality: 'Colaborativo e criativo',
    interests,
    memories: [],
    voiceName: 'Kore',
    voiceStyle: 'Friendly',
    appearance: {
      hairStyle: 'flared',
      eyeColor: '#1E1B4B',
      bodyColor: '#FFFFFF',
      accentColor: '#E0E7FF',
      outlineColor: '#312E81',
      expression: 'happy',
    },
    createdAt: 1,
    updatedAt: 1,
  });

  const roster = [
    makePulgi('1', 'Sol', 'Compositor Musical', ['Música', 'Sintetizador']),
    makePulgi('2', 'Luma', 'Web Designer', ['Web', 'HTML', 'CSS']),
    makePulgi('3', 'Pip', 'Criador de Jogos', ['Jogos 2D', 'Canvas']),
    makePulgi('4', 'Nara', 'Roteirista', ['Vídeos', 'Histórias']),
  ];

  const selected = selectPulgisForTask('Quero criar um website de animais', roster, 2);
  assert.equal(selected.length, 2);
  assert.equal(selected[0].id, '2');
});

test('noteNameToMidi and midiToFreq calculate A4 = 440Hz and C4 = 60', () => {
  assert.equal(noteNameToMidi('C4'), 60);
  assert.equal(noteNameToMidi('A4'), 69);
  assert.ok(Math.abs(midiToFreq(69) - 440) < 0.001);
});

test('encodeWavFromFloat32 writes valid RIFF/WAVE header and sample payload', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1]);
  const wav = encodeWavFromFloat32(samples, 44100);
  assert.equal(wav.length, 44 + samples.length * 2);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
});

test('buildCsvString and sanitizeFileName format cleanly', () => {
  const csv = buildCsvString([
    ['Nome', 'Nota'],
    ['Luma, AI', '10 "top"'],
  ]);
  assert.equal(csv, 'Nome,Nota\n"Luma, AI","10 ""top"""');
  assert.equal(sanitizeFileName('Meu Site!!', 'zip'), 'Meu_Site.zip');
  assert.equal(sanitizeFileName('dados.csv', 'csv'), 'dados.csv');
});

test('HAIR_STYLES includes all 7 reference hairstyles (14 total)', () => {
  const ids = new Set(HAIR_STYLES.map((h) => h.id));
  assert.equal(HAIR_STYLES.length, 14);
  for (const expected of [
    'shaggy-long',
    'wild-shag',
    'flipped-bob',
    'bowl-cut',
    'retro-waves',
    'monroe-curls',
    'curly-bangs',
  ]) {
    assert.ok(ids.has(expected as typeof HAIR_STYLES[number]['id']));
  }
});

test('analyzeMessageEmotion classifies message sentiment accurately', () => {
  assert.equal(analyzeMessageEmotion('Adorei! Que ideia incrível e feliz!'), 'joy');
  assert.equal(analyzeMessageEmotion('Como funciona isso? Por que acontece assim?'), 'curious');
  assert.equal(analyzeMessageEmotion('Vamos construir o código e executar o plano!'), 'determined');
  assert.equal(analyzeMessageEmotion('Desculpe, encontrei um problema e erro aqui.'), 'concerned');
  assert.equal(analyzeMessageEmotion('Vou criar uma música e design de arte.'), 'creative');
  assert.ok(EMOTION_PROFILES.joy.cssClass.length > 0);
});
