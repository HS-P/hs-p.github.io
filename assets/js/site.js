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
  if (homeActivities) {
    let isSnapping = false;
    let snapTarget = "";
    let snapTimer;
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
      if (!scrollCue) return;
      const up = atActivities();
      scrollCue.classList.toggle("is-up", up);
      scrollCue.setAttribute("href", up ? "#about" : "#activities");
      scrollCue.setAttribute("aria-label", up ? "Scroll to top" : "Scroll to activities");
    }

    syncScrollCue();
    window.addEventListener("scroll", syncScrollCue, { passive: true });
    if (scrollCue) {
      scrollCue.addEventListener("click", (event) => {
        event.preventDefault();
        snapTo(atActivities() ? "top" : "activities");
      });
    }

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
  const queryTopic = projectBoard ? new URLSearchParams(window.location.search).get("topic") : "";
  const hashCard = projectBoard && window.location.hash ? document.querySelector(window.location.hash) : null;

  if (projectBoard && projectIntro && !queryTopic && !(hashCard && hashCard.matches("[data-project-card]"))) {
    projectBoard.classList.add("has-project-intro");
    window.setTimeout(() => projectBoard.classList.add("is-project-intro-complete"), 7000);
  }

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

  // Typewriter identity for the home name-card hero.
  const typeSeq = document.querySelector("[data-typeseq]");
  if (typeSeq) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = Array.from(typeSeq.querySelectorAll("[data-type]"));
    if (lines.length && !reduceMotion) {
      typeSeq.classList.add("is-typing-ready");
      const targets = lines.map((el) => {
        const text = el.textContent.trim();
        el.textContent = "";
        return { el, text };
      });

      function speedFor(el) {
        if (el.classList.contains("hero-name-main")) return 90;
        if (el.classList.contains("hero-name-sub")) return 118;
        return 25;
      }

      let li = 0;
      function typeLine() {
        if (li >= targets.length) {
          typeSeq.classList.add("is-typed");
          return;
        }
        const { el, text } = targets[li];
        el.classList.add("nc-caret");
        const speed = speedFor(el);
        let ci = 0;
        function step() {
          el.textContent = text.slice(0, ci);
          ci += 1;
          if (ci <= text.length) {
            window.setTimeout(step, speed);
          } else {
            el.classList.remove("nc-caret");
            li += 1;
            window.setTimeout(typeLine, 220);
          }
        }
        step();
      }
      window.setTimeout(typeLine, 520);
    }
  }

  // Interactive ALLEX: wake on hover, reveal part-anchored topic callouts (home).
  const allexNav = document.querySelector("[data-allex-nav]");
  if (allexNav) {
    const allexToggle = document.querySelector("[data-allex-toggle]");
    const allexTopicsEl = document.querySelector("[data-allex-links]");
    const allexTopics = allexTopicsEl ? Array.from(allexTopicsEl.querySelectorAll(".allex-topic")) : [];
    const reduceAllexMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isOpen = false;
    let isHover = false;
    let parked = false;

    const topicTypingTimers = [];

    allexTopics.forEach((topic) => {
      const label = topic.querySelector(".topic-text");
      if (!label) return;
      label.dataset.fullText = label.textContent.trim();
      label.style.setProperty("--topic-text-width", `${Math.ceil(label.getBoundingClientRect().width)}px`);
    });

    function clearTopicTyping() {
      while (topicTypingTimers.length) window.clearTimeout(topicTypingTimers.pop());
    }

    function typeTopicLabels() {
      clearTopicTyping();
      if (reduceAllexMotion) {
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
            topicTypingTimers.push(window.setTimeout(typeCharacter, 42));
          }
        }

        topicTypingTimers.push(window.setTimeout(typeCharacter, 1050 + topicIndex * 360));
      });
    }

    // Pin each callout to its ALLEX part and derive a horizontal run followed
    // by a short diagonal bend into the label.
    function layoutTopics() {
      allexTopics.forEach((t) => {
        const cs = getComputedStyle(t);
        const run = parseFloat(cs.getPropertyValue("--run")) || 0;
        const bendX = parseFloat(cs.getPropertyValue("--bend-x")) || 0;
        const bendY = parseFloat(cs.getPropertyValue("--bend-y")) || 0;
        t.style.setProperty("--run-length", Math.abs(run) + "px");
        t.style.setProperty("--run-angle", (run < 0 ? 180 : 0) + "deg");
        t.style.setProperty("--bend-length", Math.hypot(bendX, bendY) + "px");
        t.style.setProperty("--bend-angle", (Math.atan2(bendY, bendX) * 180 / Math.PI) + "deg");
        t.style.setProperty("--end-x", (run + bendX) + "px");
      });
    }
    layoutTopics();
    window.addEventListener("resize", layoutTopics);

    function render() {
      allexNav.classList.toggle("is-awake", isOpen || isHover);
      if (allexTopicsEl) allexTopicsEl.classList.toggle("is-open", isOpen);
      if (allexToggle) {
        allexToggle.setAttribute("aria-expanded", String(isOpen));
        allexToggle.setAttribute("aria-label", isOpen ? "Close ALLEX topics" : "Explore ALLEX topics");
      }
    }

    if (allexToggle) {
      allexToggle.addEventListener("mouseenter", () => { isHover = true; render(); });
      allexToggle.addEventListener("mouseleave", () => { isHover = false; render(); });
      allexToggle.addEventListener("focus", () => { isHover = true; render(); });
      allexToggle.addEventListener("blur", () => { isHover = false; render(); });
      allexToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        isOpen = !isOpen;
        if (isOpen) typeTopicLabels();
        else clearTopicTyping();
        render();
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
      const shouldPark = window.scrollY > window.innerHeight * 0.45;
      if (shouldPark === parked) return;
      parked = shouldPark;
      if (allexToggle) allexToggle.classList.toggle("is-parked", parked);
      if (parked && isOpen) {
        isOpen = false;
        clearTopicTyping();
        render();
      }
    }
    syncPark();
    window.addEventListener("scroll", syncPark, { passive: true });
  }
})();
