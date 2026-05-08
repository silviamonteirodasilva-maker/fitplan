// Smooth-scroll an element into view and briefly highlight it.
export function scrollToNext(el: HTMLElement | null | undefined, opts?: { highlight?: boolean }) {
  if (!el) return;
  // Defer so DOM updates (e.g. selected state) commit first
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (opts?.highlight === false) return;
    const cls = ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-background", "rounded-2xl", "transition-shadow"];
    el.classList.add(...cls);
    window.setTimeout(() => el.classList.remove(...cls), 1100);
  });
}
