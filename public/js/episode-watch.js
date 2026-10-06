// While a published episode is on screen, check its status every 30 seconds.
// If a teacher withdraws it (status "returned"), or it is no longer shown for any reason,
// onChange(status) is called once and the checks stop.
// Works in the browser (global watchEpisode) and in Node (for tests/client-tests.js).
(function (root) {
  function watchEpisode({ fetchStatus, onChange, intervalMs = 30000, timers = root }) {
    let stopped = false;
    const stop = () => {
      stopped = true;
      timers.clearInterval(handle);
    };
    const handle = timers.setInterval(async () => {
      if (stopped) return;
      let status;
      try {
        status = await fetchStatus();
      } catch {
        return; // a dropped request is tried again on the next check
      }
      if (!stopped && status && status !== "approved") {
        stop();
        onChange(status);
      }
    }, intervalMs);
    return stop;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { watchEpisode };
  else root.watchEpisode = watchEpisode;
})(typeof window !== "undefined" ? window : globalThis);
