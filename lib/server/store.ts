/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { PLAYLISTS } from "../demo-data";
import type { Playlist } from "../types";
import { getDB } from "./db";
import {
  createSession as createSessionD1,
  getSessionUser as getSessionUserD1,
  deleteSession as deleteSessionD1,
  revokeUserSessions as revokeUserSessionsD1,
  cleanupExpiredSessions as cleanupExpiredSessionsD1,
} from "./session-store";

const users = new Map<string, { id: string; email: string; passwordHash: string; username: string; displayName: string; avatarSeed: number; createdAt: string }>();
const sessions = new Map<string, string>(); // dev fallback only
const playlistsByUser = new Map<string, Playlist[]>();
const favoritesByUser = new Map<string, Set<string>>();
const historyByUser = new Map<string, { trackId: string; playedAt: string; listenedDuration: number }[]>();
const prefsByUser = new Map<string, any>();

function seedUserPlaylists(userId: string) {
  if (!playlistsByUser.has(userId)) {
    playlistsByUser.set(userId, JSON.parse(JSON.stringify(PLAYLISTS)));
  }
}

export async function findUserByEmail(email: string) {
  const db = getDB();
  if (db) {
    // D1 path (best-effort; falls back to in-memory if query fails)
    try {
      const row = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
      if (row) return row as any;
    } catch {
      // fall through
    }
  }
  for (const u of Array.from(users.values())) if (u.email === email) return u;
  return null;
}
export async function findUserById(id: string) {
  const db = getDB();
  if (db) {
    try {
      const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
      if (row) return row as any;
    } catch {
      // fall through
    }
  }
  return users.get(id) ?? null;
}

export async function createUser(email: string, password: string, username?: string) {
  const existing = await findUserByEmail(email);
  if (existing) return null;
  const id = "u_" + Math.random().toString(36).slice(2, 12);
  const passwordHash = await bcrypt.hash(password, 10);
  const u = { id, email, passwordHash, username: username || email.split("@")[0], displayName: username || email.split("@")[0], avatarSeed: 1, createdAt: new Date().toISOString() };
  users.set(id, u);
  seedUserPlaylists(id);
  return u;
}

export async function verifyUser(email: string, password: string) {
  const u = await findUserByEmail(email);
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  return u;
}

export async function createSession(userId: string): Promise<string> {
  const db = getDB();
  if (db) {
    return createSessionD1(db, userId);
  }
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  sessions.set(token, userId);
  return token;
}
export async function getSessionUser(
  token: string | undefined,
  db?: any,
): Promise<any | null> {
  const database = db || getDB();
  if (database) {
    return getSessionUserD1(database, token);
  }
  if (!token) return null;
  const uid = sessions.get(token);
  if (!uid) return null;
  return findUserById(uid);
}
export async function deleteSession(token: string) {
  const db = getDB();
  if (db) {
    await deleteSessionD1(db, token);
    return;
  }
  sessions.delete(token);
}
export async function revokeUserSessions(userId: string) {
  const db = getDB();
  if (db) {
    await revokeUserSessionsD1(db, userId);
    return;
  }
  for (const [token, uid] of sessions.entries()) {
    if (uid === userId) sessions.delete(token);
  }
}
export async function cleanupExpiredSessions() {
  const db = getDB();
  if (db) {
    await cleanupExpiredSessionsD1(db);
  }
}


export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  seedUserPlaylists(userId);
  return playlistsByUser.get(userId)!;
}
export async function createPlaylist(userId: string, name: string, description = ""): Promise<Playlist> {
  seedUserPlaylists(userId);
  const pl: Playlist = { id: "pl_" + Math.random().toString(36).slice(2, 10), name, description, trackIds: [], isPublic: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), seed: Math.floor(Math.random() * 10) + 1 };
  playlistsByUser.get(userId)!.unshift(pl);
  return pl;
}
export async function updatePlaylist(userId: string, id: string, patch: Partial<Playlist>) {
  seedUserPlaylists(userId);
  const list = playlistsByUser.get(userId)!;
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  return list[idx];
}
export async function deletePlaylist(userId: string, id: string) {
  seedUserPlaylists(userId);
  const list = playlistsByUser.get(userId)!;
  const i = list.findIndex((p) => p.id === id);
  if (i >= 0) list.splice(i, 1);
}

export async function addToPlaylist(userId: string, playlistId: string, trackId: string) {
  seedUserPlaylists(userId);
  const list = playlistsByUser.get(userId)!;
  const pl = list.find((p) => p.id === playlistId);
  if (pl && !pl.trackIds.includes(trackId)) { pl.trackIds.push(trackId); pl.updatedAt = new Date().toISOString(); }
}
export async function removeFromPlaylist(userId: string, playlistId: string, trackId: string) {
  seedUserPlaylists(userId);
  const list = playlistsByUser.get(userId)!;
  const pl = list.find((p) => p.id === playlistId);
  if (pl) { pl.trackIds = pl.trackIds.filter((id) => id !== trackId); pl.updatedAt = new Date().toISOString(); }
}
export async function reorderPlaylist(userId: string, playlistId: string, from: number, to: number) {
  seedUserPlaylists(userId);
  const list = playlistsByUser.get(userId)!;
  const pl = list.find((p) => p.id === playlistId);
  if (!pl) return;
  const arr = [...pl.trackIds];
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  pl.trackIds = arr;
  pl.updatedAt = new Date().toISOString();
}

export async function getFavorites(userId: string): Promise<string[]> {
  if (!favoritesByUser.has(userId)) favoritesByUser.set(userId, new Set());
  return Array.from(favoritesByUser.get(userId)!);
}
export async function toggleFavorite(userId: string, trackId: string): Promise<boolean> {
  if (!favoritesByUser.has(userId)) favoritesByUser.set(userId, new Set());
  const set = favoritesByUser.get(userId)!;
  if (set.has(trackId)) { set.delete(trackId); return false; }
  set.add(trackId); return true;
}

export async function getHistory(userId: string) {
  if (!historyByUser.has(userId)) historyByUser.set(userId, []);
  return historyByUser.get(userId)!;
}
export async function addHistory(userId: string, trackId: string, listenedDuration: number) {
  if (!historyByUser.has(userId)) historyByUser.set(userId, []);
  historyByUser.get(userId)!.unshift({ trackId, playedAt: new Date().toISOString(), listenedDuration });
  if (historyByUser.get(userId)!.length > 200) historyByUser.get(userId)!.pop();
}

export async function getPrefs(userId: string) {
  if (!prefsByUser.has(userId)) prefsByUser.set(userId, {});
  return prefsByUser.get(userId)!;
}
export async function setPrefs(userId: string, patch: any) {
  const cur = await getPrefs(userId);
  const next = { ...cur, ...patch };
  prefsByUser.set(userId, next);
  return next;
}

export async function publicUser(u: any) {
  return { id: u.id, email: u.email, username: u.username, displayName: u.displayName, avatarSeed: u.avatarSeed, createdAt: u.createdAt };
}