export interface Echo {
  id: string;
  title: string;
  username: string;
  avatarColor?: string; // Optional color for the avatar circle (fallback)
  avatarUrl?: string; // Profile picture URL from profiles table
  distance: number; // in miles
  reEchoCount: number;
  seenCount: number;
  audioUrl: string;
  transcript: string;
  hasReEchoed: boolean;
  createdAt: string;
  duration: number; // Duration in seconds
}
