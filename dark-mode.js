(() => {
  const root = document.documentElement;
  const themeClasses = ["pans-theme-blue", "pans-theme-gray", "pans-theme-black"];
  const validThemes = new Set(["blue", "gray", "black"]);
  const surfaceRoots = "#page, #message-drawer, .popover-region-container, .modal";
  const surfaceCandidates = "div, section, article, aside, li, td, th, header, footer, form";
  const ignored = "img, svg, canvas, video, iframe, [class*='qrcode'], [class*='qr-code']";
  const rgbPattern = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/;
  const pending = new Set();
  let inspected = new WeakSet();
  let frameId = 0;
  let started = false;

  const isEnabled = () => root.classList.contains("pans-dark-mode");

  const isBrightSurface = (element) => {
    if (!(element instanceof HTMLElement) || inspected.has(element)) return false;
    inspected.add(element);
    if (element.matches(ignored) || element.closest(ignored)) return false;
    if (element.offsetWidth * element.offsetHeight <= 900) return false;

    const match = getComputedStyle(element).backgroundColor.match(rgbPattern);
    if (!match || (match[4] !== undefined && Number(match[4]) < 0.98)) return false;

    const luminance = Number(match[1]) * 0.299 + Number(match[2]) * 0.587 + Number(match[3]) * 0.114;
    return luminance > 210;
  };

  const darken = (element) => {
    if (isEnabled() && isBrightSurface(element)) element.classList.add("pans-auto-dark-surface");
  };

  const flush = () => {
    frameId = 0;
    if (!isEnabled()) return pending.clear();
    pending.forEach((node) => {
      darken(node);
      node.querySelectorAll(surfaceCandidates).forEach(darken);
    });
    pending.clear();
  };

  const enqueue = (node) => {
    if (!isEnabled() || !(node instanceof Element)) return;
    pending.add(node);
    if (!frameId) frameId = requestAnimationFrame(flush);
  };

  const scanRoots = () => document.querySelectorAll(surfaceRoots).forEach(enqueue);

  const start = () => {
    started = true;
    scanRoots();
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(enqueue));
    }).observe(document.body, { childList: true, subtree: true });
  };

  const applyTheme = (theme = "blue") => {
    const enabled = theme !== "off";
    root.classList.toggle("pans-dark-mode", enabled);
    root.classList.remove(...themeClasses);

    if (!enabled) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      pending.clear();
      document.querySelectorAll(".pans-auto-dark-surface").forEach((element) => {
        element.classList.remove("pans-auto-dark-surface");
      });
      return;
    }

    root.classList.add(`pans-theme-${validThemes.has(theme) ? theme : "blue"}`);
    inspected = new WeakSet();
    if (started) scanRoots();
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", start, { once: true })
    : start();

  chrome.storage.sync.get({ theme: "blue" }, ({ theme }) => applyTheme(theme));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.theme) applyTheme(changes.theme.newValue);
  });
})();
