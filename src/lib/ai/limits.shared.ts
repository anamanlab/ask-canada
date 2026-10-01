/**
 * Limits the browser and the server must agree on. These are constants (never read from the environment),
 * so client code can import them. The env-tuned limits live in `./limits` (server only); the one the
 * composer needs, `maxInputChars`, is handed down from the server by the page.
 */
export const UPLOAD_LIMITS = {
  /** Attachments per message. */
  maxFiles: 3,
  /** Bytes per attachment. */
  maxFileBytes: 6 * 1024 * 1024,
  allowedMedia: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'application/pdf'] as readonly string[],
} as const;

/** Characters per question when the host doesn't set `AI_MAX_INPUT_CHARS`. */
export const DEFAULT_MAX_INPUT_CHARS = 4000;
