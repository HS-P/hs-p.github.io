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

  const projectBoard = document.querySelector("[data-project-board]");
  const projectCards = Array.from(document.querySelectorAll("[data-project-card]"));
  const topicButtons = Array.from(document.querySelectorAll("[data-project-topic]"));
  const yearButtons = Array.from(document.querySelectorAll("[data-project-year]"));
  const projectResults = document.querySelector("[data-project-results]");
  const projectEmpty = document.querySelector("[data-project-empty]");
  const projectFocusKind = document.querySelector("[data-project-focus-kind]");
  const projectFocusTitle = document.querySelector("[data-project-focus-title]");

  if (projectBoard && projectCards.length && topicButtons.length && yearButtons.length) {
    const state = {
      kind: "idle",
      value: "",
      label: "Select",
    };

    const topicLabels = new Map(
      topicButtons.map((button) => [button.dataset.projectTopic, button.textContent.trim()])
    );

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

    function cardMatches(card) {
      if (state.kind === "year") return card.dataset.year === state.value;
      if (state.kind === "topic") return (card.dataset.topics || "").includes(state.value);
      return false;
    }

    function hasMatch(kind, value) {
      return projectCards.some((card) => {
        if (kind === "year") return card.dataset.year === value;
        return (card.dataset.topics || "").includes(value);
      });
    }

    function setFocus(kind, value, label) {
      state.kind = kind;
      state.value = value;
      state.label = label;
      updateFilter();
    }

    function updateFilter() {
      const isFocused = state.kind !== "idle";
      projectBoard.classList.toggle("is-idle", !isFocused);
      projectBoard.classList.toggle("is-filtered", isFocused);
      projectBoard.classList.toggle("is-year-mode", state.kind === "year");
      projectBoard.classList.toggle("is-topic-mode", state.kind === "topic");
      projectBoard.dataset.projectMode = state.kind;

      if (projectFocusKind) {
        projectFocusKind.textContent = isFocused ? (state.kind === "year" ? "Year" : "Topic") : "Choose axis";
      }
      if (projectFocusTitle) {
        projectFocusTitle.textContent = state.label;
      }
      if (projectEmpty) {
        projectEmpty.hidden = isFocused;
      }

      projectCards.forEach((card) => {
        const matches = cardMatches(card);
        card.hidden = !matches;
        card.classList.toggle("is-selected", matches);
        card.classList.toggle("is-muted", !matches);
      });

      topicButtons.forEach((button) => {
        const topic = button.dataset.projectTopic;
        const active = state.kind === "topic" && topic === state.value;
        const available = hasMatch("topic", topic);
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-available", !active && available && state.kind === "year");
        button.classList.toggle("is-unavailable", !active && !available);
      });

      yearButtons.forEach((button) => {
        const year = button.dataset.projectYear;
        const active = state.kind === "year" && year === state.value;
        const available = hasMatch("year", year);
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-available", !active && available && state.kind === "topic");
        button.classList.toggle("is-unavailable", !active && !available);
      });
    }

    topicButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const topic = button.dataset.projectTopic || "";
        setFocus("topic", topic, topicLabels.get(topic) || button.textContent.trim());
      });
    });

    yearButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const year = button.dataset.projectYear || "";
        setFocus("year", year, year);
      });
    });

    sortCards();
    const hashCard = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (hashCard && hashCard.matches("[data-project-card]")) {
      state.kind = "year";
      state.value = hashCard.dataset.year || "";
      state.label = state.value || "Projects";
    }
    updateFilter();
  }
})();
