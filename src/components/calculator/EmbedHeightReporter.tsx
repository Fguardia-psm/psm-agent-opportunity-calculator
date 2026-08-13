import { useEffect } from "react";

/**
 * When the calculator runs inside an iframe (e.g. HubSpot), report document
 * height to the parent so the embed can grow and avoid an inner scrollbar.
 *
 * Safe no-op when not iframed, or when the parent does not listen.
 * Parent should listen for:
 *   { type: "psm-calc-height", height: number }
 * and set iframe.style.height = height + "px".
 *
 * Allowed parent origins: psmbrokerage.com (and www).
 */
const PARENT_ORIGINS = [
  "https://www.psmbrokerage.com",
  "https://psmbrokerage.com",
] as const;

const MESSAGE_TYPE = "psm-calc-height";

function measureHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  return Math.ceil(
    Math.max(
      doc.scrollHeight,
      doc.offsetHeight,
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0,
    ),
  );
}

function postHeight(height: number) {
  if (typeof window === "undefined" || window.self === window.top) return;

  const payload = { type: MESSAGE_TYPE, height };

  for (const origin of PARENT_ORIGINS) {
    try {
      window.parent.postMessage(payload, origin);
    } catch {
      // Cross-origin or missing parent — ignore
    }
  }
}

export function EmbedHeightReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.self === window.top) return;

    let last = 0;
    let raf = 0;

    const publish = () => {
      const next = measureHeight();
      // Avoid spam for sub-pixel / 1px noise
      if (Math.abs(next - last) < 2) return;
      last = next;
      postHeight(next);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(publish);
    };

    publish();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    if (ro) {
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }

    window.addEventListener("load", schedule);
    window.addEventListener("resize", schedule);

    // Results expand after calculate / charts load
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(schedule)
        : null;
    if (mo && document.body) {
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    const interval = window.setInterval(schedule, 1000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.removeEventListener("load", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);

  return null;
}
