/* =========================================================
   Academic Site Script
   Funzioni:
   - menu mobile
   - dark mode con salvataggio preferenza
   - anno automatico nel footer
   - caricamento pubblicazioni da JSON
   - featured publications
   - ricerca e filtri
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  setupThemeToggle();
  setCurrentYear();
  loadPublications();
});

/* =========================================================
   MENU MOBILE
========================================================= */
function setupMobileNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================================================
   DARK MODE
========================================================= */
function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleText = document.querySelector(".theme-toggle-text");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeIcon(true, themeToggleText);
  } else {
    updateThemeIcon(false, themeToggleText);
  }

  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcon(isDark, themeToggleText);
  });
}

function updateThemeIcon(isDark, targetElement) {
  if (!targetElement) return;
  targetElement.textContent = isDark ? "☀️" : "🌙";
}

/* =========================================================
   FOOTER YEAR
========================================================= */
function setCurrentYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/* =========================================================
   PUBLICATIONS DATA LOADING
========================================================= */
async function loadPublications() {
  const publicationsList = document.getElementById("publications-list");
  const featuredList = document.getElementById("featured-publications-list");
  const searchInput = document.getElementById("publication-search");
  const yearFilter = document.getElementById("year-filter");
  const topicFilter = document.getElementById("topic-filter");

  if (!publicationsList || !featuredList || !searchInput || !yearFilter || !topicFilter) {
    return;
  }

  try {
    const response = await fetch("data/publications.json");

    if (!response.ok) {
      throw new Error(`Errore nel caricamento del file JSON: ${response.status}`);
    }

    const publications = await response.json();

    if (!Array.isArray(publications)) {
      throw new Error("Il file publications.json non contiene un array valido.");
    }

    populateYearFilter(publications, yearFilter);
    populateTopicFilter(publications, topicFilter);
    renderFeaturedPublications(publications, featuredList);

    const renderAll = () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      const selectedYear = yearFilter.value;
      const selectedTopic = topicFilter.value;

      const filtered = publications.filter((pub) => {
        const matchesSearch = matchesPublicationSearch(pub, searchTerm);
        const matchesYear = selectedYear === "all" || String(pub.year) === selectedYear;
        const matchesTopic =
          selectedTopic === "all" ||
          (Array.isArray(pub.topics) &&
            pub.topics.some((topic) => topic.toLowerCase() === selectedTopic.toLowerCase()));

        return matchesSearch && matchesYear && matchesTopic;
      });

      renderPublications(filtered, publicationsList);
    };

    searchInput.addEventListener("input", renderAll);
    yearFilter.addEventListener("change", renderAll);
    topicFilter.addEventListener("change", renderAll);

    renderAll();
  } catch (error) {
    console.error(error);
    publicationsList.innerHTML = `
      <div class="publication-empty">
        Unable to load publications at the moment.
      </div>
    `;
    featuredList.innerHTML = "";
  }
}

/* =========================================================
   FILTER HELPERS
========================================================= */
function populateYearFilter(publications, yearFilterElement) {
  const years = [...new Set(publications.map((pub) => pub.year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));

  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearFilterElement.appendChild(option);
  });
}

function populateTopicFilter(publications, topicFilterElement) {
  const topics = [
    ...new Set(
      publications
        .flatMap((pub) => (Array.isArray(pub.topics) ? pub.topics : []))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilterElement.appendChild(option);
  });
}

function matchesPublicationSearch(publication, searchTerm) {
  if (!searchTerm) return true;

  const searchableFields = [
    publication.title,
    publication.authors,
    publication.journal,
    publication.abstract,
    publication.year,
    ...(Array.isArray(publication.topics) ? publication.topics : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableFields.includes(searchTerm);
}

/* =========================================================
   FEATURED PUBLICATIONS
========================================================= */
function renderFeaturedPublications(publications, container) {
  const featured = publications.filter((pub) => pub.featured);

  if (!featured.length) {
    container.innerHTML = `
      <div class="featured-item">
        <p class="meta">No featured publications selected</p>
        <p>Add "featured": true to one or more entries in publications.json.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = featured
    .map(
      (pub) => `
        <article class="featured-item">
          <p class="meta">${escapeHtml(pub.journal || "Journal")} • ${escapeHtml(String(pub.year || ""))}</p>
          <h4>${escapeHtml(pub.title || "Untitled publication")}</h4>
          <p>${escapeHtml(truncateText(pub.abstract || "", 150))}</p>
        </article>
      `
    )
    .join("");
}

/* =========================================================
   PUBLICATION RENDERING
========================================================= */
function renderPublications(publications, container) {
  if (!publications.length) {
    container.innerHTML = `
      <div class="publication-empty">
        No publications match the selected filters.
      </div>
    `;
    return;
  }

  container.innerHTML = publications
    .map((pub) => createPublicationCard(pub))
    .join("");
}

function createPublicationCard(publication) {
  const title = escapeHtml(publication.title || "Untitled publication");
  const authors = escapeHtml(publication.authors || "Authors not available");
  const journal = escapeHtml(publication.journal || "Journal not available");
  const year = escapeHtml(String(publication.year || ""));
  const abstract = escapeHtml(publication.abstract || "Abstract not available.");
  const doi = publication.doi ? escapeHtml(publication.doi) : "";
  const image = publication.image ? escapeHtml(publication.image) : "";
  const imageAlt = publication.imageAlt
    ? escapeHtml(publication.imageAlt)
    : `Representative figure for ${title}`;

  const topicsHtml = Array.isArray(publication.topics)
    ? publication.topics
        .map((topic) => `<span class="publication-tag">${escapeHtml(topic)}</span>`)
        .join("")
    : "";

  const linksHtml = createPublicationLinks(publication);

  const mediaHtml = image
    ? `
      <img
        class="publication-figure"
        src="${image}"
        alt="${imageAlt}"
        loading="lazy"
      />
    `
    : `
      <div class="publication-placeholder" aria-label="Representative figure placeholder">
        <span>Representative figure</span>
      </div>
    `;

  return `
    <article class="publication-card">
      <div class="publication-content">
        <h3 class="publication-title">${title}</h3>
        <p class="publication-authors"><strong>Authors:</strong> ${authors}</p>
        <p class="publication-journal"><strong>${journal}</strong>${year ? `, ${year}` : ""}</p>
        ${
          doi
            ? `<p class="publication-journal"><strong>DOI:</strong> <a href="https://doi.org/${doi}" target="_blank" rel="noopener noreferrer">${doi}</a></p>`
            : ""
        }
        <p class="publication-abstract">${abstract}</p>
        ${topicsHtml ? `<div class="publication-tags">${topicsHtml}</div>` : ""}
        ${linksHtml ? `<div class="publication-links">${linksHtml}</div>` : ""}
      </div>

      <div class="publication-media">
        ${mediaHtml}
      </div>
    </article>
  `;
}

function createPublicationLinks(publication) {
  const links = [];

  if (publication.link) {
    links.push(
      `<a class="publication-link" href="${escapeAttribute(publication.link)}" target="_blank" rel="noopener noreferrer">Article</a>`
    );
  }

  if (publication.pdf) {
    links.push(
      `<a class="publication-link" href="${escapeAttribute(publication.pdf)}" target="_blank" rel="noopener noreferrer">PDF</a>`
    );
  }

  if (publication.pubmed) {
    links.push(
      `<a class="publication-link" href="${escapeAttribute(publication.pubmed)}" target="_blank" rel="noopener noreferrer">PubMed</a>`
    );
  }

  if (publication.scholar) {
    links.push(
      `<a class="publication-link" href="${escapeAttribute(publication.scholar)}" target="_blank" rel="noopener noreferrer">Scholar</a>`
    );
  }

  if (publication.supplementary) {
    links.push(
      `<a class="publication-link" href="${escapeAttribute(publication.supplementary)}" target="_blank" rel="noopener noreferrer">Supplementary</a>`
    );
  }

  return links.join("");
}

/* =========================================================
   UTILITIES
========================================================= */
function truncateText(text, maxLength) {
  if (typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
