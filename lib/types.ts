export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
  artworkSeed: number; // for gradient
  genre: string;
  trackNumber?: number;
  artistId?: string;
  albumId?: string;
};

export type Artist = {
  id: string;
  name: string;
  bio: string;
  followers: number;
  seed: number;
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  artist: string;
  releaseDate: string;
  trackIds: string[];
  seed: number;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  seed: number;
};

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarSeed: number;
  createdAt: string;
  role?: "user" | "admin";
  status?: "active" | "suspended";
};

export type LyricsLine = {
  time: number;
  text: string;
  words?: { time: number; word: string }[];
  translation?: string;
  romanization?: string;
};

export type Lyrics = {
  trackId: string;
  format: "lrc";
  language: string;
  content: string;
  offset: number;
  lines: LyricsLine[];
};

export type RepeatMode = "off" | "one" | "all";

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";

export type Follow = {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
};

export type ListeningActivity = {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  isPublic: boolean;
};

export type PlaylistCollaborator = {
  id: string;
  playlistId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  createdAt: string;
};

export type ListeningRoom = {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  currentTrackId?: string;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: string;
};

export type RoomSession = {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
};

export type PlaylistReaction = {
  id: string;
  playlistId: string;
  userId: string;
  reaction: string;
  createdAt: string;
};

export type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
  crossfadeLength: number;
  sleepTimerActive: boolean;
  sleepTimerRemaining: number;
  audioQuality: "standard" | "high" | "lossless";
};

export type Preferences = {
  theme: "dark" | "light" | "system";
  accent: string;
  defaultVolume: number;
  autoplay: boolean;
  crossfade: boolean;
  rememberPosition: boolean;
  lyricsAutoScroll: boolean;
  lyricsFontSize: "sm" | "md" | "lg";
  lyricsOffset: number;
  lyricsMode: "compact" | "immersive";
  privateProfile: boolean;
  privatePlaylists: boolean;
  reducedTransparency: boolean;
  favoriteGenres: string[];
  favoriteMoods: string[];
  lyricsTheme: "default" | "minimal" | "highlight" | "karaoke";
  sleepTimerMinutes: number;
  audioQuality: "standard" | "high" | "lossless";
  crossfadeLength: number;
};

export type AdminAction =
  | "create_user"
  | "suspend_user"
  | "activate_user"
  | "promote_user"
  | "delete_user"
  | "unpublish_track"
  | "publish_track"
  | "delete_track"
  | "feature_playlist"
  | "unfeature_playlist"
  | "update_artist"
  | "delete_artist"
  | "update_playlist"
  | "delete_playlist"
  | "update_setting"
  | "view_stats"
  | "update_track"
  | "create_track"
  | "follow_user"
  | "unfollow_user"
  | "update_lyrics";

export type AuditLogEntry = {
  id: string;
  user_id?: string;
  action: AdminAction;
  target_type?: string;
  target_id?: string;
  details?: string;
  created_at: string;
};
