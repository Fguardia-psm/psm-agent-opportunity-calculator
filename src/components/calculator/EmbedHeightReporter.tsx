import { useEffect } from "react";

/**
 * When the calculator runs inside an iframe (e.g. HubSpot), report document
 * height to the parent so the embed can grow and avoid an inner scrollbar.
 *
 * Parent should listen for:
 *   { type: "psm-calc-height", height: number }
 * and set iframe.style.height = height + "px".
 */
const PARENT_ORIGINS = [
  "https://www.psmbrokerage.com",
  "https://psmbrokerage.com",
] as const;

const MESSAGE_TYPE = "psm-calc-height";

function isInIframe(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

function measureHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  const root = document.getElementById("root") ?? body?.firstElementChild;

  const candidates = [
    doc?.scrollHeight ?? 0,
    doc?.offsetHeight ?? 0,
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    root instanceof HTMLElement ? root.scrollHeight : 0,
    root instanceof HTMLElement ? root.offsetHeight : 0,
  ];

  // Small buffer so parent doesn't clip shadows / last pixels
  return Math.ceil(Math.max(...candidates, 0) + 8);
}

function postHeight(height: number) {
  if (!isInIframe()) return;

  const payload = { type: MESSAGE_TYPE, height };

  for (const origin of PARENT_ORIGINS) {
    try {
      window.parent.postMessage(payload, origin);
    } catch {
      // ignore
    }
  }
}

/** Call after major layout changes (e.g. results open) from other components. */
export function notifyEmbedHeight() {
  if (typeof window === "undefined" || !isInIframe()) return;
  window.dispatchEvent(new Event("psm-calc-content-change"));
}

export function EmbedHeightReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || !isInIframe()) return;

    // Prefer document flow height; avoid iframe viewport min-heights fighting resize
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlMinHeight = html.style.minHeight;
    const prevBodyMinHeight = body.style.minHeight;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.minHeight = "0";
    body.style.minHeight = "0";
    html.classList.add("psm-embed");
    body.classList.add("psm-embed");

    let last = 0;
    let raf = 0;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const publish = (force = false) => {
      const next = measureHeight();
      if (!force && Math.abs(next - last) < 2) return;
      last = next;
      postHeight(next);
    };

    const schedule = (force = false) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => publish(force));
    };

    const scheduleDebounced = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => schedule(true), 50);
    };

    publish(true);
    // Charts / fonts settle shortly after first paint and after Calculate
    const t1 = window.setTimeout(() => schedule(true), 150);
    const t2 = window.setTimeout(() => schedule(true), 500);
    const t3 = window.setTimeout(() => schedule(true), 1200);

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleDebounced()) : null;
    if (ro) {
      ro.observe(html);
      ro.observe(body);
      const root = document.getElementById("root");
      if (root) ro.observe(root);
    }

    window.addEventListener("load", () => schedule(true));
    window.addEventListener("resize", () => schedule(true));
    window.addEventListener("psm-calc-content-change", () => schedule(true));

    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => scheduleDebounced())
        : null;
    if (mo && body) {
      mo.observe(body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    const interval = window.setInterval(() => schedule(true), 2000);

    return () => {
      cancelAnimationFrame(raf);
      if (debounce) clearTimeout(debounce);
      window.clearInterval(interval);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("load", () => schedule(true));
      window.removeEventListener("resize", () => schedule(true));
      window.removeEventListener("psm-calc-content-change", () => schedule(true));
      ro?.disconnect();
      mo?.disconnect();
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.minHeight = prevHtmlMinHeight;
      body.style.minHeight = prevBodyMinHeight;
      html.classList.remove("psm-embed");
      body.classList.remove("psm-embed");
    };
  }, []);

  return null;
}
