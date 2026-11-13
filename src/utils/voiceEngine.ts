import { Pulgi } from '../types/pulgi';

let currentAudio: HTMLAudioElement | null = null;

export function stopPulgiSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export async function speakWithPulgiVoice(
  text: string,
  pulgi: Pick<Pulgi, 'name' | 'voiceName' | 'voiceStyle'>,
  options: {
    preferCloud?: boolean;
    language?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  } = {}
): Promise<void> {
  stopPulgiSpeech();
  const cleanText = text.replace(/[*_`#]/g, '').trim();
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  options.onStart?.();

  // Try Gemini Cloud TTS when online and preferred
  if (options.preferCloud !== false && navigator.onLine) {
    try {
      const resp = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceName: pulgi.voiceName,
          style: `${pulgi.voiceStyle}. Character name: ${pulgi.name}.`,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          currentAudio = audio;
          audio.onended = () => {
            currentAudio = null;
            options.onEnd?.();
          };
          audio.onerror = () => {
            currentAudio = null;
            speakWithBrowserFallback(cleanText, pulgi, options);
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // Fall back smoothly to Web Speech Synthesis
    }
  }

  speakWithBrowserFallback(cleanText, pulgi, options);
}

function speakWithBrowserFallback(
  cleanText: string,
  pulgi: Pick<Pulgi, 'voiceName'>,
  options: {
    language?: string;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('Síntese de voz não suportada neste navegador.');
    options.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const lang = options.language && options.language !== 'auto' ? options.language : navigator.language || 'pt-BR';
  utterance.lang = lang;

  // Map Pulgi voice persona to subtle pitch & rate personality
  const voicePitchMap: Record<string, { pitch: number; rate: number }> = {
    Puck: { pitch: 1.25, rate: 1.08 },
    Kore: { pitch: 1.12, rate: 1.0 },
    Zephyr: { pitch: 1.06, rate: 0.94 },
    Fenrir: { pitch: 0.92, rate: 1.02 },
    Charon: { pitch: 0.85, rate: 0.96 },
  };
  const preset = voicePitchMap[pulgi.voiceName] || { pitch: 1.08, rate: 1.0 };
  utterance.pitch = preset.pitch;
  utterance.rate = preset.rate;

  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (matchingVoice) utterance.voice = matchingVoice;

  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export interface VoiceListenerHandle {
  stop: () => void;
}

export function startVoiceCapture(callbacks: {
  language?: string;
  preferCloudTranscribe?: boolean;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onStateChange?: (state: 'listening' | 'transcribing' | 'idle') => void;
}): VoiceListenerHandle {
  const SpeechRec =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

  // Use browser Web Speech Recognition if available for immediate live transcript
  if (SpeechRec && !callbacks.preferCloudTranscribe) {
    try {
      const rec = new SpeechRec();
      rec.lang = callbacks.language && callbacks.language !== 'auto' ? callbacks.language : navigator.language || 'pt-BR';
      rec.interimResults = true;
      rec.continuous = false;
      let finalTranscript = '';

      callbacks.onStateChange?.('listening');

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece + ' ';
          } else {
            interim += piece;
          }
        }
        if (interim || finalTranscript) {
          callbacks.onInterim?.((finalTranscript + interim).trim());
        }
      };

      rec.onerror = (ev: { error?: string }) => {
        callbacks.onStateChange?.('idle');
        if (ev.error === 'not-allowed') {
          callbacks.onError('Permissão de microfone negada. Ative o microfone nas configurações do navegador.');
        } else if (ev.error !== 'aborted') {
          // Try MediaRecorder -> Gemini Transcribe fallback if browser speech failed (e.g., no speech service)
          startMediaRecorderCapture(callbacks);
        }
      };

      rec.onend = () => {
        callbacks.onStateChange?.('idle');
        const trimmed = finalTranscript.trim();
        if (trimmed) {
          callbacks.onFinal(trimmed);
        }
      };

      rec.start();
      return {
        stop: () => {
          try {
            rec.stop();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      return startMediaRecorderCapture(callbacks);
    }
  }

  return startMediaRecorderCapture(callbacks);
}

function startMediaRecorderCapture(callbacks: {
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onStateChange?: (state: 'listening' | 'transcribing' | 'idle') => void;
}): VoiceListenerHandle {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let stopped = false;

  if (!navigator.mediaDevices?.getUserMedia) {
    callbacks.onError('Captura de áudio não suportada neste dispositivo/navegador.');
    callbacks.onStateChange?.('idle');
    return { stop: () => {} };
  }

  callbacks.onStateChange?.('listening');

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((mediaStream) => {
      if (stopped) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = mediaStream;
      const chunks: BlobPart[] = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      recorder = new MediaRecorder(mediaStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 400) {
          callbacks.onStateChange?.('idle');
          return;
        }
        callbacks.onStateChange?.('transcribing');
        try {
          const base64 = await blobToBase64(blob);
          const resp = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType }),
          });
          const data = await resp.json();
          callbacks.onStateChange?.('idle');
          if (!resp.ok) {
            callbacks.onError(data.error || 'Falha ao transcrever o áudio.');
            return;
          }
          if (data.text) {
            callbacks.onFinal(data.text);
          } else {
            callbacks.onError('Não foi possível entender a fala gravada.');
          }
        } catch {
          callbacks.onStateChange?.('idle');
          callbacks.onError('Sem conexão para transcrever áudio na nuvem.');
        }
      };
      recorder.start();
    })
    .catch(() => {
      callbacks.onStateChange?.('idle');
      callbacks.onError('Não foi possível acessar o microfone. Verifique as permissões.');
    });

  return {
    stop: () => {
      stopped = true;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        stream?.getTracks().forEach((t) => t.stop());
        callbacks.onStateChange?.('idle');
      }
    },
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [idx: number]: {
      isFinal: boolean;
      [sub: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
