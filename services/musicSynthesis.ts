
export const NOTE_FREQS: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88
};

function getChordFrequencies(chordName: string): number[] {
  // Normalize: remove minor/major/7 variations to get root
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];
  
  const root = rootMatch[1];
  const baseFreq = NOTE_FREQS[root];
  
  if (!baseFreq) return [];

  const isMinor = chordName.includes('m') && !chordName.includes('maj');
  
  // Simple Triad: Root, 3rd (Major +4 semi / Minor +3 semi), 5th (+7 semi)
  const thirdInterval = isMinor ? Math.pow(2, 3/12) : Math.pow(2, 4/12);
  const fifthInterval = Math.pow(2, 7/12);

  // Lower the octave for a backing pad sound (divide by 2)
  const f1 = baseFreq / 2;
  const f2 = f1 * thirdInterval;
  const f3 = f1 * fifthInterval;

  return [f1, f2, f3];
}

function parseTempo(tempoStr: string): number {
  const match = tempoStr.match(/(\d+)/);
  const bpm = match ? parseInt(match[1], 10) : 120;
  return Math.max(60, Math.min(200, bpm)); // Clamp between 60 and 200
}

function parseChords(chordsStr: string): number[][] {
  // Split by common delimiters: - , | or spaces
  const tokens = chordsStr.split(/[\s\-\|,]+/).filter(t => t.length > 0);
  
  const freqs = tokens.map(getChordFrequencies).filter(f => f.length > 0);
  
  // Fallback if parsing fails
  if (freqs.length === 0) {
    return [
      getChordFrequencies('C'),
      getChordFrequencies('G'),
      getChordFrequencies('Am'),
      getChordFrequencies('F')
    ];
  }
  
  return freqs;
}

export async function generateBackingTrack(
  chordsStr: string,
  tempoStr: string,
  duration: number,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const bpm = parseTempo(tempoStr);
  const chordFreqs = parseChords(chordsStr);
  
  // Create mono buffer for music
  const buffer = ctx.createBuffer(1, Math.ceil(duration * ctx.sampleRate), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  const secondsPerBeat = 60 / bpm;
  // Assume each chord lasts 4 beats (1 bar)
  const secondsPerChord = secondsPerBeat * 4;
  const samplesPerChord = Math.floor(secondsPerChord * ctx.sampleRate);
  
  // Synthesize
  for (let i = 0; i < data.length; i++) {
    // Determine which chord we are in
    const currentChordIndex = Math.floor(i / samplesPerChord) % chordFreqs.length;
    const notes = chordFreqs[currentChordIndex];
    
    let sampleValue = 0;
    
    // Add sine waves for each note in the chord
    const time = i / ctx.sampleRate;
    
    for (const freq of notes) {
       // Simple Sine Wave: sin(2 * PI * f * t)
       // Add a slight detune or multiple harmonics for richness? Keeping it simple.
       sampleValue += Math.sin(2 * Math.PI * freq * time);
       
       // Add a quiet harmonic an octave up
       sampleValue += 0.5 * Math.sin(2 * Math.PI * (freq * 2) * time);
    }
    
    // Normalize rough volume per voice
    sampleValue = sampleValue / (notes.length * 1.5);
    
    // Apply a simple envelope (Attack/Release) to the chord transitions to avoid clicking
    const localSampleIndex = i % samplesPerChord;
    const attackLen = 2000; // samples
    const releaseLen = 2000; // samples
    let envelope = 1;
    
    if (localSampleIndex < attackLen) {
      envelope = localSampleIndex / attackLen;
    } else if (localSampleIndex > samplesPerChord - releaseLen) {
      envelope = (samplesPerChord - localSampleIndex) / releaseLen;
    }
    
    data[i] = sampleValue * envelope * 0.5; // Master volume for music track
  }
  
  return buffer;
}

export function mixAudioBuffers(
  vocalBuffer: AudioBuffer,
  musicBuffer: AudioBuffer,
  ctx: AudioContext,
  vocalGain: number = 1.0,
  musicGain: number = 0.3
): AudioBuffer {
  const duration = Math.max(vocalBuffer.duration, musicBuffer.duration);
  const length = Math.ceil(duration * ctx.sampleRate);
  const outBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  
  const outData = outBuffer.getChannelData(0);
  const vocalData = vocalBuffer.getChannelData(0);
  const musicData = musicBuffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const v = i < vocalData.length ? vocalData[i] * vocalGain : 0;
    const m = i < musicData.length ? musicData[i] * musicGain : 0;
    
    // Simple mixing with hard limiter to prevent clipping
    let mix = v + m;
    if (mix > 1) mix = 1;
    if (mix < -1) mix = -1;
    
    outData[i] = mix;
  }
  
  return outBuffer;
}
