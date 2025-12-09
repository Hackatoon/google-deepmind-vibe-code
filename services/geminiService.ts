
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SongData } from "../types";
import { decode, decodeAudioData, audioBufferToWav } from "./audioUtils";
import { generateBackingTrack, mixAudioBuffers } from "./musicSynthesis";

// Initialize AI instance dynamically to ensure we pick up the latest API key if it changes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateLyrics(
  mood: string,
  genre: string,
  keywords: string
): Promise<SongData> {
  const ai = getAI();
  const prompt = `
    You are a professional songwriter and composer. Write a song based on the following parameters:
    Mood: ${mood}
    Genre: ${genre}
    Keywords: ${keywords}

    Return the result in JSON format with the following schema:
    {
      "title": "Song Title that matches the song's theme",
      "lyrics": "Full lyrics formatted with line breaks",
      "coverArtPrompt": "A detailed visual description for an album cover that matches the song's theme",
      "key": "Musical Key (e.g., C Minor)",
      "tempo": "Tempo in BPM (e.g., 120 BPM)",
      "chords": "Chord progression (e.g., Cm - Fm - G7)"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: { type: Type.STRING },
          coverArtPrompt: { type: Type.STRING },
          key: { type: Type.STRING },
          tempo: { type: Type.STRING },
          chords: { type: Type.STRING },
        },
        required: ["title", "lyrics", "coverArtPrompt", "key", "tempo", "chords"]
      }
    }
  });

  if (!response.text) throw new Error("No lyrics generated");
  
  const data = JSON.parse(response.text);
  return {
    ...data,
    mood,
    genre
  };
}

export async function generateCoverArt(
  prompt: string
): Promise<string> {
  const ai = getAI();
  
  // Use gemini-2.5-flash-image for standard image generation (default 1K)
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}

export async function generateSpeech(song: SongData, voiceName: string = 'Kore'): Promise<string> {
  const ai = getAI();
  
  // Note: We prepend "Sing: " to try and get a more rhythmic delivery, 
  // although the model is primarily TTS.
  const textToSay = `Sing: ${song.lyrics}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: textToSay,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }, 
        },
      },
    },
  });

  let base64Audio: string | undefined;

  // Iterate through all parts to find the audio data (inlineData)
  // The model might return text/metadata in the first part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      base64Audio = part.inlineData.data;
      break;
    }
  }

  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // 1. Decode TTS (Vocals)
  const vocalBuffer = await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000,
    1
  );

  // 2. Generate Backing Track (Music)
  const musicBuffer = await generateBackingTrack(
    song.chords,
    song.tempo,
    vocalBuffer.duration,
    audioContext
  );

  // 3. Mix Vocals and Music
  // Vocals @ 1.0, Music @ 0.4 (background)
  const finalBuffer = mixAudioBuffers(vocalBuffer, musicBuffer, audioContext, 1.0, 0.4);
  
  const wavBlob = await audioBufferToWav(finalBuffer);
  return URL.createObjectURL(wavBlob);
}
