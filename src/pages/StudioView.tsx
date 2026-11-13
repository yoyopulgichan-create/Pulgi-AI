import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Code2,
  Download,
  FileText,
  Film,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  Loader2,
  Music,
  Play,
  Save,
  Sparkles,
  Square,
  Upload,
} from 'lucide-react';
import { AppSettings, ProjectItem, Pulgi, StudioFile, StudioTab } from '../types/pulgi';
import { generateStudioContent } from '../services/aiClient';
import {
  downloadFilesAsZip,
  downloadStudioFile,
  triggerBlobDownload,
} from '../utils/fileGenerators';
import {
  MusicComposition,
  playMusicComposition,
  playSoundEffectPreset,
  renderCompositionToWavBlob,
  stopMusicPlayback,
} from '../utils/musicSynth';
import { speakWithPulgiVoice, stopPulgiSpeech } from '../utils/voiceEngine';

interface StudioViewProps {
  pulgis: Pulgi[];
  settings: AppSettings;
  activeTab: StudioTab;
  onChangeTab: (tab: StudioTab) => void;
  onSaveFile: (file: StudioFile) => void;
  onSaveProject: (project: ProjectItem) => void;
}

const STUDIO_TABS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'website', label: 'Website', icon: <Globe className="h-4 w-4" /> },
  { id: 'game', label: 'Game', icon: <Gamepad2 className="h-4 w-4" /> },
  { id: 'video', label: 'Video', icon: <Film className="h-4 w-4" /> },
  { id: 'image', label: 'Image', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'music', label: 'Music', icon: <Music className="h-4 w-4" /> },
  { id: 'file', label: 'File', icon: <FileText className="h-4 w-4" /> },
  { id: 'code', label: 'Code', icon: <Code2 className="h-4 w-4" /> },
];

const FILE_FORMATS = ['txt', 'pdf', 'docx', 'csv', 'xlsx', 'pptx', 'json', 'html', 'css', 'js', 'py', 'zip', 'md'];

interface VideoScene {
  title: string;
  narration: string;
  subtitle: string;
  durationSec: number;
  svgVisual: string;
}

export const StudioView: React.FC<StudioViewProps> = ({
  pulgis,
  settings,
  activeTab,
  onChangeTab,
  onSaveFile,
  onSaveProject,
}) => {
  const [selectedPulgiId, setSelectedPulgiId] = useState(pulgis[0]?.id || '');
  const activePulgi = pulgis.find((p) => p.id === selectedPulgiId) || pulgis[0];
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // 1. Website Maker
  const [webPrompt, setWebPrompt] = useState('');
  const [webTemplate, setWebTemplate] = useState('landing page');
  const [webTitle, setWebTitle] = useState('Meu Site Pulgi');
  const [webCodeTab, setWebCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [webHtml, setWebHtml] = useState('<section class="hero">\n  <h1>Olá do Pulgi Studio!</h1>\n  <p>Edite o código ao lado ou peça para um Pulgi criar um site completo.</p>\n  <button id="btn">Clique em mim</button>\n  <p id="out"></p>\n</section>');
  const [webCss, setWebCss] = useState('body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f6f8fc; color: #1e1b4b; }\n.hero { max-width: 640px; margin: 0 auto; background: #fff; padding: 28px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }\nbutton { background: #7c5cff; color: #fff; border: 0; padding: 12px 18px; border-radius: 12px; font-weight: 600; cursor: pointer; }');
  const [webJs, setWebJs] = useState('document.getElementById("btn")?.addEventListener("click", () => {\n  const out = document.getElementById("out");\n  if (out) out.textContent = "Interatividade JavaScript funcionando!";\n});');

  // 2. Game Maker
  const [gamePrompt, setGamePrompt] = useState('');
  const [gameGenre, setGameGenre] = useState('plataforma 2D');
  const [gameTitle, setGameTitle] = useState('Coletor de Estrelas');
  const [gameHtml, setGameHtml] = useState(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;background:#1e1b4b;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:10px}
  canvas{background:#312e81;border-radius:16px;border:2px solid #818cf8;max-width:95vw}
  .controls{display:flex;gap:12px}
  button{background:#7c5cff;color:#fff;border:0;padding:10px 18px;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer}
</style></head>
<body>
  <div id="hud">Pontos: <strong id="score">0</strong></div>
  <canvas id="c" width="340" height="240"></canvas>
  <div class="controls">
    <button onclick="px=Math.max(20,px-28)">◀</button>
    <button onclick="px=Math.min(320,px+28)">▶</button>
  </div>
  <script>
    const c=document.getElementById('c'),ctx=c.getContext('2d');
    let px=170,sx=Math.random()*300+20,sy=10,score=0;
    window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')px=Math.max(20,px-24);if(e.key==='ArrowRight')px=Math.min(320,px+24);});
    function loop(){
      ctx.clearRect(0,0,340,240);
      sy+=2.4; if(sy>240){sy=10;sx=Math.random()*300+20;}
      if(Math.abs(px-sx)<26 && sy>195){score++;document.getElementById('score').textContent=score;sy=10;sx=Math.random()*300+20;}
      ctx.fillStyle='#fde047'; ctx.beginPath(); ctx.arc(sx,sy,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#a5f3fc'; ctx.beginPath(); ctx.arc(px,212,18,0,Math.PI*2); ctx.fill();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body></html>`);

  // 3. Video Maker
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoTitle, setVideoTitle] = useState('Aventura dos Pulgis');
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([
    {
      title: 'Cena 1 — Apresentação',
      narration: 'Bem-vindo ao universo Pulgi AI, onde pequenas ideias ganham vida.',
      subtitle: 'Pequenas ideias, grandes criações',
      durationSec: 4,
      svgVisual: '<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="360" fill="#eef2ff"/><circle cx="320" cy="170" r="76" fill="#7c5cff"/><circle cx="298" cy="164" r="10" fill="#fff"/><circle cx="342" cy="164" r="10" fill="#fff"/></svg>',
    },
    {
      title: 'Cena 2 — Colaboração',
      narration: 'Diferentes Pulgis unem talentos de design, código, música e roteiro.',
      subtitle: 'Trabalho em equipe inteligente',
      durationSec: 4,
      svgVisual: '<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="360" fill="#ecfeff"/><circle cx="220" cy="180" r="56" fill="#38bdf8"/><circle cx="420" cy="180" r="56" fill="#f472b6"/></svg>',
    },
  ]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4. Image Maker
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('ilustração pastel');
  const [generatedSvg, setGeneratedSvg] = useState('<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ede9fe"/><stop offset="100%" stop-color="#cffafe"/></linearGradient></defs><rect width="512" height="512" rx="48" fill="url(#g)"/><circle cx="256" cy="260" r="110" fill="#ffffff" stroke="#312e81" stroke-width="10"/><circle cx="222" cy="256" r="18" fill="#1e1b4b"/><circle cx="290" cy="256" r="18" fill="#1e1b4b"/><circle cx="216" cy="249" r="5" fill="#fff"/><circle cx="284" cy="249" r="5" fill="#fff"/></svg>');
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState('#7c5cff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasOverlayText, setCanvasOverlayText] = useState('');

  // 5. Music Maker
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicGenre, setMusicGenre] = useState('eletrônica suave');
  const [composition, setComposition] = useState<MusicComposition>({
    title: 'Brisa Lavanda',
    bpm: 112,
    genre: 'Eletrônica Suave',
    key: 'C Maior',
    lyrics: 'Pulgi brilha no céu azul\nNotas flutuam de norte a sul.',
    notes: [
      { note: 'C4', startBeat: 0, durationBeats: 1, track: 'pad' },
      { note: 'E4', startBeat: 0, durationBeats: 1, track: 'melody' },
      { note: 'G4', startBeat: 1, durationBeats: 1, track: 'melody' },
      { note: 'A4', startBeat: 2, durationBeats: 1, track: 'melody' },
      { note: 'G4', startBeat: 3, durationBeats: 1, track: 'melody' },
      { note: 'C3', startBeat: 0, durationBeats: 2, track: 'bass' },
      { note: 'F3', startBeat: 4, durationBeats: 2, track: 'bass' },
      { note: 'F4', startBeat: 4, durationBeats: 1, track: 'melody' },
      { note: 'A4', startBeat: 5, durationBeats: 1, track: 'melody' },
      { note: 'G4', startBeat: 6, durationBeats: 2, track: 'melody' },
    ],
  });
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // 6. File Maker
  const [filePrompt, setFilePrompt] = useState('');
  const [fileFormat, setFileFormat] = useState('pdf');
  const [fileName, setFileName] = useState('plano_pulgi');
  const [fileContent, setFileContent] = useState('Projeto criado no Pulgi File Maker.\n\n1. Ideia principal\n2. Cronograma\n3. Próximos passos');

  // 7. Code Maker
  const [codePrompt, setCodePrompt] = useState('');
  const [codeLang, setCodeLang] = useState<'javascript' | 'html' | 'css' | 'json' | 'python'>('javascript');
  const [codeFilename, setCodeFilename] = useState('pulgi_script.js');
  const [codeText, setCodeText] = useState('const pulgis = ["Luma", "Pip", "Sol"];\nconsole.log("Equipe pronta:", pulgis.join(", "));\nreturn pulgis.length;');
  const [codeOutput, setCodeOutput] = useState<string>('');

  useEffect(() => {
    return () => {
      stopMusicPlayback();
      stopPulgiSpeech();
    };
  }, []);

  // Render initial SVG onto Image Maker Canvas when SVG updates
  useEffect(() => {
    if (activeTab !== 'image') return;
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [generatedSvg, activeTab]);

  // Helper to assemble full website HTML
  const assembledWebHtml = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${webTitle}</title><style>${webCss}</style></head>
<body>${webHtml}<script>${webJs}</script></body></html>`;

  const flashNote = (msg: string) => {
    setStatusNote(msg);
    setTimeout(() => setStatusNote(null), 3500);
  };

  // Generation handlers
  const handleGenerateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webPrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        title: string;
        summary: string;
        html: string;
        css: string;
        js: string;
      }>('website', webPrompt, activePulgi?.name || 'Luma', settings, { template: webTemplate });
      setWebTitle(data.title || 'Website Pulgi');
      setWebHtml(data.html || '');
      setWebCss(data.css || '');
      setWebJs(data.js || '');
      flashNote(data.summary || 'Website gerado!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Website Maker.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamePrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        title: string;
        genre: string;
        instructions: string;
        summary: string;
        html: string;
      }>('game', gamePrompt, activePulgi?.name || 'Pip', settings, { genre: gameGenre });
      setGameTitle(data.title || 'Jogo Pulgi');
      setGameHtml(data.html || '');
      flashNote(data.instructions || data.summary || 'Jogo 2D pronto para jogar!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Game Maker.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        title: string;
        scenes: VideoScene[];
      }>('video', videoPrompt, activePulgi?.name || 'Nara', settings);
      setVideoTitle(data.title || 'Vídeo Pulgi');
      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        setVideoScenes(data.scenes);
        setActiveSceneIdx(0);
      }
      flashNote('Roteiro e storyboard gerados!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Video Maker.');
    } finally {
      setLoading(false);
    }
  };

  const drawSceneToCanvas = (scene: VideoScene): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = videoCanvasRef.current;
      if (!canvas) return resolve();
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve();

      const img = new Image();
      const blob = new Blob([scene.svgVisual], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Subtitle bar
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fillRect(0, canvas.height - 54, canvas.width, 54);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(scene.subtitle, canvas.width / 2, canvas.height - 22);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        ctx.fillStyle = '#ede9fe';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#312e81';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(scene.title, canvas.width / 2, canvas.height / 2);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.src = url;
    });
  };

  const handlePlayVideo = async (exportRecording = false) => {
    if (videoScenes.length === 0) return;
    setIsPlayingVideo(true);
    let recorder: MediaRecorder | null = null;
    const chunks: BlobPart[] = [];

    if (exportRecording && videoCanvasRef.current && typeof MediaRecorder !== 'undefined') {
      const stream = videoCanvasRef.current.captureStream(24);
      const mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
      recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        triggerBlobDownload(blob, `${videoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
        setIsRecordingVideo(false);
      };
      setIsRecordingVideo(true);
      recorder.start();
    }

    for (let i = 0; i < videoScenes.length; i++) {
      setActiveSceneIdx(i);
      const scene = videoScenes[i];
      await drawSceneToCanvas(scene);
      if (activePulgi && !exportRecording) {
        speakWithPulgiVoice(scene.narration, activePulgi, {
          preferCloud: settings.providerMode === 'cloud',
          language: settings.language,
        });
      }
      await new Promise((r) => setTimeout(r, Math.max(1500, (scene.durationSec || 3) * 1000)));
    }

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsPlayingVideo(false);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        title: string;
        description: string;
        svgCode: string;
      }>('image-svg', imagePrompt, activePulgi?.name || 'Mochi', settings, { style: imageStyle });
      if (data.svgCode) setGeneratedSvg(data.svgCode);
      flashNote(data.description || 'Arte vetorial gerada!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Image Maker.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImageToCanvas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const canvas = imageCanvasRef.current;
    if (!file || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>, start: boolean) => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    if (start) setIsDrawing(true);
    if (!isDrawing && !start) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<MusicComposition>(
        'music',
        musicPrompt,
        activePulgi?.name || 'Sol',
        settings,
        { genre: musicGenre }
      );
      if (data.notes) setComposition(data);
      flashNote(`Composição "${data.title}" pronta!`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Music Maker.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        filename: string;
        content: string;
        summary: string;
      }>('file', filePrompt, activePulgi?.name || 'Kiko', settings, { format: fileFormat });
      setFileName(data.filename.replace(/\.[^.]+$/, ''));
      setFileContent(data.content);
      flashNote(data.summary || 'Arquivo gerado!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no File Maker.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePrompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await generateStudioContent<{
        filename: string;
        code: string;
        explanation: string;
      }>('code', codePrompt, activePulgi?.name || 'Kiko', settings, { language: codeLang });
      setCodeFilename(data.filename);
      setCodeText(data.code);
      flashNote(data.explanation || 'Código gerado!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no Code Maker.');
    } finally {
      setLoading(false);
    }
  };

  const runCodeSafely = () => {
    if (codeLang === 'json') {
      try {
        const parsed = JSON.parse(codeText);
        setCodeOutput(`JSON válido (${Array.isArray(parsed) ? `${parsed.length} itens` : `${Object.keys(parsed).length} chaves`}).`);
      } catch (err) {
        setCodeOutput(`Erro de sintaxe JSON: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    if (codeLang === 'javascript') {
      const logs: string[] = [];
      try {
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map((a) => String(a)).join(' ')),
          warn: (...args: unknown[]) => logs.push(`WARN: ${args.join(' ')}`),
          error: (...args: unknown[]) => logs.push(`ERR: ${args.join(' ')}`),
        };
        const fn = new Function('console', codeText);
        const res = fn(mockConsole);
        if (res !== undefined) logs.push(`Retorno: ${String(res)}`);
        setCodeOutput(logs.join('\n') || '(Executado sem saída no console)');
      } catch (err) {
        setCodeOutput(`Erro JS: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    if (codeLang === 'python') {
      setCodeOutput(
        'Execução local de Python requer runtime Python/Pyodide externo quando habilitado. Você pode editar, validar e baixar o arquivo .py pronto para rodar no seu ambiente.'
      );
      return;
    }

    setCodeOutput('Use a prévia ao lado para visualizar HTML/CSS.');
  };

  return (
    <div className="space-y-5">
      {/* Header + Pulgi Assistant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pulgi Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Estúdio completo para criar websites, jogos, vídeos, imagens, músicas, arquivos e código.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="studio-pulgi-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Pulgi Parceiro:
          </label>
          <select
            id="studio-pulgi-select"
            value={activePulgi?.id || ''}
            onChange={(e) => setSelectedPulgiId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white min-h-[40px]"
          >
            {pulgis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 7 Studio Tool Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STUDIO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setErrorMsg(null);
              onChangeTab(t.id);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition whitespace-nowrap shrink-0 min-h-[42px] ${
              activeTab === t.id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {statusNote && (
        <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {statusNote}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* 5.1 WEBSITE MAKER */}
      {activeTab === 'website' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateWebsite} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={webPrompt}
              onChange={(e) => setWebPrompt(e.target.value)}
              placeholder="Descreva o site (ex: portfólio de fotografia minimalista ou blog de receitas)..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Tipo de website"
              value={webTemplate}
              onChange={(e) => setWebTemplate(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="landing page">Landing Page</option>
              <option value="portfólio">Portfólio</option>
              <option value="blog">Blog</option>
              <option value="site interativo">Site Interativo</option>
            </select>
            <button
              type="submit"
              disabled={loading || !webPrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Gerar Site</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  {(['html', 'css', 'js'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setWebCodeTab(tab)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold uppercase ${
                        webCodeTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = Date.now();
                      const fid = `file-web-${now}`;
                      onSaveFile({
                        id: fid,
                        name: `${webTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.html`,
                        format: 'html',
                        content: assembledWebHtml,
                        createdByPulgiId: activePulgi?.id,
                        createdAt: now,
                        updatedAt: now,
                      });
                      onSaveProject({
                        id: `proj-web-${now}`,
                        name: webTitle,
                        description: webPrompt || 'Website criado no Pulgi Studio',
                        category: 'Website',
                        status: 'completed',
                        pulgiIds: activePulgi ? [activePulgi.id] : [],
                        fileIds: [fid],
                        previewHtml: assembledWebHtml,
                        history: [{ id: `h-${now}`, note: 'Criado no Website Maker', pulgiNames: [activePulgi?.name || 'Pulgi'], timestamp: now }],
                        createdAt: now,
                        updatedAt: now,
                      });
                      flashNote('Website salvo em Projetos e Arquivos!');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFilesAsZip(webTitle, [
                        { name: 'index.html', content: assembledWebHtml },
                        { name: 'styles.css', content: webCss },
                        { name: 'script.js', content: webJs },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>ZIP</span>
                  </button>
                </div>
              </div>
              <textarea
                aria-label={`Editor ${webCodeTab.toUpperCase()}`}
                value={webCodeTab === 'html' ? webHtml : webCodeTab === 'css' ? webCss : webJs}
                onChange={(e) => {
                  if (webCodeTab === 'html') setWebHtml(e.target.value);
                  else if (webCodeTab === 'css') setWebCss(e.target.value);
                  else setWebJs(e.target.value);
                }}
                rows={14}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Prévia em Tempo Real — {webTitle}
              </div>
              <iframe title="Prévia Website Maker" sandbox="allow-scripts" srcDoc={assembledWebHtml} className="w-full flex-1 min-h-[340px] bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* 5.2 GAME MAKER */}
      {activeTab === 'game' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateGame} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={gamePrompt}
              onChange={(e) => setGamePrompt(e.target.value)}
              placeholder="Descreva seu jogo 2D (ex: quiz de ciência ou plataforma com moedas)..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Gênero do jogo"
              value={gameGenre}
              onChange={(e) => setGameGenre(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="plataforma 2D">Plataforma 2D</option>
              <option value="educativo">Educativo</option>
              <option value="perguntas e respostas">Quiz</option>
              <option value="aventura">Aventura</option>
              <option value="simulação">Simulação</option>
            </select>
            <button
              type="submit"
              disabled={loading || !gamePrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gamepad2 className="h-4 w-4" />}
              <span>Criar Jogo</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{gameTitle} (HTML5)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => triggerBlobDownload(new Blob([gameHtml], { type: 'text/html' }), `${gameTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.html`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFilesAsZip(gameTitle, [{ name: 'index.html', content: gameHtml }])}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>ZIP</span>
                  </button>
                </div>
              </div>
              <textarea
                aria-label="Código HTML5 do Jogo"
                value={gameHtml}
                onChange={(e) => setGameHtml(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pré-visualização Jogável
              </div>
              <iframe title="Jogo Jogável" sandbox="allow-scripts" srcDoc={gameHtml} className="w-full flex-1 min-h-[360px] bg-slate-950" />
            </div>
          </div>
        </div>
      )}

      {/* 5.3 VIDEO MAKER */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateVideo} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Tema do vídeo curto (ex: explicando o sistema solar em 4 cenas)..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !videoPrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              <span>Criar Roteiro & Cenas</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{videoTitle}</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayVideo(false)}
                    disabled={isPlayingVideo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Reproduzir com Voz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayVideo(true)}
                    disabled={isPlayingVideo || isRecordingVideo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isRecordingVideo ? 'Gravando...' : 'Exportar Vídeo'}</span>
                  </button>
                </div>
              </div>

              <canvas
                ref={videoCanvasRef}
                width={640}
                height={360}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100"
              />
              {videoScenes[activeSceneIdx] && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-200">
                  <strong>Cena {activeSceneIdx + 1}:</strong> {videoScenes[activeSceneIdx].narration}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5 max-h-[450px] overflow-y-auto">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Storyboard ({videoScenes.length} cenas)</div>
              {videoScenes.map((sc, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSceneIdx(idx);
                    drawSceneToCanvas(sc);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 text-xs space-y-1.5 ${
                    activeSceneIdx === idx
                      ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white">{sc.title} ({sc.durationSec}s)</div>
                  <input
                    type="text"
                    value={sc.narration}
                    onChange={(e) => {
                      const next = [...videoScenes];
                      next[idx] = { ...sc, narration: e.target.value };
                      setVideoScenes(next);
                    }}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                  />
                  <div className="text-slate-500 dark:text-slate-400">Legenda: {sc.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5.4 IMAGE MAKER */}
      {activeTab === 'image' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateImage} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Descreva ilustração, logo, ícone ou personagem vetorial..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Estilo visual"
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ilustração pastel">Ilustração Pastel</option>
              <option value="logotipo minimalista">Logotipo</option>
              <option value="ícone de aplicativo">Ícone</option>
              <option value="wallpaper abstrato">Wallpaper</option>
            </select>
            <button
              type="submit"
              disabled={loading || !imagePrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              <span>Gerar Arte Vetorial</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Editar Imagem</span>
                    <input type="file" accept="image/*" onChange={handleUploadImageToCanvas} className="sr-only" />
                  </label>
                  <input
                    type="color"
                    aria-label="Cor do pincel"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => triggerBlobDownload(new Blob([generatedSvg], { type: 'image/svg+xml' }), 'arte_pulgi.svg')}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    Baixar SVG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      imageCanvasRef.current?.toBlob((blob) => {
                        if (blob) triggerBlobDownload(blob, 'arte_pulgi.png');
                      }, 'image/png');
                    }}
                    className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Baixar PNG
                  </button>
                </div>
              </div>

              <canvas
                ref={imageCanvasRef}
                width={512}
                height={512}
                onPointerDown={(e) => handleCanvasPointer(e, true)}
                onPointerMove={(e) => handleCanvasPointer(e, false)}
                onPointerUp={() => setIsDrawing(false)}
                onPointerLeave={() => setIsDrawing(false)}
                className="w-full max-w-[420px] mx-auto block rounded-xl border border-slate-200 dark:border-slate-700 bg-white touch-none cursor-crosshair"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Ferramentas Rápidas do Canvas
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={canvasOverlayText}
                  onChange={(e) => setCanvasOverlayText(e.target.value)}
                  placeholder="Texto para estampar na arte..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const ctx = imageCanvasRef.current?.getContext('2d');
                    if (!ctx || !canvasOverlayText.trim()) return;
                    ctx.fillStyle = brushColor;
                    ctx.font = 'bold 34px Fredoka, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(canvasOverlayText, 256, 460);
                  }}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Adicionar Texto
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desenhe diretamente sobre o canvas acima, envie sua própria imagem para editar, ou peça uma ilustração vetorial SVG ao Pulgi. (Geração fotorrealista raster externa exige modelo de imagem pago dedicado.)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 MUSIC MAKER */}
      {activeTab === 'music' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateMusic} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              placeholder="Descreva a música (ex: trilha alegre para fase de jogo ou lo-fi calmo)..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Estilo musical"
              value={musicGenre}
              onChange={(e) => setMusicGenre(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="eletrônica suave">Eletrônica</option>
              <option value="música ambiente">Ambiente</option>
              <option value="trilha sonora de jogo">Trilha de Jogo</option>
              <option value="pop alegre">Pop Alegre</option>
            </select>
            <button
              type="submit"
              disabled={loading || !musicPrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
              <span>Compor Música</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{composition.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {composition.genre} · {composition.key} · {composition.bpm} BPM · {composition.notes.length} notas
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlayingMusic) {
                        stopMusicPlayback();
                        setIsPlayingMusic(false);
                      } else {
                        setIsPlayingMusic(true);
                        playMusicComposition(composition, () => setIsPlayingMusic(false));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    {isPlayingMusic ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlayingMusic ? 'Parar' : 'Tocar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const blob = await renderCompositionToWavBlob(composition);
                      triggerBlobDownload(blob, `${composition.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.wav`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar WAV</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Efeitos Sonoros Instantâneos (Web Audio)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['chime', 'coin', 'jump', 'laser', 'ambient'] as const).map((fx) => (
                    <button
                      key={fx}
                      type="button"
                      onClick={() => playSoundEffectPreset(fx)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 capitalize"
                    >
                      Som: {fx}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Letra & Partitura</div>
              <textarea
                aria-label="Letra da música"
                value={composition.lyrics}
                onChange={(e) => setComposition((c) => ({ ...c, lyrics: e.target.value }))}
                rows={5}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-100"
              />
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Sequência: {composition.notes.map((n) => `${n.note}(${n.track})`).join(' · ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.6 FILE MAKER (13 formats) */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateFile} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={filePrompt}
              onChange={(e) => setFilePrompt(e.target.value)}
              placeholder="O que o Pulgi deve escrever neste arquivo?..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Formato do arquivo"
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold uppercase text-slate-700 dark:text-slate-200"
            >
              {FILE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  .{fmt.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading || !filePrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span>Gerar Arquivo</span>
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label="Nome do arquivo"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-white"
                />
                <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                  .{fileFormat.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = Date.now();
                    onSaveFile({
                      id: `file-mk-${now}`,
                      name: `${fileName}.${fileFormat}`,
                      format: fileFormat,
                      content: fileContent,
                      createdByPulgiId: activePulgi?.id,
                      createdAt: now,
                      updatedAt: now,
                    });
                    flashNote(`Arquivo ${fileName}.${fileFormat} salvo em Arquivos!`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Localmente</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadStudioFile({
                      name: fileName,
                      format: fileFormat,
                      content: fileContent,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar .{fileFormat.toUpperCase()}</span>
                </button>
              </div>
            </div>

            <textarea
              aria-label="Conteúdo do arquivo"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* 5.7 CODE MAKER */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateCode} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <input
              type="text"
              value={codePrompt}
              onChange={(e) => setCodePrompt(e.target.value)}
              placeholder="Peça um algoritmo, script ou componente ao Pulgi..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <select
              aria-label="Linguagem de programação"
              value={codeLang}
              onChange={(e) => setCodeLang(e.target.value as typeof codeLang)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
            </select>
            <button
              type="submit"
              disabled={loading || !codePrompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[42px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
              <span>Gerar Código</span>
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                  {codeFilename} ({codeLang})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runCodeSafely}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Executar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFilesAsZip(codeFilename, [{ name: codeFilename, content: codeText }])}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>ZIP</span>
                  </button>
                </div>
              </div>
              <textarea
                aria-label="Editor de código"
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                rows={13}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-3.5 text-xs font-mono text-emerald-300 focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Saída & Pré-visualização Segura
              </div>
              {codeLang === 'html' || codeLang === 'css' ? (
                <iframe
                  title="Prévia de Código HTML/CSS"
                  sandbox="allow-scripts"
                  srcDoc={codeLang === 'css' ? `<style>${codeText}</style><div class="preview-box">Prévia CSS aplicada</div>` : codeText}
                  className="flex-1 min-h-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                />
              ) : (
                <pre className="flex-1 min-h-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-auto">
                  {codeOutput || 'Clique em "Executar" para rodar o código de forma isolada.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
