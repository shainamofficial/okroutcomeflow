/**
 * Escapes LIKE/ILIKE pattern metacharacters in user input so it matches
 * literally. Without this, input like "%" matches every row — the same
 * wildcard-injection shape as the share-link viewer bug fixed in Phase 0.
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, "\\$&");
}
