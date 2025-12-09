
import React, { useState } from 'react';
import { LyricForm } from './components/LyricForm';
import { SongDisplay } from './components/SongDisplay';
import { generateLyrics, generateCoverArt, generateSpeech } from './services/geminiService';
import { SongData } from './types';

function App() {
  const [song, setSong] = useState<SongData | null>(null);
  const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const handleGenerate = async (mood: string, genre: string, keywords: string, voiceName: string) => {
    // Reset states
    setSong(null);
    setCoverArtUrl(null);
    setAudioUrl(null);
    setIsLyricsLoading(true);

    try {
      // 1. Generate Lyrics
      const songData = await generateLyrics(mood, genre, keywords);
      setSong(songData);
      setIsLyricsLoading(false);

      // 2. Parallel Generation for Image and Audio
      // We don't await them here to block UI, we handle their loading states independently
      
      // Start Image Gen
      setIsImageLoading(true);
      generateCoverArt(songData.coverArtPrompt)
        .then(url => setCoverArtUrl(url))
        .catch(err => console.error("Image gen failed", err))
        .finally(() => setIsImageLoading(false));

      // Start Audio Gen (Music + Speech)
      setIsAudioLoading(true);
      generateSpeech(songData, voiceName)
        .then(url => setAudioUrl(url))
        .catch(err => console.error("Audio gen failed", err))
        .finally(() => setIsAudioLoading(false));

    } catch (error) {
      console.error("Generation failed", error);
      setIsLyricsLoading(false);
      alert("Failed to generate song. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-purple-500/30 pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <header className="mb-12 text-center space-y-4">
          <div className="inline-block p-1 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700 mb-4">
             <div className="px-4 py-1 text-xs font-semibold text-zinc-400 tracking-wide uppercase">
               AI Songwriter
             </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Garmony
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Generate original lyrics, album art, music, and vocal performances in seconds.
          </p>
        </header>

        <div className="space-y-12">
           <div className="transition-opacity duration-500 opacity-100">
             <LyricForm onSubmit={handleGenerate} isLoading={isLyricsLoading} />
           </div>

           {(song || isLyricsLoading) && (
             <div className="min-h-[400px]">
                {song ? (
                   <SongDisplay 
                     song={song} 
                     coverArtUrl={coverArtUrl} 
                     audioUrl={audioUrl}
                     isGeneratingImage={isImageLoading}
                     isGeneratingAudio={isAudioLoading}
                   />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-zinc-500 animate-pulse">
                    Thinking of rhymes...
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

export default App;
