import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const playlistCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
});

export const playlistPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const preferencesPatchSchema = z.record(z.any());

export const historyAddSchema = z.object({
  trackId: z.string().min(1),
  listenedDuration: z.number().nonnegative().optional().default(0),
});

export const favoritesToggleSchema = z.object({}).passthrough();

export const reorderSchema = z.object({
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
});

export const playlistTrackSchema = z.object({
  trackId: z.string().min(1),
});