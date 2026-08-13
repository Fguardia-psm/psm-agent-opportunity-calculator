import { useEffect } from "react";

/**
 * When the calculator runs inside an iframe (e.g. HubSpot), report full content
 * height to the parent so the embed can grow and avoid an inner scrollbar.
 *
 * Parent should listen for:
 *   { type: "psm-calc-height", height: number }
 * and set iframe.style.height = height + "px".
 *
 * Important: do NOT set overflow:hidden on html/body before measuring — that
 * makes scrollHeight report the clipped viewport and cuts off the footer.
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
  const body = document.body;
  const doc = document.documentElement;

  // Prefer the main app wrapper (avoids html/body viewport quirks in iframes)
  const appRoot =
    (body?.firstElementChild as HTMLElement | null) ??
    document.getElementById("root");

  let contentBottom = 0;
  if (appRoot) {
    const rect = appRoot.getBoundingClientRect();
    contentBottom = rect.height + (window.scrollY || doc.scrollTop || 0);
  }

  // Walk last visible section bottoms as a safety net (footer / FAQ)
  if (body) {
    const kids = body.querySelectorAll("footer, main, section, [data-embed-end]");
    kids.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const r = el.getBoundingClientRect();
      const bottom = r.bottom + (window.scrollY || doc.scrollTop || 0);
      if (bottom > contentBottom) contentBottom = bottom;
    });
  }

  const candidates = [
    contentBottom,
    appRoot?.scrollHeight ?? 0,
    appRoot?.offsetHeight ?? 0,
    body?.scrollHeight ?? 0,
    doc.scrollHeight,
  ];

  // Extra buffer for fonts, shadows, HubSpot chrome rounding
  return Math.ceil(Math.max(...candidates, 400) + 48);
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

    const html = document.documentElement;
    const body = document.body;

    // Allow natural document height; parent iframe clips overflow via its own height
    const prevHtmlMinHeight = html.style.minHeight;
    const prevBodyMinHeight = body.style.minHeight;
    html.style.minHeight = "0";
    body.style.minHeight = "0";
    html.classList.add("psm-embed");
    body.classList.add("psm-embed");

    let last = 0;
    let raf = 0;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const publish = (force = false) => {
      const next = measureHeight();
      if (!force && Math.abs(next - last) < 4) return;
      last = next;
      postHeight(next);
    };

    const schedule = (force = false) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => publish(force));
    };

    const scheduleDebounced = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => schedule(true), 80);
    };

    publish(true);
    const timers = [100, 300, 600, 1200, 2500].map((ms) =>
      window.setTimeout(() => schedule(true), ms),
    );

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scheduleDebounced()) : null;
    if (ro) {
      if (body.firstElementChild instanceof HTMLElement) ro.observe(body.firstElementChild);
      ro.observe(body);
    }

    const onContentChange = () => schedule(true);
    window.addEventListener("load", onContentChange);
    window.addEventListener("resize", onContentChange);
    window.addEventListener("psm-calc-content-change", onContentChange);

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

    const interval = window.setInterval(() => schedule(true), 2500);

    return () => {
      cancelAnimationFrame(raf);
      if (debounce) clearTimeout(debounce);
      window.clearInterval(interval);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("load", onContentChange);
      window.removeEventListener("resize", onContentChange);
      window.removeEventListener("psm-calc-content-change", onContentChange);
      ro?.disconnect();
      mo?.disconnect();
      html.style.minHeight = prevHtmlMinHeight;
      body.style.minHeight = prevBodyMinHeight;
      html.classList.remove("psm-embed");
      body.classList.remove("psm-embed");
    };
  }, []);

  return null;
}
