import { expect, test } from "vitest";
import type { UserRole, UserStatus, Follow, ListeningRoom, PlaylistReaction } from "@/lib/types";

test("UserRole type accepts user and admin", () => {
  const r: UserRole = "admin";
  expect(r).toBe("admin");
  const r2: UserRole = "user";
  expect(r2).toBe("user");
});

test("UserStatus type accepts active and suspended", () => {
  const s: UserStatus = "active";
  expect(s).toBe("active");
  const s2: UserStatus = "suspended";
  expect(s2).toBe("suspended");
});

test("Follow type shape", () => {
  const f: Follow = {
    id: "f1",
    followerId: "u1",
    followeeId: "u2",
    createdAt: "2026-01-01",
  };
  expect(f.followerId).toBe("u1");
  expect(f.followeeId).toBe("u2");
});

test("ListeningRoom type shape", () => {
  const room: ListeningRoom = {
    id: "room1",
    name: "Listening Room",
    ownerId: "u1",
    isPublic: true,
    currentTime: 0,
    isPlaying: false,
    updatedAt: "2026-01-01",
  };
  expect(room.isPublic).toBe(true);
  expect(room.isPlaying).toBe(false);
});

test("PlaylistReaction type shape", () => {
  const reaction: PlaylistReaction = {
    id: "r1",
    playlistId: "p1",
    userId: "u1",
    reaction: "like",
    createdAt: "2026-01-01",
  };
  expect(reaction.reaction).toBe("like");
});
