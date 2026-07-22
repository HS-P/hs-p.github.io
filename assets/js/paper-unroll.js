(function () {
  const loader = document.currentScript;
  const workerUrl = loader?.dataset.paperWorker;
  const pageEntryRoot = document.documentElement;
  const paperSequencePage = document.querySelector(".paper-sequence-page");
  const paperRevealSurface = paperSequencePage?.querySelector("[data-paper-reveal-surface]");
  const paperCanvas = paperRevealSurface?.querySelector("[data-paper-unroll-canvas]");
  const paperFallback = paperRevealSurface?.querySelector("[data-paper-unroll-fallback]");
  const mobilePageQuery = window.matchMedia("(max-width: 760px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const paperDuration = 1450;
  const baseCopyInterval = mobilePageQuery.matches ? 32 : 36;
  const maxCopyDelay = mobilePageQuery.matches ? 800 : 900;
  const copyDuration = mobilePageQuery.matches ? 250 : 280;
  let resolveReady;
  let readyResolved = false;
  let rendererMode = "idle";
  let rendererWorker;
  let rendererInitTimer;
  let paperSettleTimer;
  let paperCleanupTimer;
  let paperSequenceFinished = false;
  let paperSurfaceSettled = false;
  let paperSequencePlaying = false;
  let surfaceResizeObserver;

  const paperReady = new Promise((resolve) => {
    resolveReady = resolve;
  });
  window.__paperUnrollReady = paperReady;
  window.__paperUnroll = { dispose: finishPaperSequence };

  function releaseReady() {
    if (readyResolved) return;
    readyResolved = true;
    resolveReady();
  }

  function releaseRenderer() {
    window.clearTimeout(rendererInitTimer);
    if (surfaceResizeObserver) {
      surfaceResizeObserver.disconnect();
      surfaceResizeObserver = null;
    }
    if (!rendererWorker) return;
    try {
      rendererWorker.postMessage({ type: "dispose" });
    } catch (_error) {
      // The worker may already be gone after a context failure.
    }
    rendererWorker.terminate();
    rendererWorker = null;
  }

  function clearCopyStrike(element, releaseHandler) {
    if (releaseHandler) element.removeEventListener("animationend", releaseHandler);
    element.classList.remove("paper-copy-strike");
    element.style.removeProperty("--paper-copy-delay");
  }

  if (!paperSequencePage || !paperRevealSurface || !paperCanvas || !paperFallback) {
    pageEntryRoot.classList.remove("paper-sequence-entry");
    releaseReady();
    return;
  }

  const shouldAnimate = pageEntryRoot.classList.contains("paper-sequence-entry")
    && !reduceMotion
    && window.matchMedia("screen").matches
    && !window.location.hash;
  if (!shouldAnimate) {
    pageEntryRoot.classList.remove("paper-sequence-entry");
    releaseReady();
    return;
  }

  const isCvPaperSequence = paperSequencePage.classList.contains("cv-editorial-page");
  const isExperiencePaperSequence = paperSequencePage.classList.contains("experience-editorial-page");
  let paperCopySelector;
  if (isCvPaperSequence) {
    paperCopySelector = ".page-title > *, .cv-contact, .cv-summary, .cv-block > h2, .cv-entry, .cv-interest-list > li, .cv-skills-list > div";
  } else if (isExperiencePaperSequence) {
    paperCopySelector = ".page-title > *, .cv-block > h2, .award-card, .timeline-item";
  } else {
    paperCopySelector = ".page-title > *, .research-page-block > h2, .work-map-item, .keyword-row > span, .paper-item";
  }

  const visibleCopy = Array.from(paperSequencePage.querySelectorAll(paperCopySelector));
  const copyInterval = visibleCopy.length > 1
    ? Math.min(baseCopyInterval, Math.floor(maxCopyDelay / (visibleCopy.length - 1)))
    : 0;
  const paperCopyReleaseHandlers = new Map();

  visibleCopy.forEach((element, index) => {
    element.classList.add("paper-copy-strike");
    element.style.setProperty("--paper-copy-delay", `${index * copyInterval}ms`);
    const releasePaperCopy = (event) => {
      if (event.target !== element || event.animationName !== "paper-copy-strike") return;
      paperCopyReleaseHandlers.delete(element);
      clearCopyStrike(element, releasePaperCopy);
    };
    paperCopyReleaseHandlers.set(element, releasePaperCopy);
    element.addEventListener("animationend", releasePaperCopy);
  });

  function finishPaperSequence() {
    if (paperSequenceFinished) return;
    paperSequenceFinished = true;
    rendererMode = "disposed";
    window.clearTimeout(paperSettleTimer);
    window.clearTimeout(paperCleanupTimer);
    releaseRenderer();
    pageEntryRoot.classList.remove("paper-sequence-entry");
    paperSequencePage.classList.remove("is-paper-motion-armed", "is-paper-surface-settled");
    paperRevealSurface.classList.remove(
      "is-paper-unroll-webgl",
      "is-paper-unroll-fallback",
      "is-paper-unroll-warming",
      "is-paper-unroll-playing"
    );
    delete paperRevealSurface.dataset.paperUnrollMode;
    delete paperRevealSurface.dataset.paperUnrollPixels;
    visibleCopy.forEach((element) => {
      clearCopyStrike(element, paperCopyReleaseHandlers.get(element));
      paperCopyReleaseHandlers.delete(element);
    });
    paperFallback.removeEventListener("animationend", settlePaperSurfaceFromFallback);
    paperFallback.removeEventListener("animationcancel", settlePaperSurfaceFromFallback);
    document.removeEventListener("focusin", finishPaperSequenceFromFocus, true);
    document.removeEventListener("visibilitychange", finishPaperSequenceWhenHidden);
    window.removeEventListener("beforeprint", finishPaperSequence);
    window.removeEventListener("pagehide", finishPaperSequence);
    window.removeEventListener("hashchange", finishPaperSequence);
    window.removeEventListener("pageshow", finishPaperSequenceFromCache);
    releaseReady();
  }

  function settlePaperSurface() {
    if (paperSequenceFinished || paperSurfaceSettled) return;
    paperSurfaceSettled = true;
    window.clearTimeout(paperSettleTimer);
    releaseRenderer();
    paperSequencePage.classList.add("is-paper-surface-settled");
    const copySequenceDuration = (Math.max(visibleCopy.length - 1, 0) * copyInterval)
      + copyDuration
      + 120;
    paperCleanupTimer = window.setTimeout(finishPaperSequence, copySequenceDuration);
  }

  function settlePaperSurfaceFromFallback(event) {
    if (event.target !== paperFallback || event.animationName !== "paper-sheet-unroll-fallback") return;
    settlePaperSurface();
  }

  function finishPaperSequenceFromCache(event) {
    if (event.persisted) finishPaperSequence();
  }

  function finishPaperSequenceFromFocus(event) {
    if (paperSequencePage.contains(event.target)) finishPaperSequence();
  }

  function finishPaperSequenceWhenHidden() {
    if (document.hidden) finishPaperSequence();
  }

  function useFallback() {
    if (paperSequenceFinished || rendererMode === "fallback") return;
    releaseRenderer();
    rendererMode = "fallback";
    paperRevealSurface.classList.remove("is-paper-unroll-webgl");
    paperRevealSurface.classList.remove("is-paper-unroll-warming");
    paperRevealSurface.classList.add("is-paper-unroll-fallback");
    paperRevealSurface.dataset.paperUnrollMode = "fallback";
    releaseReady();
  }

  function observeSurfaceSize(width, height) {
    if (!("ResizeObserver" in window)) return;
    surfaceResizeObserver = new ResizeObserver((entries) => {
      if (!paperSequencePlaying || paperSurfaceSettled || paperSequenceFinished) return;
      const next = entries[0]?.contentRect;
      if (!next) return;
      if (Math.abs(next.width - width) > 4 || Math.abs(next.height - height) > 4) {
        settlePaperSurface();
      }
    });
    surfaceResizeObserver.observe(paperRevealSurface);
  }

  function initializeRenderer() {
    if (paperSequenceFinished) return;
    const connection = navigator.connection;
    const lowResourceDevice = Boolean(connection?.saveData)
      || (navigator.deviceMemory && navigator.deviceMemory <= 2)
      || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    const supportsWorkerCanvas = Boolean(workerUrl)
      && "Worker" in window
      && "OffscreenCanvas" in window
      && "transferControlToOffscreen" in HTMLCanvasElement.prototype;
    if (lowResourceDevice || !supportsWorkerCanvas) {
      useFallback();
      return;
    }

    const targetRect = paperRevealSurface.getBoundingClientRect();
    if (targetRect.width < 2 || targetRect.height < 2) {
      useFallback();
      return;
    }
    const overscanX = Math.ceil(targetRect.width * 0.10);
    const overscanY = Math.ceil(targetRect.height * 0.12);
    const canvasWidth = targetRect.width + overscanX * 2;
    const canvasHeight = targetRect.height + overscanY * 2;
    paperCanvas.style.left = `${-overscanX}px`;
    paperCanvas.style.top = `${-overscanY}px`;
    paperCanvas.style.width = `${canvasWidth}px`;
    paperCanvas.style.height = `${canvasHeight}px`;

    const constrainedCanvas = mobilePageQuery.matches || window.matchMedia("(pointer: coarse)").matches;
    const pixelBudget = constrainedCanvas ? 600000 : 1500000;
    const dprLimit = constrainedCanvas ? 1.25 : 1.5;
    const budgetDpr = Math.sqrt(pixelBudget / (canvasWidth * canvasHeight));
    const dpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, dprLimit, budgetDpr));
    const backingWidth = Math.max(1, Math.floor(canvasWidth * dpr));
    const backingHeight = Math.max(1, Math.floor(canvasHeight * dpr));

    rendererMode = "warming";
    try {
      rendererWorker = new Worker(workerUrl);
      const offscreen = paperCanvas.transferControlToOffscreen();
      rendererWorker.addEventListener("message", (event) => {
        const message = event.data || {};
        if (message.type === "ready" && rendererMode === "warming" && !paperSequenceFinished) {
          window.clearTimeout(rendererInitTimer);
          rendererMode = "webgl";
          paperRevealSurface.classList.remove("is-paper-unroll-fallback");
          paperRevealSurface.classList.remove("is-paper-unroll-warming");
          paperRevealSurface.classList.add("is-paper-unroll-webgl");
          paperRevealSurface.dataset.paperUnrollMode = "webgl";
          paperRevealSurface.dataset.paperUnrollPixels = `${message.backingWidth}x${message.backingHeight}`;
          observeSurfaceSize(targetRect.width, targetRect.height);
          releaseReady();
          return;
        }
        if (message.type === "complete") {
          settlePaperSurface();
          return;
        }
        if (message.type === "error") {
          if (paperSequencePlaying) settlePaperSurface();
          else useFallback();
        }
      });
      rendererWorker.addEventListener("error", (event) => {
        event.preventDefault();
        if (paperSequencePlaying) settlePaperSurface();
        else useFallback();
      });
      rendererWorker.addEventListener("messageerror", () => {
        if (paperSequencePlaying) settlePaperSurface();
        else useFallback();
      });
      rendererWorker.postMessage({
        type: "init",
        canvas: offscreen,
        backingWidth,
        backingHeight,
        canvasWidth,
        canvasHeight,
        targetWidth: targetRect.width,
        targetHeight: targetRect.height,
        targetOffsetX: overscanX,
        targetOffsetY: overscanY,
        viewportAspect: window.innerWidth / window.innerHeight
      }, [offscreen]);
      rendererInitTimer = window.setTimeout(() => {
        if (rendererMode === "warming") useFallback();
      }, 650);
    } catch (_error) {
      useFallback();
    }
  }

  function playPaperSequence() {
    if (paperSequenceFinished || paperSequencePlaying) return;
    paperSequencePlaying = true;
    paperRevealSurface.classList.add("is-paper-unroll-playing");
    paperSettleTimer = window.setTimeout(settlePaperSurface, paperDuration + 180);
    if (rendererMode === "webgl" && rendererWorker) {
      rendererWorker.postMessage({ type: "play" });
    }
  }

  const pageMotionStarted = pageEntryRoot.classList.contains("page-motion-pending")
    && !window.__pageMotionStarted
    ? new Promise((resolve) => document.addEventListener("page-motion-start", resolve, { once: true }))
    : Promise.resolve();

  paperFallback.addEventListener("animationend", settlePaperSurfaceFromFallback);
  paperFallback.addEventListener("animationcancel", settlePaperSurfaceFromFallback);
  document.addEventListener("focusin", finishPaperSequenceFromFocus, true);
  document.addEventListener("visibilitychange", finishPaperSequenceWhenHidden);
  window.addEventListener("beforeprint", finishPaperSequence);
  window.addEventListener("pagehide", finishPaperSequence);
  window.addEventListener("hashchange", finishPaperSequence);
  window.addEventListener("pageshow", finishPaperSequenceFromCache);
  paperRevealSurface.classList.add("is-paper-unroll-warming");
  paperSequencePage.classList.add("is-paper-motion-armed");

  Promise.all([paperReady, pageMotionStarted]).then(playPaperSequence);
  window.requestAnimationFrame(() => window.setTimeout(initializeRenderer, 0));
})();
