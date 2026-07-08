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

  if (projectBoard && projectCards.length && topicButtons.length && yearButtons.length) {
    const state = {
      topic: "all",
      year: "all",
    };

    function topicMatches(card, topic) {
      if (topic === "all") return true;
      return (card.dataset.topics || "").includes(topic);
    }

    function yearMatches(card, year) {
      if (year === "all") return true;
      if (year === "current") return card.dataset.status === "current";
      return card.dataset.year === year;
    }

    function cardMatches(card, nextState = state) {
      return topicMatches(card, nextState.topic) && yearMatches(card, nextState.year);
    }

    function hasMatch(nextState) {
      return projectCards.some((card) => cardMatches(card, nextState));
    }

    function updateFilter() {
      const isFiltered = state.topic !== "all" || state.year !== "all";
      projectBoard.classList.toggle("is-filtered", isFiltered);

      projectCards.forEach((card) => {
        const matches = cardMatches(card);
        card.classList.toggle("is-selected", matches);
        card.classList.toggle("is-muted", !matches);
      });

      topicButtons.forEach((button) => {
        const topic = button.dataset.projectTopic;
        const active = topic === state.topic;
        const available = hasMatch({ topic, year: state.year });
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-available", !active && available && state.year !== "all");
        button.classList.toggle("is-unavailable", !active && !available);
      });

      yearButtons.forEach((button) => {
        const year = button.dataset.projectYear;
        const active = year === state.year;
        const available = hasMatch({ topic: state.topic, year });
        button.classList.toggle("is-active", active);
        button.classList.toggle("is-available", !active && available && state.topic !== "all");
        button.classList.toggle("is-unavailable", !active && !available);
      });
    }

    topicButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.topic = button.dataset.projectTopic || "all";
        updateFilter();
      });
    });

    yearButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.year = button.dataset.projectYear || "all";
        updateFilter();
      });
    });

    updateFilter();
  }
})();
