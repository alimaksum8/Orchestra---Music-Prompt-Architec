import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, 
  Youtube, 
  Sparkles, 
  Copy, 
  History, 
  Trash2, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Volume2
} from "lucide-react";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

const OPTIONS = {
  genres: [
    "Full Symphony Orchestra", "Orchestra Kejut (Subito/Surprise)", "Orchestra Pop", "Orchestra Rock", "Orchestra Dangdut",
    "Chamber Orchestra", "String Orchestra", "Philharmonic", "Baroque Orchestra", 
    "Classical Era", "Romantic Era", "Modern Classical", "Cinematic Orchestra", "Epic Trailer Music", 
    "Hybrid Orchestral", "Orchestral Waltz", "Operatic Orchestra", "Gothic Orchestral", "Dark Academic", 
    "Minimalist Orchestral", "Neo-Classical", "Avant-Garde Orchestral", "Video Game Soundscape", 
    "Fantasia Orchestral", "Military Band / Marching Orchestra"
  ],
  subitoLevels: ["Kejut Ringan", "Kejut Sedang", "Kejut Super Kuat", "Kejut Nendang"],
  intros: [
    "Intro Tematik (Chorus Preview)", "Intro Kejut (Subito Hits)", "Mini Overture", "Solo Instrument Opening", 
    "Ethereal Drone Intro", "Crescendo Swell", "Pizzicato Tension Start", "Full Blast High Impact", 
    "Foreshadowing Strings", "Grand Brass Fanfare", "Staccato Pulse Start", "Quiet Soliloquy"
  ],
  instruments: [
    "Full String Section", "1st Violins", "2nd Violins", "Violas", "Cellos", "Double Basses", "Harp", "Solo Violin", "Solo Cello",
    "Full Woodwinds", "Piccolo", "Flutes", "Oboes", "English Horn", "Clarinets", "Bass Clarinet", "Bassoons", "Contrabassoon",
    "Full Brass Section", "French Horns", "Trumpets", "Tenor Trombones", "Bass Trombone", "Tuba", "Wagner Tuba",
    "Orchestral Timpani", "Snare Drum", "Bass Drum", "Cymbals", "Glockenspiel", "Marimba", "Tubular Bells", "Gong / Tam-tam", "Triangle", "Castanets", "Celesta",
    "Grand Piano", "Pipe Organ", "Harpsichord", "Staccato Strings", "Pizzicato Strings", "Legato Strings", "Brass Braams", "Epic Taiko Percussion"
  ],
  moods: [
    "Epik & Megah", "Heroik & Berani", "Kemenangan & Kejayaan", "Kuat & Berwibawa", "Petualangan",
    "Tragis & Pilu", "Sedih & Berkabung", "Menyayat Hati", "Melankolis", "Introspektif & Sunyi",
    "Mencekam & Menakutkan", "Tegang & Misterius", "Agresif & Kacau", "Gelap & Jahat", "Horor Gotik",
    "Surgawi & Gaib", "Bermimpi & Surealis", "Aneh & Ceria", "Damai & Tenang", "Romantis & Bergairah",
    "Megah & Kerajaan", "Mulia & Terhormat", "Tradisional & Akademik", "Drama Sinematik", "Mitos & Legendaris"
  ],
  vocals: [
    "Full Mixed Choir (SATB)", "Male Choir", "Female Choir", "Children Choir", "Gregorian Chant", 
    "Soprano Soloist", "Tenor Soloist", "Epic Cinematic Vocals", "Ethereal Female Vocalist", 
    "Operatic Vocals", "Baritone Soloist", "Humming Choir", "Staccato Choir Hits",
    "Napas", "Nafas Sedih", "Nafas Marah", "Nafas Bahagia"
  ],
  emotions: [
    "Appassionato (Penuh Gairah)", "Dolce (Manis & Lembut)", "Lacrimoso (Penuh Air Mata)", "Con Fuoco (Berapi-api)",
    "Cantabile (Seperti Menyanyi)", "Maestoso (Agung/Mulia)", "Espressivo (Ekspresif)", "Agitato (Gelisah/Cepat)",
    "Sotto Voce (Berbisik)", "Grave (Serius & Berat)", "Leggiero (Ringan & Halus)", "Doloroso (Pedih/Sedih)",
    "Furioso (Sangat Marah)", "Amoroso (Penuh Kasih)", "Misterioso (Misterius)", "Trionfante (Kemenangan)"
  ],
  tempos: [
    "Adagio (Sangat Lambat)", "Andante (Kecepatan Jalan)", "Moderato (Sedang)", "Allegro (Cepat & Ceria)", 
    "Presto (Sangat Cepat)", "Accelerando (Semakin Cepat)", "Rubato (Tempo Ekspresif)", "Staccato (Terputus-putus)", "Legato (Mengalir)"
  ]
};

interface HistoryItem {
  id: string;
  timestamp: number;
  lyrics: string;
  style: string;
  formattedLyrics: string;
}

export default function App() {
  const [ytLink, setYtLink] = useState("");
  const [lyricsInput, setLyricsInput] = useState("");
  const [selected, setSelected] = useState<{
    genres: string[];
    subitoLevel: string | null;
    intros: string[];
    instruments: string[];
    moods: string[];
    vocals: string[];
    emotions: string[];
    tempos: string[];
  }>({
    genres: [],
    subitoLevel: null,
    intros: [],
    instruments: [],
    moods: [],
    vocals: [],
    emotions: [],
    tempos: []
  });

  const [loading, setLoading] = useState(false);
  const [ytLoading, setYtLoading] = useState(false);
  const [result, setResult] = useState<{
    style: string;
    formattedLyrics: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ 
    message: "", 
    type: 'info', 
    visible: false 
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ali_maksum_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('ali_maksum_history', JSON.stringify(updated));
  }, [history]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const toggleOption = (category: keyof typeof selected, option: string) => {
    setSelected(prev => {
      const current = prev[category];
      if (Array.isArray(current)) {
        const idx = current.indexOf(option);
        const next = [...current];
        if (idx > -1) next.splice(idx, 1);
        else next.push(option);
        return { ...prev, [category]: next };
      } else {
        return { ...prev, [category]: prev[category] === option ? null : option };
      }
    });
  };

  const generateWithFallback = async (
    prompt: string, 
    systemInstruction: string, 
    useSearch: boolean = false
  ) => {
    let lastError: any = null;

    for (const modelName of MODELS) {
      try {
        const config: any = {
          systemInstruction,
          responseMimeType: "application/json",
        };

        if (useSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config
        });

        return { data: JSON.parse(response.text), modelUsed: modelName };
      } catch (error: any) {
        console.warn(`Model ${modelName} failed:`, error);
        lastError = error;
        // If it's a 429, try next model. Otherwise, if it's a critical error, maybe stop?
        // But user wants fallback for quota, so we continue.
        continue;
      }
    }
    throw lastError;
  };

  const analyzeYoutubeRef = async () => {
    if (!ytLink.trim()) return showToast("Masukkan link YouTube terlebih dahulu!", 'error');
    
    setYtLoading(true);
    setSelected({
      genres: [],
      subitoLevel: null,
      intros: [],
      instruments: [],
      moods: [],
      vocals: [],
      emotions: [],
      tempos: []
    });

    const systemInstruction = `Anda adalah Ali Maksum, asisten cerdas yang menganalisis musik dari referensi link YouTube.
    Gunakan alat googleSearch untuk mencari informasi tentang video tersebut (judul, artis, genre, instrumen, mood).
    Berdasarkan informasi tersebut, tentukan karakteristik musiknya dari daftar opsi yang tersedia.
    Hanya pilih opsi yang ada di daftar ini: ${JSON.stringify(OPTIONS)}.
    Keluarkan HANYA format JSON murni: { "genres": [], "intros": [], "instruments": [], "moods": [], "vocals": [], "emotions": [], "tempos": [], "subitoLevel": string|null }.
    Pilih maksimal 2-3 opsi per kategori yang paling akurat menggambarkan referensi tersebut.`;

    try {
      const { data: analysis, modelUsed } = await generateWithFallback(
        `Analisis link YouTube ini dan pilihkan opsi orkestrasi yang tepat: ${ytLink}`,
        systemInstruction,
        true
      );
      
      setSelected(prev => ({
        ...prev,
        ...analysis
      }));

      showToast(`Analisis berhasil (via ${modelUsed})`, 'success');
    } catch (error: any) {
      console.error("YouTube Analysis Error:", error);
      if (error?.message?.includes("429") || error?.status === 429) {
        showToast("Semua model mencapai batas kuota. Silakan tunggu beberapa menit.", 'error');
      } else {
        showToast("Gagal menganalisis link. Pastikan link benar atau coba lagi nanti.", 'error');
      }
    } finally {
      setYtLoading(false);
    }
  };

  const generateMusicStyle = async () => {
    if (!lyricsInput.trim()) return showToast("Masukkan lirik atau deskripsi terlebih dahulu!", 'error');

    setLoading(true);
    setResult(null);

    const systemInstruction = `Anda adalah Ali Maksum, Konduktor & Music Producer AI profesional spesialisasi Orchestra. 
    Tugas Anda adalah merancang style musik untuk AI generatif musik (Suno/Udio). 
    Berikan JSON dengan:
    1. "style": Prompt teknik musik (Inggris) yang kaya akan detail instrumen orkestra.
    2. "formattedLyrics": Struktur lirik dengan tag [Intro], [Main Theme], [Chorus/Climax], [Bridge], [Outro].`;

    const userPrompt = `Input Lirik/Scene: "${lyricsInput}". 
    Pilihan:
    Gaya: ${selected.genres.join(', ')}
    Intensitas Kejutan (Subito): ${selected.subitoLevel || 'N/A'}
    Intro: ${selected.intros.join(', ')}
    Instrumen: ${selected.instruments.join(', ')}
    Mood/Suasana: ${selected.moods.join(', ')}
    Vokal: ${selected.vocals.join(', ')}
    Emosional: ${selected.emotions.join(', ')}
    Tempo/Teknik: ${selected.tempos.join(', ')}`;

    try {
      const { data, modelUsed } = await generateWithFallback(
        userPrompt,
        systemInstruction
      );

      setResult(data);
      
      saveToHistory({
        lyrics: lyricsInput,
        style: data.style,
        formattedLyrics: data.formattedLyrics
      });

      showToast(`Komposisi berhasil (via ${modelUsed})`, 'success');
    } catch (error: any) {
      console.error("Generation Error:", error);
      if (error?.message?.includes("429") || error?.status === 429) {
        showToast("Semua model mencapai batas kuota. Silakan tunggu sebentar.", 'error');
      } else {
        showToast(`Gagal memproses data. Silakan coba lagi.`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Teks berhasil disalin!", 'success');
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ali_maksum_history');
    showToast("Riwayat dihapus.", 'info');
  };

  const loadFromHistory = (item: HistoryItem) => {
    setLyricsInput(item.lyrics);
    setResult({
      style: item.style,
      formattedLyrics: item.formattedLyrics
    });
    setShowHistory(false);
    showToast("Memuat dari riwayat.", 'info');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
              <Sparkles className="w-3 h-3" />
              <span>PRODUCTION GRADE AI ARCHITECT</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_auto] animate-gradient-x mb-4">
              Ali Maksum
            </h1>
            <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Arsitek Aransemen Orchestra & Cinematic. <br className="hidden md:block" />
              Transformasikan ide Anda menjadi komposisi orkestra yang megah dan presisi.
            </p>
          </motion.div>

          <div className="absolute top-0 right-0">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all text-slate-400 hover:text-blue-400"
              title="Riwayat"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Inputs Section */}
          <div className="space-y-8">
            
            {/* YouTube Reference */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6 rounded-2xl shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-3 text-slate-200">
                  <Youtube className="w-5 h-5 text-red-500" />
                  Referensi YouTube
                </h2>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Analysis Module v2.0</div>
              </div>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={ytLink}
                    onChange={(e) => setYtLink(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-sm text-slate-200 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 focus:outline-none transition-all placeholder:text-slate-600" 
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <button 
                  onClick={analyzeYoutubeRef}
                  disabled={ytLoading}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20 flex items-center gap-2"
                >
                  {ytLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>{ytLoading ? "Menganalisis" : "Analisis"}</span>
                </button>
              </div>
            </motion.section>

            {/* Lyrics Input */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
              <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-200">
                <FileText className="w-5 h-5 text-blue-400" />
                Lirik & Deskripsi Adegan
              </h2>
              <textarea 
                value={lyricsInput}
                onChange={(e) => setLyricsInput(e.target.value)}
                className="w-full h-48 bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:outline-none scroll-custom resize-none placeholder:text-slate-600 leading-relaxed" 
                placeholder="Tuliskan lirik lagu Anda atau deskripsikan suasana musik yang ingin diciptakan secara mendetail..."
              ></textarea>
            </motion.section>

            {/* Orchestra Customization */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold flex items-center gap-3 text-slate-200">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  Kustomisasi Orchestra
                </h2>
                <AnimatePresence>
                  {selected.genres.includes("Orchestra Kejut (Subito/Surprise)") && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="subito-panel p-2 rounded-xl"
                    >
                      <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mb-1.5 px-1">Tingkat Kejutan</p>
                      <div className="flex gap-1">
                        {OPTIONS.subitoLevels.map(opt => (
                          <button 
                            key={opt}
                            onClick={() => setSelected(prev => ({ ...prev, subitoLevel: prev.subitoLevel === opt ? null : opt }))}
                            className={`px-2 py-1 text-[9px] rounded-lg border transition-all ${selected.subitoLevel === opt ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-slate-800/50 border-slate-700 text-amber-200/50 hover:text-amber-200'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-8 h-[500px] overflow-y-auto pr-4 scroll-custom">
                {[
                  { label: "Gaya Orchestra", key: "genres" as const, color: "blue" },
                  { label: "Intro Orchestra", key: "intros" as const, color: "purple" },
                  { label: "Instrumen Spesifik", key: "instruments" as const, color: "indigo" },
                  { label: "Mood & Atmosfer", key: "moods" as const, color: "pink" },
                  { label: "Vokal & Choir", key: "vocals" as const, color: "rose" },
                  { label: "Ekspresi Emosional", key: "emotions" as const, color: "orange" },
                  { label: "Tempo & Teknik", key: "tempos" as const, color: "emerald" }
                ].map((section, sIdx) => (
                  <div key={section.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${section.color}-500 shadow-[0_0_8px_rgba(var(--color-${section.color}-500),0.5)]`} />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{section.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {OPTIONS[section.key].map((opt, oIdx) => (
                        <button 
                          key={opt}
                          onClick={() => toggleOption(section.key, opt)}
                          className={`option-btn px-3 py-1.5 text-[10px] rounded-lg border transition-all duration-300 ${selected[section.key].includes(opt) ? 'active' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Action Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateMusicStyle}
            disabled={loading}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Music className="w-5 h-5" />
              )}
              <span className="text-lg tracking-tight">{loading ? "MERAMU KOMPOSISI..." : "BANGUN KOMPOSISI"}</span>
            </div>
          </motion.button>

          {/* Results Area */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Prompt Output */}
                  <section className="card p-6 rounded-2xl shadow-2xl border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Prompt Style (Suno/Udio)</h3>
                      <button 
                        onClick={() => copyToClipboard(result.style)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 bg-slate-900/80 rounded-xl text-sm font-mono text-slate-300 border border-slate-800/50 leading-relaxed break-words">
                      {result.style}
                    </div>
                  </section>

                  {/* Lyrics Output */}
                  <section className="card p-6 rounded-2xl shadow-2xl border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Struktur Lirik Optimal</h3>
                      <button 
                        onClick={() => copyToClipboard(result.formattedLyrics)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-purple-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900/80 rounded-xl text-xs font-sans text-slate-300 border border-slate-800/50 h-80 overflow-y-auto scroll-custom whitespace-pre-wrap leading-relaxed">
                      {result.formattedLyrics}
                    </pre>
                  </section>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-12 rounded-2xl border-dashed border-2 border-slate-800 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 font-bold">Belum Ada Komposisi</h3>
                    <p className="text-slate-600 text-xs max-w-[200px] mx-auto mt-1">Masukkan lirik dan pilih kustomisasi untuk memulai arsitektur musik Anda.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* History Sidebar Overlay */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-bottom border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <History className="w-5 h-5 text-blue-400" />
                  Riwayat Komposisi
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={clearHistory}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    title="Hapus Semua"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-custom">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-slate-600">
                    <p>Belum ada riwayat.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left group card p-4 rounded-xl hover:border-blue-500/50 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-slate-300 line-clamp-2 leading-relaxed">
                        {item.lyrics}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' :
              toast.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' :
              'bg-blue-600/90 border-blue-500/50 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
             <Sparkles className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
