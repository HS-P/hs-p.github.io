(function () {
  const compactExperienceQuery = window.matchMedia("(max-width: 980px)");
  const mobilePageQuery = window.matchMedia("(max-width: 760px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompactExperience = compactExperienceQuery.matches;
  const pageEntryRoot = document.documentElement;
  const pageEntryStarted = pageEntryRoot.classList.contains("page-entry-pending") && !window.__pageEntryStarted
    ? new Promise((resolve) => document.addEventListener("page-entry-start", resolve, { once: true }))
    : Promise.resolve();
  document.body.classList.toggle("is-compact-experience", isCompactExperience);

  function afterPageEntry(callback, delay = 0) {
    pageEntryStarted.then(() => window.setTimeout(callback, delay));
  }

  function loadIconStyles() {
    if (document.querySelector("link[data-icon-styles]")) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css";
    stylesheet.fetchPriority = "low";
    stylesheet.dataset.iconStyles = "";
    document.head.appendChild(stylesheet);
  }

  afterPageEntry(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadIconStyles, { timeout: 1200 });
    } else {
      window.setTimeout(loadIconStyles, 400);
    }
  }, 120);

  function imageReady(image) {
    if (typeof image.decode === "function") return image.decode().catch(() => {});
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }

  function fitSingleLine(element, minSize) {
    element.style.fontSize = "";
    if (!element.clientWidth || element.scrollWidth <= element.clientWidth + 1) return;

    let low = minSize;
    let high = parseFloat(window.getComputedStyle(element).fontSize);
    element.style.fontSize = `${low}px`;
    if (element.scrollWidth > element.clientWidth + 1) return;

    for (let index = 0; index < 8 && high - low > 0.25; index += 1) {
      const midpoint = (low + high) / 2;
      element.style.fontSize = `${midpoint}px`;
      if (element.scrollWidth > element.clientWidth + 1) high = midpoint;
      else low = midpoint;
    }
    element.style.fontSize = `${Math.floor(low * 10) / 10}px`;
  }

  function navigateWithPageExit(destination) {
    const shell = document.querySelector(".page-shell");
    let committed = false;
    let fallbackTimer;
    function handleTransitionEnd(event) {
      if (event.target === shell && (event.propertyName === "opacity" || event.propertyName === "transform")) {
        commitNavigation();
      }
    }
    function commitNavigation() {
      if (committed) return;
      committed = true;
      window.clearTimeout(fallbackTimer);
      if (shell) shell.removeEventListener("transitionend", handleTransitionEnd);
      window.location.href = destination;
    }
    if (shell) {
      shell.addEventListener("transitionend", handleTransitionEnd);
    }
    document.body.classList.add("page-exit");
    fallbackTimer = window.setTimeout(commitNavigation, 460);
  }

  window.addEventListener("pageshow", () => {
    document.body.classList.remove("page-exit", "bubble-pop");
  });

  const prefetchedRoutes = new Set();

  function prefetchInternalRoute(link) {
    if (!link || link.target || link.hasAttribute("download")) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    destination.hash = "";
    if (prefetchedRoutes.has(destination.href)) return;
    prefetchedRoutes.add(destination.href);

    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.as = "document";
    prefetch.href = destination.href;
    prefetch.fetchPriority = "low";
    document.head.appendChild(prefetch);
  }

  function prefetchFromIntent(event) {
    prefetchInternalRoute(event.target.closest?.("a[href]"));
  }

  document.addEventListener("pointerover", prefetchFromIntent, { passive: true });
  document.addEventListener("pointerdown", prefetchFromIntent, { passive: true });
  document.addEventListener("focusin", prefetchFromIntent);

  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("is-open"));
  }

  const bubbleNav = document.querySelector("[data-bubble-nav]");

  function burst(element) {
    element.classList.remove("is-bursting");
    void element.offsetWidth;
    element.classList.add("is-bursting");
    window.setTimeout(() => element.classList.remove("is-bursting"), 620);
  }

  function samePath(url) {
    const clean = (path) => path.replace(/\/+$/, "") || "/";
    return clean(url.pathname) === clean(window.location.pathname);
  }

  function revealTarget(target) {
    target.classList.remove("section--revealed");
    void target.offsetWidth;
    target.classList.add("section--revealed");
    window.setTimeout(() => target.classList.remove("section--revealed"), 1100);
  }

  if (bubbleNav) {
    const bubbleToggle = bubbleNav.querySelector("[data-bubble-toggle]");
    const bubbleLinks = bubbleNav.querySelector(".bubble-links");
    const bubbleInertRegions = [
      document.querySelector(".site-header"),
      document.querySelector("main"),
      document.querySelector(".site-footer")
    ].filter(Boolean);

    function setBubbleNav(open) {
      bubbleNav.classList.toggle("is-open", open);
      if (bubbleLinks) bubbleLinks.inert = !open;
      if (isCompactExperience) {
        document.documentElement.classList.toggle("is-mobile-nav-open", open);
        document.body.classList.toggle("is-mobile-nav-open", open);
        bubbleInertRegions.forEach((region) => {
          region.inert = open;
        });
      }
      if (bubbleToggle) {
        bubbleToggle.setAttribute("aria-expanded", String(open));
        bubbleToggle.setAttribute("aria-label", open ? "Close floating navigation" : "Open floating navigation");
      }
      if (open && isCompactExperience && bubbleLinks) {
        window.requestAnimationFrame(() => {
          bubbleLinks.querySelector("a")?.focus({ preventScroll: true });
        });
      }
    }

    setBubbleNav(false);

    if (bubbleToggle) {
      bubbleToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        setBubbleNav(!bubbleNav.classList.contains("is-open"));
      });
    }

    document.addEventListener("click", (event) => {
      if (!bubbleNav.contains(event.target)) {
        setBubbleNav(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const wasOpen = bubbleNav.classList.contains("is-open");
        setBubbleNav(false);
        if (wasOpen && bubbleToggle) bubbleToggle.focus();
      }
    });

    bubbleNav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !isCompactExperience || !bubbleNav.classList.contains("is-open")) return;
      const focusable = [bubbleToggle, ...bubbleNav.querySelectorAll(".bubble-link")].filter(Boolean);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    bubbleNav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      if (!isCompactExperience) burst(link);

      const url = new URL(link.getAttribute("href"), window.location.href);
      if (!url.hash || !samePath(url)) {
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !link.target) {
          event.preventDefault();
          if (isCompactExperience || reduceMotion) {
            window.location.href = url.href;
          } else {
            navigateWithPageExit(url.href);
          }
        }
        return;
      }

      const target = document.querySelector(url.hash);
      if (!target) return;

      event.preventDefault();
      document.body.classList.add("bubble-pop");
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", url.hash);
        revealTarget(target);
      }, 230);
      window.setTimeout(() => setBubbleNav(false), 360);
      window.setTimeout(() => document.body.classList.remove("bubble-pop"), 520);
    });
  }

  const githubActivity = document.querySelector("[data-github-activity]");
  if (githubActivity) {
    const user = githubActivity.dataset.githubUser || "HS-P";
    const rangeYear = Number(githubActivity.dataset.githubRange) || new Date().getFullYear();
    const fallbackTotal = githubActivity.dataset.githubTotal || "";
    const status = githubActivity.querySelector("[data-github-activity-status]");
    const chart = githubActivity.querySelector("[data-github-activity-chart]");

    function dateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function addDays(date, count) {
      const next = new Date(date);
      next.setDate(next.getDate() + count);
      return next;
    }

    function getGithubActivityRange() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(rangeYear, 0, 1);
      const end = today.getFullYear() === rangeYear ? today : new Date(rangeYear, 11, 31);
      return {
        start,
        end,
        gridStart: addDays(start, -start.getDay()),
        gridEnd: addDays(end, 6 - end.getDay()),
      };
    }

    function renderGithubSkeleton() {
      if (!chart || chart.children.length) return;
      const { start, end, gridStart, gridEnd } = getGithubActivityRange();
      const fragment = document.createDocumentFragment();
      for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 1)) {
        const key = dateKey(cursor);
        const inRange = cursor >= start && cursor <= end;
        const cell = document.createElement("span");
        cell.className = "github-day github-day--level-0 github-day--loading";
        if (!inRange) cell.classList.add("github-day--outside");
        cell.title = `${key}: loading public contributions`;
        cell.setAttribute("aria-label", cell.title);
        fragment.appendChild(cell);
      }
      chart.replaceChildren(fragment);
    }

    function renderGithubActivity(payload) {
      if (!chart) return;

      const { start, end, gridStart, gridEnd } = getGithubActivityRange();
      const byDate = new Map(
        (payload.contributions || []).map((day) => [day.date, day])
      );

      let total = 0;
      const fragment = document.createDocumentFragment();
      for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 1)) {
        const key = dateKey(cursor);
        const item = byDate.get(key) || { count: 0, level: 0 };
        const inRange = cursor >= start && cursor <= end;
        if (inRange) total += Number(item.count || 0);

        const cell = document.createElement("span");
        cell.className = `github-day github-day--level-${item.level || 0}`;
        if (!inRange) cell.classList.add("github-day--outside");
        cell.title = `${key}: ${inRange ? item.count || 0 : 0} public contributions`;
        cell.setAttribute("aria-label", cell.title);
        fragment.appendChild(cell);
      }

      chart.replaceChildren(fragment);
      githubActivity.classList.add("is-loaded");
      if (status) {
        status.textContent = `${total} public contributions in ${rangeYear}`;
      }
    }

    function loadGithubActivity() {
      renderGithubSkeleton();
      fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}`)
        .then((response) => {
          if (!response.ok) throw new Error("GitHub activity unavailable");
          return response.json();
        })
        .then(renderGithubActivity)
        .catch(() => {
          githubActivity.classList.add("is-unavailable");
          if (status) {
            status.textContent = fallbackTotal
              ? `${fallbackTotal} public contributions in ${rangeYear}`
              : "Public GitHub activity unavailable";
          }
        });
    }

    afterPageEntry(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadGithubActivity, { timeout: 1000 });
      } else {
        window.setTimeout(loadGithubActivity, 250);
      }
    }, 200);
  }

  const deferredVideos = Array.from(document.querySelectorAll("iframe[data-video-src]"));
  if (deferredVideos.length) {
    function hydrateVideo(frame) {
      if (!frame.dataset.videoSrc) return;
      frame.src = frame.dataset.videoSrc;
      delete frame.dataset.videoSrc;
      frame.removeAttribute("aria-hidden");
      frame.removeAttribute("tabindex");
    }

    afterPageEntry(() => {
      if (!("IntersectionObserver" in window)) {
        deferredVideos.forEach(hydrateVideo);
        return;
      }
      const videoObserver = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
          window.setTimeout(() => hydrateVideo(entry.target), index * 100);
          videoObserver.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin: "180px 0px" });
      deferredVideos.forEach((frame) => videoObserver.observe(frame));
    }, 100);
  }

  const homeHero = document.querySelector(".home-page .hero");
  const homeActivities = document.querySelector("[data-home-activities]");
  const scrollCue = document.querySelector(".scroll-cue");
  if (homeActivities) {
    let isSnapping = false;
    let snapTarget = "";
    let snapTimer;
    let scrollCueFrame;
    function atActivities() {
      return window.scrollY > window.innerHeight * 0.45;
    }
    function snapTo(targetName) {
      const target = targetName === "top" ? homeHero : homeActivities;
      if (!target) return;
      window.clearTimeout(snapTimer);
      isSnapping = true;
      snapTarget = targetName;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      snapTimer = window.setTimeout(() => {
        isSnapping = false;
        snapTarget = "";
      }, 980);
    }
    function syncScrollCue() {
      scrollCueFrame = 0;
      if (!scrollCue) return;
      const up = atActivities();
      scrollCue.classList.toggle("is-up", up);
      scrollCue.setAttribute("href", up ? "#about" : "#activities");
      scrollCue.setAttribute("aria-label", up ? "Scroll to top" : "Scroll to activities");
    }
    function scheduleScrollCueSync() {
      if (scrollCueFrame) return;
      scrollCueFrame = window.requestAnimationFrame(syncScrollCue);
    }

    afterPageEntry(scheduleScrollCueSync, 120);
    window.addEventListener("scroll", scheduleScrollCueSync, { passive: true });
    if (scrollCue) {
      scrollCue.addEventListener("click", (event) => {
        event.preventDefault();
        snapTo(atActivities() ? "top" : "activities");
      });
    }

    if (!isCompactExperience) {
      window.addEventListener("wheel", (event) => {
        if (isSnapping) {
          const reverseToTop = event.deltaY < -8 && snapTarget === "activities";
          const reverseToActivities = event.deltaY > 8 && snapTarget === "top";
          event.preventDefault();
          if (reverseToTop) snapTo("top");
          if (reverseToActivities) snapTo("activities");
          return;
        }
        if (event.deltaY > 8 && window.scrollY <= 90) {
          event.preventDefault();
          snapTo("activities");
          return;
        }
        if (event.deltaY < -8 && atActivities() && homeHero) {
          event.preventDefault();
          snapTo("top");
        }
      }, { passive: false });
    }
  }

  const projectTopicAliases = {
    "act-vla": ["act", "vla"],
    "computer-vision": ["computer-vision"],
    rl: ["reinforcement-learning"],
  };

  function normalizeProjectTopic(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function projectTopicTargets(value) {
    const topic = normalizeProjectTopic(value);
    return projectTopicAliases[topic] || (topic ? [topic] : []);
  }

  function parseProjectTopics(value) {
    return String(value || "")
      .split(",")
      .map(normalizeProjectTopic)
      .filter(Boolean);
  }

  function formatProjectTopicLabel(value) {
    const topic = normalizeProjectTopic(value);
    if (topic === "act-vla") return "ACT / VLA";
    return topic
      .split("-")
      .filter(Boolean)
      .map((word) => {
        const upper = word.toUpperCase();
        return upper.length <= 3 ? upper : upper.charAt(0) + upper.slice(1).toLowerCase();
      })
      .join(" ");
  }

  function projectElementFromHash() {
    if (!window.location.hash) return null;
    try {
      const element = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      return element && element.matches("[data-project-card]") ? element : null;
    } catch (_error) {
      return null;
    }
  }

  const projectBoard = document.querySelector("[data-project-board]");
  const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
  const yearButtons = Array.from(document.querySelectorAll("[data-project-year]"));
  const topicButtons = Array.from(document.querySelectorAll("[data-project-topic]"));
  const projectResults = document.querySelector("[data-project-results]");
  const projectIntro = document.querySelector("[data-project-intro]");
  const projectYearView = document.querySelector("[data-project-year-view]");
  const projectYearTitle = document.querySelector("[data-project-year-title]");
  const projectBack = document.querySelector("[data-project-back]");
  const projectToggle = document.querySelector("[data-project-toggle]");
  const projectQuery = projectBoard ? new URLSearchParams(window.location.search) : null;
  const queryTopic = projectQuery ? normalizeProjectTopic(projectQuery.get("topic")) : "";
  const queryYear = projectQuery ? projectQuery.get("year") || "" : "";
  const hashCard = projectBoard ? projectElementFromHash() : null;
  const hasQueryTopic = queryTopic && projectCards.some((card) => {
    const cardTopics = parseProjectTopics(card.dataset.topics);
    return projectTopicTargets(queryTopic).some((target) => cardTopics.includes(target));
  });
  const hasQueryYear = queryYear && yearButtons.some((button) => button.dataset.projectYear === queryYear);

  let projectTopicMediaPromise;
  let projectTopicMediaScheduled = false;
  function prepareProjectTopicMedia() {
    if (!projectBoard || !topicButtons.length) return Promise.resolve();
    if (projectTopicMediaPromise) return projectTopicMediaPromise;

    const images = topicButtons.map((button) => {
      const value = window.getComputedStyle(button).getPropertyValue("--topic-image");
      const match = value.match(/url\(["']?([^"')]+)["']?\)/);
      if (!match) return Promise.resolve();
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      image.src = new URL(match[1], window.location.href).href;
      return imageReady(image);
    });
    projectTopicMediaPromise = Promise.allSettled(images).then(() => {
      projectBoard.classList.add("topic-media-ready");
    });
    return projectTopicMediaPromise;
  }

  function scheduleProjectTopicMedia() {
    if (projectTopicMediaScheduled) return;
    projectTopicMediaScheduled = true;
    afterPageEntry(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(prepareProjectTopicMedia, { timeout: 1400 });
      } else {
        window.setTimeout(prepareProjectTopicMedia, 250);
      }
    }, 250);
  }

  if (projectBoard && projectIntro && !hasQueryTopic && !hasQueryYear && !hashCard) {
    const reduceProjectIntroMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || isCompactExperience;
    projectBoard.classList.add("has-project-intro");
    projectIntro.inert = !reduceProjectIntroMotion;
    let introComplete = false;
    let introFallback;
    function completeProjectIntro() {
      if (introComplete) return;
      introComplete = true;
      window.clearTimeout(introFallback);
      projectBoard.classList.add("is-project-intro-complete");
      projectIntro.inert = false;
    }

    if (reduceProjectIntroMotion) {
      completeProjectIntro();
    } else {
      afterPageEntry(() => {
        const finalYear = yearButtons[yearButtons.length - 1];
        if (finalYear) {
          finalYear.addEventListener("animationend", (event) => {
            if (event.animationName === "project-year-arrive") completeProjectIntro();
          }, { once: true });
        }
        introFallback = window.setTimeout(completeProjectIntro, 4610);
      });
    }
    scheduleProjectTopicMedia();
  } else if (projectBoard) {
    scheduleProjectTopicMedia();
  }

  if (projectBoard && projectCards.length && yearButtons.length && projectIntro && projectYearView && projectYearTitle) {
    let closeTimer;
    let hoverUnlockTimer;
    let mobileFocusMotionVersion = 0;
    const state = {
      mode: "timeline",
      kind: "",
      value: "",
    };

    const topicLabels = new Map(
      topicButtons.map((button) => [button.dataset.projectTopic, button.textContent.trim()])
    );

    function projectFocusUrl(kind, value) {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = "";
      if (kind === "year" && value) url.searchParams.set("year", value);
      if (kind === "topic" && value) url.searchParams.set("topic", value);
      return url;
    }

    function updateProjectHistory(kind, value, replace) {
      const url = projectFocusUrl(kind, value);
      const currentUrl = new URL(window.location.href);
      if (currentUrl.pathname === url.pathname && currentUrl.search === url.search && currentUrl.hash === url.hash) return;
      const method = replace ? "replaceState" : "pushState";
      window.history[method]({ projectKind: kind, projectFocus: value }, "", url);
    }

    function setProjectDestinations(kind, value) {
      projectCards.forEach((card) => {
        const destination = new URL(card.dataset.projectUrl, window.location.href);
        destination.search = "";
        if (kind && value) {
          destination.searchParams.set("from", kind);
          destination.searchParams.set("focus", value);
        }
        card.dataset.projectDestination = destination.href;
        const link = card.querySelector(".project-node-link");
        if (link) link.href = destination.href;
      });
    }

    function sortCards() {
      if (!projectResults) return;
      projectCards
        .slice()
        .sort((a, b) => {
          const yearDiff = Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
          if (yearDiff) return yearDiff;
          return Number(a.dataset.importance || 999) - Number(b.dataset.importance || 999);
        })
        .forEach((card) => projectResults.appendChild(card));
    }

    function matchesYear(card, year) {
      const cardYear = Number(card.dataset.year || 0);
      if (year === "before") return cardYear && cardYear < 2024;
      return card.dataset.year === year;
    }

    function matchesTopic(card, topic) {
      const cardTopics = parseProjectTopics(card.dataset.topics);
      return projectTopicTargets(topic).some((target) => cardTopics.includes(target));
    }

    function setCards(kind, value) {
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const matches = kind === "topic" ? matchesTopic(card, value) : matchesYear(card, value);
        card.hidden = !matches;
        card.classList.toggle("is-selected", matches);
        card.classList.remove("is-muted");
        if (matches) {
          card.style.setProperty("--card-delay", `${visibleCount * 120}ms`);
          visibleCount += 1;
        } else {
          card.style.removeProperty("--card-delay");
        }
      });
      return visibleCount;
    }

    function clearCardHover() {
      projectBoard.classList.remove("is-card-hover");
      projectCards.forEach((card) => card.classList.remove("is-hovered"));
    }

    // Shrink a card title until it fits on a single line (auto-fit).
    function fitCardTitle(h2) {
      fitSingleLine(h2, 15);
    }

    function fitVisibleTitles() {
      if (mobilePageQuery.matches) {
        projectCards.forEach((card) => {
          const h2 = card.querySelector("h2");
          if (h2) h2.style.fontSize = "";
        });
        return;
      }
      projectCards.forEach((card) => {
        if (card.hidden) return;
        const h2 = card.querySelector("h2");
        if (h2) fitCardTitle(h2);
      });
    }

    function setActive(kind, value) {
      yearButtons.forEach((button) => {
        const active = kind === "year" && button.dataset.projectYear === value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      topicButtons.forEach((button) => {
        const active = kind === "topic" && button.dataset.projectTopic === value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function setMode(mode) {
      state.mode = mode;
      const topicMode = mode === "topic";
      if (topicMode) prepareProjectTopicMedia();
      projectBoard.classList.toggle("is-topic-mode", topicMode);
      if (projectToggle) {
        projectToggle.classList.toggle("is-active", topicMode);
        projectToggle.setAttribute("aria-pressed", String(topicMode));
      }
    }

    function pulseButton(button) {
      if (!button) return;
      button.classList.remove("is-pressed");
      void button.offsetWidth;
      button.classList.add("is-pressed");
      window.setTimeout(() => button.classList.remove("is-pressed"), 540);
    }

    function openFocus(kind, value, label, sourceButton, updateHistory) {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hoverUnlockTimer);
      clearCardHover();
      const visibleCount = setCards(kind, value);
      projectYearTitle.textContent = label;
      projectYearView.hidden = false;
      const focusMotionVersion = ++mobileFocusMotionVersion;
      const animateMobileFocus = mobilePageQuery.matches
        && !reduceMotion
        && !document.documentElement.classList.contains("page-entry-pending");
      if (animateMobileFocus) {
        projectYearView.classList.remove("is-mobile-focus-ready");
        projectYearView.classList.add("is-mobile-focus-pending");
      }
      state.kind = kind;
      state.value = value;
      setProjectDestinations(kind, value);
      projectBoard.dataset.projectFocus = value;
      projectBoard.dataset.projectKind = kind;
      projectBoard.classList.add("is-year-open", "is-hover-locked");
      setActive(kind, value);
      pulseButton(sourceButton);
      if (updateHistory) updateProjectHistory(kind, value);
      window.requestAnimationFrame(() => {
        projectBoard.classList.add("is-year-settled");
        fitVisibleTitles();
        if (animateMobileFocus) {
          window.requestAnimationFrame(() => {
            window.setTimeout(() => {
              if (focusMotionVersion !== mobileFocusMotionVersion) return;
              projectYearView.classList.add("is-mobile-focus-ready");
              window.setTimeout(() => {
                if (focusMotionVersion !== mobileFocusMotionVersion) return;
                projectYearView.classList.remove("is-mobile-focus-pending", "is-mobile-focus-ready");
              }, 560);
            }, 140);
          });
        }
      });
      hoverUnlockTimer = window.setTimeout(() => {
        projectBoard.classList.remove("is-hover-locked");
      }, 760 + Math.max(0, visibleCount - 1) * 120);
    }

    function openTopic(topic, label, sourceButton, updateHistory) {
      const normalizedTopic = normalizeProjectTopic(topic);
      if (!normalizedTopic) return;
      setMode("topic");
      openFocus(
        "topic",
        normalizedTopic,
        label || topicLabels.get(normalizedTopic) || formatProjectTopicLabel(normalizedTopic),
        sourceButton,
        updateHistory
      );
    }

    function closeYear(updateHistory) {
      window.clearTimeout(hoverUnlockTimer);
      mobileFocusMotionVersion += 1;
      clearCardHover();
      projectBoard.classList.remove("is-year-settled", "is-year-open");
      projectBoard.classList.remove("is-hover-locked");
      projectYearView.classList.remove("is-mobile-focus-pending", "is-mobile-focus-ready");
      projectBoard.removeAttribute("data-project-focus");
      projectBoard.removeAttribute("data-project-kind");
      state.kind = "";
      state.value = "";
      setProjectDestinations("", "");
      setActive("", "");
      if (updateHistory) updateProjectHistory("", "");
      closeTimer = window.setTimeout(() => {
        projectYearView.hidden = true;
        projectCards.forEach((card) => {
          card.hidden = true;
          card.style.removeProperty("--card-delay");
        });
      }, 560);
    }

    yearButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("mouseenter", () => {
        projectBoard.dataset.hoverYear = button.dataset.projectYear || "";
      });
      button.addEventListener("mouseleave", () => {
        delete projectBoard.dataset.hoverYear;
      });
      button.addEventListener("click", () => {
        const year = button.dataset.projectYear || "";
        const label = button.dataset.projectYearLabel || button.textContent.trim();
        openFocus("year", year, label, button, true);
      });
    });

    topicButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const topic = button.dataset.projectTopic || "";
        openTopic(topic, topicLabels.get(topic) || button.textContent.trim(), button, true);
      });
    });

    if (projectBack) {
      projectBack.addEventListener("click", () => closeYear(true));
    }

    if (projectToggle) {
      projectToggle.addEventListener("click", () => {
        setMode(state.mode === "timeline" ? "topic" : "timeline");
      });
    }

    projectCards.forEach((card) => {
      const projectUrl = card.dataset.projectUrl;
      card.addEventListener("animationend", () => {
        card.classList.remove("is-landing");
      });
      card.addEventListener("click", (event) => {
        const tag = event.target.closest("[data-project-tag]");
        if (tag) {
          event.preventDefault();
          event.stopPropagation();
          openTopic(tag.dataset.projectTag || "", tag.textContent.trim(), tag, true);
          return;
        }
        if (event.target.closest("a, button, summary, details")) return;
        const destination = card.dataset.projectDestination || projectUrl;
        if (destination) window.location.href = destination;
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest("a, button, summary, details")) return;
        event.preventDefault();
        const destination = card.dataset.projectDestination || projectUrl;
        if (destination) window.location.href = destination;
      });
      card.addEventListener("mouseenter", () => {
        if (projectBoard.classList.contains("is-hover-locked")) return;
        projectBoard.classList.add("is-card-hover");
        card.classList.add("is-hovered");
      });
      card.addEventListener("mouseleave", () => {
        projectBoard.classList.remove("is-card-hover");
        card.classList.remove("is-hovered");
      });
      card.addEventListener("focusin", () => {
        if (projectBoard.classList.contains("is-hover-locked")) return;
        projectBoard.classList.add("is-card-hover");
        card.classList.add("is-hovered");
      });
      card.addEventListener("focusout", () => {
        projectBoard.classList.remove("is-card-hover");
        card.classList.remove("is-hovered");
      });
    });

    function restoreProjectState() {
      const params = new URLSearchParams(window.location.search);
      const topic = normalizeProjectTopic(params.get("topic"));
      const year = params.get("year") || "";
      const yearButton = yearButtons.find((button) => button.dataset.projectYear === year);
      const topicExists = topic && projectCards.some((card) => matchesTopic(card, topic));
      const currentHashCard = projectElementFromHash();

      if (topicExists) {
        updateProjectHistory("topic", topic, true);
        openTopic(topic, topicLabels.get(topic) || formatProjectTopicLabel(topic), null, false);
      } else if (year && yearButton) {
        updateProjectHistory("year", year, true);
        setMode("timeline");
        openFocus("year", year, yearButton.dataset.projectYearLabel || year, null, false);
      } else if (currentHashCard) {
        updateProjectHistory("year", currentHashCard.dataset.year || "", true);
        setMode("timeline");
        openFocus("year", currentHashCard.dataset.year || "", currentHashCard.dataset.year || "Projects", null, false);
      } else {
        updateProjectHistory("", "", true);
        setMode("timeline");
        closeYear(false);
      }
    }

    sortCards();
    window.addEventListener("resize", fitVisibleTitles);
    window.addEventListener("popstate", restoreProjectState);
    restoreProjectState();
  }

  // Typewriter identity for the home name-card hero.
  const typeSeq = document.querySelector("[data-typeseq]");
  if (typeSeq) {
    // Keep the identity immediately readable. The former per-character rAF
    // loop repeatedly relaid out the largest text during the first seconds.
    typeSeq.classList.add("is-typed");
    afterPageEntry(() => document.dispatchEvent(new Event("hero-typed")), 720);
  }

  // Interactive ALLEX: wake on hover, reveal part-anchored topic callouts (home).
  const allexNav = document.querySelector("[data-allex-nav]");
  if (allexNav && !isCompactExperience) {
    const allexToggle = document.querySelector("[data-allex-toggle]");
    const allexTopicsEl = document.querySelector("[data-allex-links]");
    const allexTopics = allexTopicsEl ? Array.from(allexTopicsEl.querySelectorAll(".allex-topic")) : [];
    const allexMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const allexHint = document.querySelector("[data-allex-hint]");
    const allexRouteTransition = document.querySelector("[data-allex-route-transition]");
    const allexImage = allexNav.querySelector("img");
    const anchorRoot = allexNav.closest(".hero");
    let isOpen = false;
    let isHover = false;
    let parked = false;
    let hintDismissed = false;
    let heroReady = false;
    let isRouting = false;
    let routeTimer;
    let allexPointerRect;
    let allexPointerFrame;
    let pendingAllexPointer;

    function showHint() {
      if (allexHint && heroReady && !hintDismissed && !parked && !isOpen) {
        allexHint.classList.add("is-visible");
      }
    }
    function hideHint() {
      if (allexHint) allexHint.classList.remove("is-visible");
    }
    function dismissHint() {
      hintDismissed = true;
      hideHint();
    }

    const topicTypingTimers = [];

    allexTopics.forEach((topic) => {
      const label = topic.querySelector(".topic-text");
      if (!label) return;
      label.dataset.fullText = label.textContent.trim();
      const styles = topic.style;
      topic.dataset.baseRun = String(parseFloat(styles.getPropertyValue("--run")) || 0);
      topic.dataset.baseBendX = String(parseFloat(styles.getPropertyValue("--bend-x")) || 0);
      topic.dataset.baseBendY = String(parseFloat(styles.getPropertyValue("--bend-y")) || 0);
    });

    function clearTopicTyping() {
      while (topicTypingTimers.length) window.clearTimeout(topicTypingTimers.pop());
    }

    function typeTopicLabels() {
      clearTopicTyping();
      if (allexMotionPreference.matches) {
        allexTopics.forEach((topic) => {
          const label = topic.querySelector(".topic-text");
          if (label) label.textContent = label.dataset.fullText || "";
        });
        return;
      }
      allexTopics.forEach((topic, topicIndex) => {
        const label = topic.querySelector(".topic-text");
        if (!label) return;
        const text = label.dataset.fullText || "";
        label.textContent = "";
        let charIndex = 0;

        function typeCharacter() {
          charIndex += 1;
          label.textContent = text.slice(0, charIndex);
          if (charIndex < text.length) {
            topicTypingTimers.push(window.setTimeout(typeCharacter, 30));
          }
        }

        topicTypingTimers.push(window.setTimeout(typeCharacter, 920 + topicIndex * 320));
      });
    }

    function renderedImageRect(image) {
      const box = image.getBoundingClientRect();
      const naturalRatio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 855 / 1171;
      let width = box.width;
      let height = width / naturalRatio;
      let left = box.left;
      let top = box.bottom - height;

      if (height > box.height) {
        height = box.height;
        width = height * naturalRatio;
        left = box.right - width;
        top = box.top;
      }
      return { left, top, width, height };
    }

    // Keep every annotation attached to the rendered PNG rather than to the
    // viewport. This remains stable when a laptop's shorter height changes the
    // contain-fit size of the robot.
    function layoutTopics() {
      if (!allexImage || !anchorRoot) return;
      const imageRect = renderedImageRect(allexImage);
      const rootRect = anchorRoot.getBoundingClientRect();
      const lineScale = Math.max(0.68, Math.min(1, imageRect.width / 960));
      const labelWidths = allexTopics.map((topic) => {
        const label = topic.querySelector(".topic-text");
        if (!label || label.style.getPropertyValue("--topic-text-width")) return 0;
        return Math.ceil(label.getBoundingClientRect().width);
      });

      allexTopics.forEach((t, topicIndex) => {
        const anchorX = (parseFloat(t.dataset.anchorX) || 0) / 100;
        const anchorY = (parseFloat(t.dataset.anchorY) || 0) / 100;
        const run = (parseFloat(t.dataset.baseRun) || 0) * lineScale;
        const bendX = (parseFloat(t.dataset.baseBendX) || 0) * lineScale;
        const bendY = (parseFloat(t.dataset.baseBendY) || 0) * lineScale;
        const runLength = Math.abs(run);
        const bendLength = Math.hypot(bendX, bendY);
        t.style.left = `${imageRect.left - rootRect.left + imageRect.width * anchorX}px`;
        t.style.top = `${imageRect.top - rootRect.top + imageRect.height * anchorY}px`;
        t.style.setProperty("--run", run + "px");
        t.style.setProperty("--bend-x", bendX + "px");
        t.style.setProperty("--bend-y", bendY + "px");
        t.style.setProperty("--run-length", runLength + "px");
        t.style.setProperty("--run-angle", (run < 0 ? 180 : 0) + "deg");
        t.style.setProperty("--bend-length", bendLength + "px");
        t.style.setProperty("--bend-angle", (Math.atan2(bendY, bendX) * 180 / Math.PI) + "deg");
        t.style.setProperty("--end-x", (run + bendX) + "px");
        t.style.setProperty("--connector-length", (runLength + bendLength) + "px");
        t.style.setProperty("--connector-bend-offset", -runLength + "px");
        if (labelWidths[topicIndex]) {
          t.querySelector(".topic-text").style.setProperty("--topic-text-width", `${labelWidths[topicIndex]}px`);
        }
      });

      if (allexHint) {
        const hintX = (parseFloat(allexHint.dataset.anchorX) || 0) / 100;
        const hintY = (parseFloat(allexHint.dataset.anchorY) || 0) / 100;
        allexHint.style.left = `${imageRect.left - rootRect.left + imageRect.width * hintX}px`;
        allexHint.style.top = `${imageRect.top - rootRect.top + imageRect.height * hintY}px`;
      }

      if (allexToggle) {
        allexToggle.style.left = `${imageRect.left - rootRect.left}px`;
        allexToggle.style.top = `${imageRect.top - rootRect.top}px`;
        allexToggle.style.width = `${imageRect.width}px`;
        allexToggle.style.height = `${imageRect.height}px`;
        allexPointerRect = imageRect;
      }
    }
    let topicLayoutFrame;
    function scheduleTopicLayout() {
      if (topicLayoutFrame) return;
      topicLayoutFrame = window.requestAnimationFrame(() => {
        topicLayoutFrame = 0;
        layoutTopics();
      });
    }
    afterPageEntry(scheduleTopicLayout, 120);
    window.addEventListener("resize", scheduleTopicLayout);
    if (allexImage && !allexImage.complete) allexImage.addEventListener("load", scheduleTopicLayout, { once: true });

    function render() {
      allexNav.classList.toggle("is-awake", isOpen || isHover);
      allexNav.classList.toggle("is-hovered", isHover && !isOpen);
      allexNav.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("is-allex-open", isOpen);
      if (isOpen) hideHint();
      if (allexTopicsEl) allexTopicsEl.classList.toggle("is-open", isOpen);
      if (allexToggle) {
        allexToggle.setAttribute("aria-expanded", String(isOpen));
        allexToggle.setAttribute("aria-label", isOpen ? "Close ALLEX topics" : "Explore ALLEX topics");
      }
    }

    if (allexToggle) {
      let pressTimer;
      function updateAllexPointer(event) {
        pendingAllexPointer = { x: event.clientX, y: event.clientY };
        if (allexPointerFrame) return;
        allexPointerFrame = window.requestAnimationFrame(() => {
          allexPointerFrame = 0;
          const rect = allexPointerRect || allexToggle.getBoundingClientRect();
          const pointer = pendingAllexPointer;
          if (!pointer || !rect.width || !rect.height) return;
          const x = Math.max(0, Math.min(1, (pointer.x - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (pointer.y - rect.top) / rect.height));
          allexNav.style.setProperty("--allex-pointer-x", `${Math.round(x * 100)}%`);
          allexNav.style.setProperty("--allex-pointer-y", `${Math.round(y * 100)}%`);
          allexNav.style.setProperty("--allex-shift-x", `${((x - 0.5) * 10).toFixed(2)}px`);
          allexNav.style.setProperty("--allex-shift-y", `${(-6 + (y - 0.5) * 8).toFixed(2)}px`);
        });
      }
      function resetAllexPointer() {
        if (allexPointerFrame) window.cancelAnimationFrame(allexPointerFrame);
        allexPointerFrame = 0;
        pendingAllexPointer = null;
        allexNav.style.setProperty("--allex-pointer-x", "50%");
        allexNav.style.setProperty("--allex-pointer-y", "46%");
        allexNav.style.setProperty("--allex-shift-x", "0px");
        allexNav.style.setProperty("--allex-shift-y", "-6px");
      }
      function pressAllex() {
        window.clearTimeout(pressTimer);
        allexNav.classList.add("is-pressed");
        pressTimer = window.setTimeout(() => allexNav.classList.remove("is-pressed"), 220);
      }
      resetAllexPointer();
      allexToggle.addEventListener("pointerenter", () => {
        allexPointerRect = allexToggle.getBoundingClientRect();
        isHover = true;
        render();
      });
      allexToggle.addEventListener("pointermove", updateAllexPointer, { passive: true });
      allexToggle.addEventListener("pointerleave", () => {
        isHover = false;
        resetAllexPointer();
        render();
      });
      allexToggle.addEventListener("focus", () => { isHover = true; render(); });
      allexToggle.addEventListener("blur", () => { isHover = false; render(); });
      allexToggle.addEventListener("pointerdown", pressAllex);
      allexToggle.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") pressAllex();
      });
      allexToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        dismissHint();
        allexNav.classList.remove("is-pressed");
        isOpen = !isOpen;
        if (isOpen) typeTopicLabels();
        else clearTopicTyping();
        render();
      });
    }

    if (allexTopicsEl) {
      function resetAllexRoute() {
        window.clearTimeout(routeTimer);
        isRouting = false;
        document.body.classList.remove("is-allex-routing");
        allexTopics.forEach((topic) => topic.classList.remove("is-routing"));
      }

      allexTopicsEl.addEventListener("click", (event) => {
        const link = event.target.closest(".allex-topic");
        if (!link || isRouting) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;

        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        if (allexMotionPreference.matches) return;

        event.preventDefault();
        isRouting = true;
        const flagRect = link.querySelector(".topic-flag").getBoundingClientRect();
        if (allexRouteTransition) {
          allexRouteTransition.style.setProperty("--route-x", `${flagRect.left + flagRect.width / 2}px`);
          allexRouteTransition.style.setProperty("--route-y", `${flagRect.top + flagRect.height / 2}px`);
        }
        link.classList.add("is-routing");
        document.body.classList.add("is-allex-routing");
        routeTimer = window.setTimeout(() => window.location.assign(destination.href), 540);
      });

      window.addEventListener("pageshow", (event) => {
        if (event.persisted) resetAllexRoute();
      });
    }

    document.addEventListener("click", (event) => {
      const insideUI =
        (allexToggle && allexToggle.contains(event.target)) ||
        (allexTopicsEl && allexTopicsEl.contains(event.target));
      if (isOpen && !insideUI) {
        isOpen = false;
        clearTopicTyping();
        render();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) {
        isOpen = false;
        clearTopicTyping();
        render();
      }
    });

    function syncPark() {
      parkFrame = 0;
      const shouldPark = window.scrollY > window.innerHeight * 0.45;
      if (shouldPark === parked) return;
      parked = shouldPark;
      if (allexToggle) allexToggle.classList.toggle("is-parked", parked);
      if (parked && isOpen) {
        isOpen = false;
        clearTopicTyping();
        render();
      }
      if (parked) hideHint();
      else showHint();
    }
    let parkFrame;
    function scheduleParkSync() {
      if (parkFrame) return;
      parkFrame = window.requestAnimationFrame(syncPark);
    }
    afterPageEntry(scheduleParkSync, 120);
    window.addEventListener("scroll", scheduleParkSync, { passive: true });

    // Reveal the quiet ALLEX exploration cue once the home entrance finishes.
    function armHint() {
      heroReady = true;
      showHint();
    }
    document.addEventListener("hero-typed", armHint);
    // Fallback in case the typing sequence never signals completion.
    afterPageEntry(armHint, 3200);
  }

  // Project detail motion: keep the hero sequential, then reveal each dossier
  // section once as it enters the viewport. Content stays visible when motion
  // is reduced or IntersectionObserver is unavailable.
  const detailPage = document.querySelector(".project-detail-page");
  if (detailPage) {
    const detailBackLinks = Array.from(detailPage.querySelectorAll("[data-project-detail-back]"));
    if (detailBackLinks.length) {
      const params = new URLSearchParams(window.location.search);
      const returnKind = params.get("from") || "";
      const returnFocus = params.get("focus") || "";
      const returnTopic = normalizeProjectTopic(returnFocus);
      const detailYear = detailPage.dataset.projectYear || "";
      const detailTopics = parseProjectTopics(detailPage.dataset.projectTopics);
      const validYear = returnKind === "year" && returnFocus === detailYear;
      const validTopic = returnKind === "topic" && projectTopicTargets(returnTopic).some((topic) => detailTopics.includes(topic));

      if (validYear || validTopic) {
        const focusLabel = validYear ? returnFocus : formatProjectTopicLabel(returnTopic);
        detailBackLinks.forEach((detailBack) => {
          const backUrl = new URL(detailBack.href, window.location.href);
          backUrl.search = "";
          backUrl.hash = "";
          backUrl.searchParams.set(validYear ? "year" : "topic", validYear ? returnFocus : returnTopic);
          detailBack.href = backUrl.href;

          const detailBackLabel = detailBack.querySelector("[data-project-detail-back-label]");
          if (detailBackLabel) {
            const labelPrefix = detailBack.closest(".project-detail-return") ? "More from" : "Back to";
            detailBackLabel.textContent = `${labelPrefix} ${focusLabel}`;
          }
        });
      }
    }

    const reduceDetailMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const detailRevealTargets = Array.from(detailPage.querySelectorAll(
      ".project-detail-media, .project-video-hero, .project-detail-block, .project-media-board, .project-detail-return"
    ));

    if (!reduceDetailMotion && !mobilePageQuery.matches && "IntersectionObserver" in window) {
      detailRevealTargets.forEach((target) => {
        target.classList.add("detail-reveal");
        const staggeredChildren = target.querySelectorAll(
          ".project-block-head, .project-did-list > li, .project-facts-cell, .project-media-item"
        );
        staggeredChildren.forEach((child, index) => {
          child.style.setProperty("--detail-order", index);
        });
      });

      const detailObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          detailObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

      // Arm the hidden start state while the shared page surface is still
      // concealed. Observing after release keeps scroll transitions from
      // completing behind the entry gate without flashing visible content.
      detailPage.classList.add("is-detail-motion-ready");
      afterPageEntry(() => {
        detailRevealTargets.forEach((target) => detailObserver.observe(target));
      });
    }
  }

  // Keep award detail exits tied to the surface the visitor came from.
  // Both CV and Experience intentionally share the same gallery layout.
  const awardDetailPage = document.querySelector(".award-detail-page");
  if (awardDetailPage) {
    const source = new URLSearchParams(window.location.search).get("from") === "cv" ? "cv" : "experience";
    const destination = source === "cv"
      ? awardDetailPage.dataset.awardCvUrl
      : awardDetailPage.dataset.awardExperienceUrl;
    const sourceLabel = source === "cv" ? "CV" : "Experience";
    const destinationPath = new URL(destination, window.location.href).pathname;
    const sourceNavLink = Array.from(document.querySelectorAll(".bubble-link")).find((link) => {
      return new URL(link.href, window.location.href).pathname === destinationPath;
    });
    if (sourceNavLink) sourceNavLink.setAttribute("aria-current", "page");

    awardDetailPage.querySelectorAll("[data-award-detail-back]").forEach((link) => {
      link.href = new URL(destination, window.location.href).href;
      const label = link.querySelector("[data-award-detail-back-label]");
      if (label) {
        const labelPrefix = link.closest(".award-detail-return") ? "More from" : "Back to";
        label.textContent = `${labelPrefix} ${sourceLabel}`;
      }
    });
  }

  // Auto-fit the project detail hero title (large h1) to a single line.
  const detailTitle = document.querySelector(".project-detail-copy h1");
  if (detailTitle && !isCompactExperience) {
    function fitDetailTitle() {
      fitSingleLine(detailTitle, 34);
    }
    fitDetailTitle();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitDetailTitle);
    }
    window.addEventListener("resize", fitDetailTitle);
  }

  // Release the shared motion clock only after a short stable-layout window.
  // Fonts, eager above-the-fold images, and preloaded CSS artwork may settle
  // first, but a bounded deadline always keeps the page from feeling blocked.
  function announcePageEntryStart() {
    if (window.__pageEntryStarted) return;
    window.__pageEntryStarted = true;
    document.dispatchEvent(new Event("page-entry-start"));
  }

  function finishPageEntry(immediate) {
    if (!pageEntryRoot.classList.contains("page-entry-pending")) return;
    window.clearTimeout(window.__pageEntryFallback);

    if (immediate) {
      pageEntryRoot.classList.remove("page-entry-pending", "page-entry-ready");
      announcePageEntryStart();
      return;
    }

    pageEntryRoot.classList.add("page-entry-ready");
    announcePageEntryStart();
    window.setTimeout(() => {
      pageEntryRoot.classList.remove("page-entry-pending", "page-entry-ready");
    }, 720);
  }

  if (!reduceMotion && pageEntryRoot.classList.contains("page-entry-pending")) {
    const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
    const isInternalDocumentEntry = (() => {
      if (!document.referrer) return false;
      try {
        return new URL(document.referrer).origin === window.location.origin;
      } catch (_error) {
        return false;
      }
    })();

    if (!isInternalDocumentEntry) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => finishPageEntry(false));
      });
      return;
    }

    const entryWaitStartedAt = performance.now();
    const criticalImages = Array.from(document.querySelectorAll(".page-shell img:not([loading='lazy'])"))
      .filter((image) => !image.hasAttribute("data-entry-defer"))
      .filter((image) => image.getBoundingClientRect().top < window.innerHeight * 1.25);
    const criticalImageUrls = new Set(criticalImages.map((image) => image.currentSrc || image.src));
    const preloadImages = Array.from(document.querySelectorAll("link[rel='preload'][as='image']"))
      .filter((link) => !link.media || window.matchMedia(link.media).matches)
      .filter((link) => !link.hasAttribute("data-entry-defer"))
      .filter((link) => !criticalImageUrls.has(link.href))
      .map((link) => {
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "high";
        image.src = link.href;
        return image;
      });
    let preloadArtworkSettled = preloadImages.length === 0;
    const preloadReady = Promise.allSettled(preloadImages.map(imageReady)).then(() => {
      preloadArtworkSettled = true;
    });
    const resourcesReady = Promise.allSettled([
      preloadReady,
      ...criticalImages.map(imageReady)
    ]);

    Promise.race([
      resourcesReady.then(() => true),
      delay(500).then(() => false)
    ]).then(async (resourcesFinished) => {
      if (!resourcesFinished && !preloadArtworkSettled && document.querySelector(".project-timeline-page")) {
        pageEntryRoot.classList.add("page-entry-assets-late");
      }
      if (resourcesFinished) {
        const elapsed = performance.now() - entryWaitStartedAt;
        await delay(Math.max(100, 180 - elapsed));
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => finishPageEntry(false));
      });
    });

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) finishPageEntry(true);
    });
  } else if (pageEntryRoot.classList.contains("page-entry-pending")) {
    finishPageEntry(true);
  }
})();
