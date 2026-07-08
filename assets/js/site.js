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
  const yearButtons = Array.from(document.querySelectorAll("[data-project-year]"));
  const projectResults = document.querySelector("[data-project-results]");
  const projectIntro = document.querySelector("[data-project-intro]");
  const projectYearView = document.querySelector("[data-project-year-view]");
  const projectYearTitle = document.querySelector("[data-project-year-title]");
  const projectYearCopy = document.querySelector("[data-project-year-copy]");
  const projectBack = document.querySelector("[data-project-back]");
  const projectToggle = document.querySelector("[data-project-toggle]");

  if (projectBoard && projectCards.length && yearButtons.length && projectIntro && projectYearView && projectYearTitle) {
    let closeTimer;

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

    function setCardsForYear(year) {
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const matches = matchesYear(card, year);
        card.hidden = !matches;
        card.classList.toggle("is-selected", matches);
        card.classList.remove("is-muted");
        if (matches) {
          visibleCount += 1;
        }
      });
      return visibleCount;
    }

    function setActiveYear(year) {
      yearButtons.forEach((button) => {
        const active = button.dataset.projectYear === year;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function openYear(year, label) {
      window.clearTimeout(closeTimer);
      const visibleCount = setCardsForYear(year);
      projectYearTitle.textContent = label;
      if (projectYearCopy) {
        projectYearCopy.textContent = visibleCount
          ? `${visibleCount} project${visibleCount === 1 ? "" : "s"} from ${label}, sorted newest first.`
          : `No public ${label} project cards are ready yet.`;
      }
      projectYearView.hidden = false;
      projectBoard.dataset.projectYear = year;
      projectBoard.classList.add("is-year-open");
      setActiveYear(year);
      window.requestAnimationFrame(() => {
        projectBoard.classList.add("is-year-settled");
      });
    }

    function closeYear() {
      projectBoard.classList.remove("is-year-settled", "is-year-open");
      projectBoard.removeAttribute("data-project-year");
      setActiveYear("");
      closeTimer = window.setTimeout(() => {
        projectYearView.hidden = true;
        projectCards.forEach((card) => {
          card.hidden = true;
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
        openYear(year, label);
      });
    });

    if (projectBack) {
      projectBack.addEventListener("click", closeYear);
    }

    if (projectToggle) {
      projectToggle.addEventListener("click", () => {
        projectToggle.classList.toggle("is-active");
        projectToggle.setAttribute("aria-pressed", String(projectToggle.classList.contains("is-active")));
      });
    }

    projectCards.forEach((card) => {
      card.addEventListener("animationend", () => {
        card.classList.remove("is-landing");
      });
    });

    sortCards();
    const hashCard = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (hashCard && hashCard.matches("[data-project-card]")) {
      openYear(hashCard.dataset.year || "", hashCard.dataset.year || "Projects");
    } else {
      closeYear();
    }
  }
})();
