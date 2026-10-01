/**
 * Stopping work when nobody is listening any more.
 *
 * A model call must end when the person closes the tab, presses Stop, or the answer runs past its time
 * budget; otherwise the provider keeps generating (and billing) tokens no one will read. Two signals say
 * "the client is gone": the request's own `signal`, and the response body being cancelled. Hosts differ in
 * which one fires first, so both are wired to the same AbortSignal.
 */

/**
 * One signal that aborts when the request does, when `stop()` is called, or after `maxMs`.
 * `timedOut()` says whether it was the time budget that ended it (the person is still there to read).
 */
export function answerSignal(request: AbortSignal, maxMs: number): { signal: AbortSignal; stop: () => void; timedOut: () => boolean } {
  const local = new AbortController();
  const timeout = AbortSignal.timeout(maxMs);
  return {
    signal: AbortSignal.any([request, local.signal, timeout]),
    stop: () => local.abort(),
    timedOut: () => timeout.aborted && !request.aborted && !local.signal.aborted,
  };
}

/** Passes a stream through unchanged, and calls `onCancel` if its consumer walks away before the end. */
export function onCancel<T>(source: ReadableStream<T>, cancelled: () => void): ReadableStream<T> {
  const reader = source.getReader();
  return new ReadableStream<T>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    cancel(reason) {
      cancelled();
      return reader.cancel(reason).catch(() => {});
    },
  });
}
