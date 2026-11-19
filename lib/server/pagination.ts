export function encodeCursor({ offset, limit }: { offset: number; limit: number }): string {
  return Buffer.from(JSON.stringify({ offset, limit })).toString("base64url");
}

export function decodeCursor(cursor: string): { offset: number; limit: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof parsed.offset !== "number" || typeof parsed.limit !== "number") return null;
    return { offset: parsed.offset, limit: parsed.limit };
  } catch {
    return null;
  }
}

export function paginate<T>(
  items: T[],
  cursor?: string,
  limit = 50,
): { items: T[]; nextCursor?: string; hasMore: boolean } {
  const parsed = cursor ? decodeCursor(cursor) : null;
  const offset = parsed?.offset ?? 0;
  const page = items.slice(offset, offset + limit);
  const nextCursor =
    offset + limit < items.length ? encodeCursor({ offset: offset + limit, limit }) : undefined;
  return { items: page, nextCursor, hasMore: !!nextCursor };
}
