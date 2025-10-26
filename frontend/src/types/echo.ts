export interface Echo {
  id: string;
  userId: string; // User ID of the echo owner
  title: string;
  username: string;
  avatarColor?: string; // Optional color for the avatar circle (fallback)
  avatarUrl?: string; // Profile picture URL from profiles table
  distance: number; // in meters
  reEchoCount: number;
  seenCount: number;
  audioUrl: string;
  transcript: string;
  hasReEchoed: boolean;
  createdAt: string;
  duration: number; // Duration in seconds
}
