(function () {
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

    function setBubbleNav(open) {
      bubbleNav.classList.toggle("is-open", open);
      if (bubbleToggle) {
        bubbleToggle.setAttribute("aria-expanded", String(open));
        bubbleToggle.setAttribute("aria-label", open ? "Close floating navigation" : "Open floating navigation");
      }
    }

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
        setBubbleNav(false);
      }
    });

    bubbleNav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      burst(link);

      const url = new URL(link.getAttribute("href"), window.location.href);
      if (!url.hash || !samePath(url)) {
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !link.target) {
          event.preventDefault();
          document.body.classList.add("page-exit");
          window.setTimeout(() => {
            window.location.href = url.href;
          }, 420);
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

  const homeHero = document.querySelector(".home-page .hero");
  const homeActivities = document.querySelector("[data-home-activities]");
  const scrollCue = document.querySelector(".scroll-cue");
  if (homeHero && homeActivities) {
    // Deterministic two-panel snap: every wheel gesture resolves to panel 0 (hero)
    // or panel 1 (activities). Down always advances, up always retreats, and an
    // opposite-direction wheel mid-animation reverses immediately — never stuck between.
    const panels = [homeHero, homeActivities];
    const panelFromScroll = () => (window.scrollY > window.innerHeight * 0.5 ? 1 : 0);
    let current = panelFromScroll();
    let locked = false;
    let lockTimer;

    function syncScrollCue() {
      if (!scrollCue) return;
      const up = current === 1;
      scrollCue.classList.toggle("is-up", up);
      scrollCue.setAttribute("href", up ? "#about" : "#activities");
      scrollCue.setAttribute("aria-label", up ? "Scroll to top" : "Scroll to activities");
    }

    function goTo(idx) {
      current = idx < 0 ? 0 : idx > 1 ? 1 : idx;
      panels[current].scrollIntoView({ behavior: "smooth", block: "start" });
      locked = true;
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(() => {
        locked = false;
        current = panelFromScroll();
        syncScrollCue();
      }, 620);
      syncScrollCue();
    }

    syncScrollCue();
    window.addEventListener(
      "scroll",
      () => {
        if (locked) return;
        current = panelFromScroll();
        syncScrollCue();
      },
      { passive: true }
    );

    if (scrollCue) {
      scrollCue.addEventListener("click", (event) => {
        event.preventDefault();
        goTo(current === 0 ? 1 : 0);
      });
    }

    window.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) < 6) return;
        const dir = event.deltaY > 0 ? 1 : -1;
        const next = current + dir;
        if (next < 0 || next > 1) {
          // At an edge: hold position while a snap is settling, else allow native scroll.
          if (locked) event.preventDefault();
          return;
        }
        event.preventDefault();
        goTo(next);
      },
      { passive: false }
    );
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

  if (projectBoard && projectCards.length && yearButtons.length && projectIntro && projectYearView && projectYearTitle) {
    let closeTimer;
    let hoverUnlockTimer;
    const state = {
      mode: "timeline",
      kind: "",
      value: "",
    };

    const topicLabels = new Map(
      topicButtons.map((button) => [button.dataset.projectTopic, button.textContent.trim()])
    );

    function formatTopicLabel(value) {
      return (value || "")
        .split(/[\s-]+/)
        .filter(Boolean)
        .map((word) => {
          const upper = word.toUpperCase();
          return upper.length <= 3 ? upper : upper.charAt(0) + upper.slice(1).toLowerCase();
        })
        .join(" ");
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
      return (card.dataset.topics || "").includes(topic);
    }

    function setCards(kind, value) {
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const matches = kind === "topic" ? matchesTopic(card, value) : matchesYear(card, value);
        card.hidden = !matches;
        card.classList.toggle("is-selected", matches);
        card.classList.remove("is-muted");
        if (matches) {
          card.style.setProperty("--card-delay", `${visibleCount * 420}ms`);
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

    function openFocus(kind, value, label, sourceButton) {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hoverUnlockTimer);
      clearCardHover();
      const visibleCount = setCards(kind, value);
      projectYearTitle.textContent = label;
      projectYearView.hidden = false;
      state.kind = kind;
      state.value = value;
      projectBoard.dataset.projectFocus = value;
      projectBoard.dataset.projectKind = kind;
      projectBoard.classList.add("is-year-open", "is-hover-locked");
      setActive(kind, value);
      pulseButton(sourceButton);
      window.requestAnimationFrame(() => {
        projectBoard.classList.add("is-year-settled");
      });
      hoverUnlockTimer = window.setTimeout(() => {
        projectBoard.classList.remove("is-hover-locked");
      }, Math.min(2200, 980 + visibleCount * 220));
    }

    function openTopic(topic, label, sourceButton) {
      if (!topic) return;
      setMode("topic");
      openFocus("topic", topic, label || topicLabels.get(topic) || formatTopicLabel(topic), sourceButton);
    }

    function closeYear() {
      window.clearTimeout(hoverUnlockTimer);
      clearCardHover();
      projectBoard.classList.remove("is-year-settled", "is-year-open");
      projectBoard.classList.remove("is-hover-locked");
      projectBoard.removeAttribute("data-project-focus");
      projectBoard.removeAttribute("data-project-kind");
      state.kind = "";
      state.value = "";
      setActive("", "");
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
        openFocus("year", year, label, button);
      });
    });

    topicButtons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const topic = button.dataset.projectTopic || "";
        openTopic(topic, topicLabels.get(topic) || button.textContent.trim(), button);
      });
    });

    if (projectBack) {
      projectBack.addEventListener("click", closeYear);
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
          openTopic(tag.dataset.projectTag || "", tag.textContent.trim(), tag);
          return;
        }
        if (event.target.closest("a, button, summary, details")) return;
        if (projectUrl) window.location.href = projectUrl;
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest("a, button, summary, details")) return;
        event.preventDefault();
        if (projectUrl) window.location.href = projectUrl;
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

    sortCards();
    const queryTopic = new URLSearchParams(window.location.search).get("topic");
    const hashCard = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (queryTopic) {
      openTopic(queryTopic.toLowerCase(), formatTopicLabel(queryTopic));
    } else if (hashCard && hashCard.matches("[data-project-card]")) {
      setMode("timeline");
      openFocus("year", hashCard.dataset.year || "", hashCard.dataset.year || "Projects");
    } else {
      setMode("timeline");
      closeYear();
    }
  }
})();
