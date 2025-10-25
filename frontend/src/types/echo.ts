export interface Echo {
  id: string;
  title: string;
  distance: number; // in miles
  reEchoCount: number;
  seenCount: number;
  audioUrl: string;
  transcript: string;
  hasReEchoed: boolean;
  createdAt: string;
}
