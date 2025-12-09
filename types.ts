
export interface SongData {
  title: string;
  lyrics: string;
  coverArtPrompt: string;
  mood: string;
  genre: string;
  key: string;
  tempo: string;
  chords: string;
}

export interface GeneratedContent {
  song: SongData | null;
  coverArtUrl: string | null;
  audioUrl: string | null;
}
