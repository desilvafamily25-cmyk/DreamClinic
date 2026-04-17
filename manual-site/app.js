const data = window.MANUAL_DATA;

const state = {
  activeTab: data.tabs[0].id,
  activeDoc: data.docs[0].id,
  query: "",
  activeSectionId: "",
};

const elements = {
  topTabs: document.querySelector("[data-top-tabs]"),
  sideNav: document.querySelector("[data-side-nav]"),
  content: document.querySelector("[data-content]"),
  search: document.querySelector("[data-search]"),
  title: document.querySelector("[data-current-title]"),
  subtitle: document.querySelector("[data-current-subtitle]"),
  count: document.querySelector("[data-current-count]"),
  sidebar: document.querySelector(".sidebar"),
  tabsBar: document.querySelector(".tabs-bar"),
};

let sectionObserver = null;

function stickyOffset() {
  const tabsHeight = elements.tabsBar?.offsetHeight || 0;
  return tabsHeight + 24;
}

function docsForTab(tabId) {
  return data.docs.filter((doc) => doc.tab === tabId);
}

function sectionsForDoc(doc) {
  if (!state.query) return doc.sections;
  const query = state.query.toLowerCase();
  return doc.sections.filter((section) => section.title.toLowerCase().includes(query));
}

function getActiveDoc() {
  return data.docs.find((doc) => doc.id === state.activeDoc) || docsForTab(state.activeTab)[0];
}

function normaliseAnchor(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function wireInternalLinks(container) {
  const headings = Array.from(container.querySelectorAll("h1[id], h2[id], h3[id]"));
  const headingMap = new Map(headings.map((heading) => [heading.id, heading]));

  container.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const rawId = href.slice(1);
      let target = headingMap.get(rawId);

      if (!target) {
        const wanted = normaliseAnchor(rawId);
        target = headings.find((heading) => {
          const actual = normaliseAnchor(heading.id);
          return actual === wanted || actual.includes(wanted) || wanted.includes(actual);
        });
      }

      if (target) {
        event.preventDefault();
        const top = window.scrollY + target.getBoundingClientRect().top - stickyOffset();
        window.scrollTo({ top, behavior: "smooth" });
        history.replaceState(null, "", `#${target.id}`);
      }
    });
  });
}

function ensureValidActiveDoc() {
  const visibleDocs = docsForTab(state.activeTab);
  if (!visibleDocs.some((doc) => doc.id === state.activeDoc)) {
    state.activeDoc = visibleDocs[0]?.id || "";
  }
}

function renderTopTabs() {
  elements.topTabs.innerHTML = "";
  data.tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.className = `top-tab ${tab.id === state.activeTab ? "is-active" : ""}`;
    button.type = "button";
    button.textContent = tab.label;
    button.dataset.tabId = tab.id;
    button.addEventListener("click", () => {
      state.activeTab = tab.id;
      state.query = "";
      elements.search.value = "";
      ensureValidActiveDoc();
      render();
    });
    elements.topTabs.appendChild(button);
  });
}

function renderSideNav() {
  elements.sideNav.innerHTML = "";
  const docs = docsForTab(state.activeTab);
  docs.forEach((doc) => {
    const group = document.createElement("section");
    group.className = "nav-group";

    const docButton = document.createElement("button");
    docButton.type = "button";
    docButton.className = `doc-link ${doc.id === state.activeDoc ? "is-active" : ""}`;
    docButton.innerHTML = `<span>${doc.title}</span><small>${doc.summary}</small>`;
    docButton.addEventListener("click", () => {
      state.activeDoc = doc.id;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    group.appendChild(docButton);

    const sectionList = document.createElement("div");
    sectionList.className = "section-list";
    sectionsForDoc(doc).forEach((section) => {
      const link = document.createElement("a");
      link.href = `#${section.id}`;
      link.className = `section-link level-${section.level}`;
      link.dataset.sectionId = section.id;
      link.dataset.docId = doc.id;
      link.textContent = section.title;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (doc.id !== state.activeDoc) {
          state.activeDoc = doc.id;
          render();
          setTimeout(() => {
            const target = document.getElementById(section.id);
            if (target) {
              const top = window.scrollY + target.getBoundingClientRect().top - stickyOffset();
              window.scrollTo({ top, behavior: "smooth" });
            }
          }, 0);
          return;
        }

        const target = document.getElementById(section.id);
        if (target) {
          const top = window.scrollY + target.getBoundingClientRect().top - stickyOffset();
          window.scrollTo({ top, behavior: "smooth" });
          history.replaceState(null, "", `#${section.id}`);
        }
      });
      sectionList.appendChild(link);
    });
    group.appendChild(sectionList);
    elements.sideNav.appendChild(group);
  });
}

function setActiveSection(sectionId, { scrollNav = true } = {}) {
  state.activeSectionId = sectionId || "";
  const links = elements.sideNav.querySelectorAll("[data-section-id]");
  let activeLink = null;

  links.forEach((link) => {
    const isActive = link.dataset.sectionId === state.activeSectionId && link.dataset.docId === state.activeDoc;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      activeLink = link;
    }
  });

  if (scrollNav && activeLink) {
    activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function observeSections() {
  if (sectionObserver) {
    sectionObserver.disconnect();
    sectionObserver = null;
  }

  const article = elements.content.querySelector(".manual-article");
  if (!article) return;

  const headings = Array.from(article.querySelectorAll("h1[id], h2[id], h3[id]"));
  if (!headings.length) return;

  const sortedIds = headings.map((heading) => heading.id);
  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length) {
        setActiveSection(visible[0].target.id);
        return;
      }

      const passed = headings
        .filter((heading) => heading.getBoundingClientRect().top - stickyOffset() <= 0)
        .map((heading) => heading.id);

      if (passed.length) {
        setActiveSection(passed[passed.length - 1], { scrollNav: false });
      } else {
        setActiveSection(sortedIds[0], { scrollNav: false });
      }
    },
    {
      root: null,
      rootMargin: `-${stickyOffset()}px 0px -55% 0px`,
      threshold: [0, 0.1, 0.4, 1],
    }
  );

  headings.forEach((heading) => sectionObserver.observe(heading));
  setActiveSection(headings[0].id, { scrollNav: false });
}

function renderContent() {
  const doc = getActiveDoc();
  if (!doc) {
    elements.content.innerHTML = "<p>No manual content found.</p>";
    return;
  }

  elements.title.textContent = doc.title;
  elements.subtitle.textContent = doc.summary;
  elements.count.textContent = `${doc.sections.length} sections`;

  const article = document.createElement("article");
  article.className = "manual-article";
  article.innerHTML = doc.html;
  elements.content.innerHTML = "";
  elements.content.appendChild(article);
  wireInternalLinks(article);
  observeSections();
}

function render() {
  ensureValidActiveDoc();
  renderTopTabs();
  renderSideNav();
  renderContent();
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  render();
});

render();
