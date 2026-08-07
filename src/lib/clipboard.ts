/**
 * Reliable clipboard helper for desktop, mobile, and iframes.
 * Never throw — returns false so UI can show a selectable fallback.
 */
export async function copyText(
  text: string,
  selectEl?: HTMLTextAreaElement | HTMLInputElement | null,
): Promise<"clipboard" | "selection" | false> {
  if (typeof window === "undefined") return false;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      /* fall through */
    }
  }

  try {
    let el = selectEl ?? null;
    let created = false;
    if (!el) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText =
        "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;z-index:-1;";
      document.body.appendChild(ta);
      el = ta;
      created = true;
    } else {
      el.value = text;
    }

    el.focus();
    el.select();
    if ("setSelectionRange" in el) {
      el.setSelectionRange(0, text.length);
    }
    const ok = document.execCommand("copy");
    if (created && el.parentNode) {
      el.parentNode.removeChild(el);
    } else if ("setSelectionRange" in el) {
      el.setSelectionRange(0, 0);
      el.blur();
    }
    if (ok) return "selection";
  } catch {
    /* fall through */
  }

  return false;
}

export function isEmbeddedInIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access throws → we are embedded
    return true;
  }
}
