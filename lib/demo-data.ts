import type { Track, Artist, Album, Playlist } from "./types";

export const ARTISTS: Artist[] = [
  { id: "a1", name: "Aurora Vale", bio: "Dream-pop vocalist crafting midnight soundscapes.", followers: 124000, seed: 1 },
  { id: "a2", name: "Nocturne Theory", bio: "Electronic producer blending ambient textures.", followers: 89000, seed: 2 },
  { id: "a3", name: "Solstice", bio: "Acoustic songwriter of golden-hour ballads.", followers: 56000, seed: 3 },
  { id: "a4", name: "Echo Harbor", bio: "Indie duo with cinematic choruses.", followers: 210000, seed: 4 },
  { id: "a5", name: "Mira Cloud", bio: "Lo-fi beats and soft piano.", followers: 34000, seed: 5 },
  { id: "a6", name: "NF", bio: "Rapper and songwriter known for raw, emotional lyrics about mental health and personal struggle.", followers: 1500000, seed: 6 },
];

export const ALBUMS: Album[] = [
  { id: "al1", title: "Midnight Paradise", artistId: "a1", artist: "Aurora Vale", releaseDate: "2025-09-12", trackIds: ["t1","t2"], seed: 1 },
  { id: "al2", title: "Neon Tides", artistId: "a2", artist: "Nocturne Theory", releaseDate: "2025-06-03", trackIds: ["t3","t4"], seed: 2 },
  { id: "al3", title: "Golden Hour", artistId: "a3", artist: "Solstice", releaseDate: "2024-11-20", trackIds: ["t5"], seed: 3 },
  { id: "al4", title: "Echoes", artistId: "a4", artist: "Echo Harbor", releaseDate: "2025-02-14", trackIds: ["t6"], seed: 4 },
  { id: "al5", title: "The Search", artistId: "a6", artist: "NF", releaseDate: "2019-05-17", trackIds: ["t7"], seed: 6 },
];

export const TRACKS: Track[] = [
  { id: "t1", title: "Welcome to Paradise", artist: "Aurora Vale", album: "Midnight Paradise", duration: 372.7, audioUrl: "/audio/track1.mp3", artworkSeed: 1, genre: "Dream Pop", trackNumber: 1, artistId: "a1", albumId: "al1" },
  { id: "t2", title: "Starlit Lullaby", artist: "Aurora Vale", album: "Midnight Paradise", duration: 425.95, audioUrl: "/audio/track2.mp3", artworkSeed: 2, genre: "Dream Pop", trackNumber: 2, artistId: "a1", albumId: "al1" },
  { id: "t3", title: "Neon Drift", artist: "Nocturne Theory", album: "Neon Tides", duration: 344.08, audioUrl: "/audio/track3.mp3", artworkSeed: 3, genre: "Electronic", trackNumber: 1, artistId: "a2", albumId: "al2" },
  { id: "t4", title: "Ocean Pulse", artist: "Nocturne Theory", album: "Neon Tides", duration: 302.52, audioUrl: "/audio/track4.mp3", artworkSeed: 4, genre: "Electronic", trackNumber: 2, artistId: "a2", albumId: "al2" },
  { id: "t5", title: "Golden Hour", artist: "Solstice", album: "Golden Hour", duration: 353.96, audioUrl: "/audio/track5.mp3", artworkSeed: 5, genre: "Acoustic", trackNumber: 1, artistId: "a3", albumId: "al3" },
  { id: "t6", title: "Echoes of You", artist: "Echo Harbor", album: "Echoes", duration: 279.64, audioUrl: "/audio/track6.mp3", artworkSeed: 6, genre: "Indie", trackNumber: 1, artistId: "a4", albumId: "al4" },
  { id: "t7", title: "The Search", artist: "NF", album: "The Search", duration: 222, audioUrl: "/audio/the-search.m4a", artworkSeed: 7, genre: "Hip-Hop", trackNumber: 1, artistId: "a6", albumId: "al5" },
];

export const PLAYLISTS: Playlist[] = [
  { id: "p1", name: "Late Night Dreams", description: "Soft songs for quiet hours.", trackIds: ["t1","t3","t5"], isPublic: false, createdAt: "2025-10-01", updatedAt: "2025-10-01", seed: 1 },
  { id: "p2", name: "Focus Flow", description: "Instrumental energy for deep work.", trackIds: ["t3","t4"], isPublic: false, createdAt: "2025-10-02", updatedAt: "2025-10-02", seed: 2 },
  { id: "p3", name: "Paradise Mix", description: "The best of Little Paradise.", trackIds: ["t1","t2","t3","t4","t5","t6"], isPublic: true, createdAt: "2025-10-03", updatedAt: "2025-10-03", seed: 3 },
];

export const MOODS = [
  { id: "dreamy", name: "Dreamy", gradient: "from-violet-900 to-indigo-900" },
  { id: "latenight", name: "Late Night", gradient: "from-slate-900 to-indigo-950" },
  { id: "rainy", name: "Rainy Days", gradient: "from-sky-900 to-slate-900" },
  { id: "heartbreak", name: "Heartbreak", gradient: "from-rose-900 to-purple-950" },
  { id: "romantic", name: "Romantic", gradient: "from-pink-900 to-rose-900" },
  { id: "peaceful", name: "Peaceful", gradient: "from-emerald-900 to-teal-900" },
  { id: "nostalgic", name: "Nostalgic", gradient: "from-amber-900 to-orange-900" },
  { id: "focus", name: "Focus", gradient: "from-cyan-900 to-blue-900" },
  { id: "happy", name: "Happiness", gradient: "from-yellow-700 to-orange-700" },
  { id: "lonely", name: "Lonely Nights", gradient: "from-gray-900 to-indigo-950" },
];

export const GENRES = ["Dream Pop","Electronic","Acoustic","Indie","Lo-Fi","Ambient","R&B","Jazz"];
