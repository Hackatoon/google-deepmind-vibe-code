
import React, { useState } from 'react';
import { Music, Mic2 } from 'lucide-react';

interface LyricFormProps {
  onSubmit: (mood: string, genre: string, keywords: string, voiceName: string) => void;
  isLoading: boolean;
}

const MOODS = [
  'Melancholic', 'Happy', 'Energetic', 'Relaxed', 'Romantic', 
  'Dark', 'Euphoric', 'Nostalgic', 'Hopeful', 'Aggressive'
];

const GENRES = [
  'Lo-Fi Hip Hop', 'Pop', 'Rock', 'Jazz', 'Synthwave', 
  'R&B', 'Country', 'Classical', 'Heavy Metal', 'Electronic'
];

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

export const LyricForm: React.FC<LyricFormProps> = ({ onSubmit, isLoading }) => {
  const [mood, setMood] = useState(MOODS[0]);
  const [genre, setGenre] = useState(GENRES[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [keywords, setKeywords] = useState('Rainy window, late night coffee, missing you');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(mood, genre, keywords, voice);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full glass-panel rounded-2xl p-6 md:p-8 shadow-xl border-t border-white/5">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Mood</label>
            <div className="relative">
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
              >
                {MOODS.map(m => (
                  <option key={m} value={m} className="bg-zinc-900">{m}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Genre</label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
              >
                {GENRES.map(g => (
                  <option key={g} value={g} className="bg-zinc-900">{g}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Singer Voice</label>
            <div className="relative">
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
              >
                {VOICES.map(v => (
                  <option key={v} value={v} className="bg-zinc-900">{v}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <Mic2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Keywords & Theme</label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-zinc-600 h-24 resize-none"
            placeholder="Describe the song's topic..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Magic...
            </>
          ) : (
            <>
              <Music className="w-5 h-5" />
              Generate Song
            </>
          )}
        </button>
      </div>
    </form>
  );
};
