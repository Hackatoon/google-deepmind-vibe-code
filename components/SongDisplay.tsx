
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Disc, Music2, Music, Archive } from 'lucide-react';
import { SongData } from '../types';
import JSZip from 'jszip';

interface SongDisplayProps {
  song: SongData;
  coverArtUrl: string | null;
  audioUrl: string | null;
  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
}

export const SongDisplay: React.FC<SongDisplayProps> = ({ 
  song, 
  coverArtUrl, 
  audioUrl,
  isGeneratingImage,
  isGeneratingAudio 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownloadZip = async () => {
    if (!song || !coverArtUrl || !audioUrl) return;
    setIsZipping(true);

    try {
        const zip = new JSZip();
        
        // 1. Add Lyrics Text
        const lyricsContent = `Title: ${song.title}\nMood: ${song.mood}\nGenre: ${song.genre}\nKey: ${song.key}\nTempo: ${song.tempo}\nChords: ${song.chords}\n\nLyrics:\n${song.lyrics}`;
        zip.file(`${song.title.replace(/[^a-z0-9]/gi, '_')}_lyrics.txt`, lyricsContent);

        // 2. Add Cover Art (fetch blob from data url)
        const imageBlob = await fetch(coverArtUrl).then(r => r.blob());
        zip.file(`${song.title.replace(/[^a-z0-9]/gi, '_')}_cover.png`, imageBlob);

        // 3. Add Audio (fetch blob from object url)
        const audioBlob = await fetch(audioUrl).then(r => r.blob());
        zip.file(`${song.title.replace(/[^a-z0-9]/gi, '_')}_song.wav`, audioBlob);

        // Generate Zip
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger Download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}_pack.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        console.error("Error creating zip:", e);
        alert("Could not create download package.");
    } finally {
        setIsZipping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Cover Art & Audio Player Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group shadow-2xl">
          {coverArtUrl ? (
            <img 
              src={coverArtUrl} 
              alt={song.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
               {isGeneratingImage ? (
                 <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
               ) : (
                 <Disc className="w-16 h-16 opacity-20" />
               )}
               <span className="text-sm font-medium">{isGeneratingImage ? 'Generating Cover Art...' : 'Cover Art Area'}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
             <h3 className="text-2xl font-bold text-white drop-shadow-md">{song.title}</h3>
             <p className="text-zinc-300 text-sm font-medium">{song.genre} • {song.mood}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
           <button 
             onClick={togglePlay}
             disabled={!audioUrl || isGeneratingAudio}
             className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
           >
             {isGeneratingAudio ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
             ) : isPlaying ? (
               <Pause className="w-6 h-6 fill-current" />
             ) : (
               <Play className="w-6 h-6 fill-current ml-1" />
             )}
           </button>
           
           <div className="flex-1">
             <div className="text-sm font-medium text-white mb-1">
               {isGeneratingAudio ? 'Synthesizing Vocals...' : 'Song Preview'}
             </div>
             <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
               {/* Simple progress bar simulation or real if we implemented time tracking */}
               <div className={`h-full bg-purple-500 rounded-full ${isPlaying ? 'animate-pulse' : 'w-0'}`} style={{ width: isPlaying ? '100%' : '0%' }} />
             </div>
           </div>
           
           {audioUrl && (
             <audio ref={audioRef} src={audioUrl} className="hidden" />
           )}

            {audioUrl && !isGeneratingAudio && !isGeneratingImage && coverArtUrl && (
                <button 
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    title="Download All (ZIP)"
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                    {isZipping ? (
                        <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                    ) : (
                        <Archive className="w-5 h-5" />
                    )}
                </button>
            )}
        </div>

        {/* Music Details */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 text-zinc-300">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold uppercase tracking-wider">Composition</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wide">Key</div>
                    <div className="text-white font-medium">{song.key || "N/A"}</div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wide">Tempo</div>
                    <div className="text-white font-medium">{song.tempo || "N/A"}</div>
                </div>
                <div className="col-span-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Chord Progression</div>
                    <div className="text-white font-mono text-sm bg-black/30 p-2 rounded border border-white/5">
                        {song.chords || "N/A"}
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Lyrics Section */}
      <div className="lg:col-span-7">
        <div className="glass-panel rounded-2xl p-8 h-full min-h-[500px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Music2 className="w-32 h-32" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-700 pb-4 flex items-center gap-2">
            <span className="text-purple-400">Lyrics</span>
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-zinc-300 font-serif text-lg leading-relaxed">
              {song.lyrics}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
