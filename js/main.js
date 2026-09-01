let properties = [];
const whatsappButton = document.querySelector(".floating-whatsapp");
const propertyMediaModal = document.querySelector("#property-media-modal");
const propertyMediaTitle = document.querySelector("#property-media-title");
const propertyMediaImage = document.querySelector("#property-media-image");
const propertyMediaVideo = document.querySelector("#property-media-video");
const propertyMediaCaption = document.querySelector("#property-media-caption");
const propertyMediaThumbs = document.querySelector("#property-media-thumbs");
let whatsappNotificationPlayed = false;
let whatsappAudioContext = null;
let publicPageEventsBound = false;
let activePropertyMedia = [];
let activePropertyMediaIndex = 0;
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getWhatsappAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!whatsappAudioContext || whatsappAudioContext.state === "closed") {
    whatsappAudioContext = new AudioContext();
  }

  return whatsappAudioContext;
}

function playWhatsappNotification() {
  if (whatsappNotificationPlayed) return;

  const audioContext = getWhatsappAudioContext();
  if (!audioContext || audioContext.state === "suspended") return;

  whatsappNotificationPlayed = true;

  const now = audioContext.currentTime;
  const notes = [
    { frequency: 880, start: 0, duration: .08 },
    { frequency: 1175, start: .11, duration: .12 },
  ];

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
    gain.gain.setValueAtTime(0, now + note.start);
    gain.gain.linearRampToValueAtTime(.055, now + note.start + .01);
    gain.gain.exponentialRampToValueAtTime(.001, now + note.start + note.duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + note.duration + .02);
  });

  window.setTimeout(() => audioContext.close(), 620);
}

function unlockWhatsappNotification() {
  const audioContext = getWhatsappAudioContext();
  if (!audioContext) return;

  audioContext.resume().then(() => {
    window.setTimeout(playWhatsappNotification, 3000);
  }).catch(() => {});
}

if (whatsappButton) {
  window.setTimeout(playWhatsappNotification, 3000);
  window.addEventListener("pointerdown", unlockWhatsappNotification, { once: true });
  window.addEventListener("keydown", unlockWhatsappNotification, { once: true });
}

function propertyCard(property, featured = false) {
  const meta = [
    `${property.bedrooms || 0} quartos`,
    `${property.suites || 0} suites`,
    `${property.bathrooms || 0} banh.`,
    `${property.parking || 0} vagas`,
  ];

  return `
    <article class="property-card${featured ? " featured" : ""}">
      <div class="property-card-media">
        <img src="${property.image}" alt="${property.imageAlt || ""}">
        ${property.images.length ? `<button class="property-media-button" type="button" data-property-media="${property.uuid}">Ver fotos e vídeos <span>${property.images.length}</span></button>` : ""}
      </div>
      <div class="property-body">
        <div>
          <span class="property-code">${property.id}</span>
          <span class="property-purpose">${property.purpose}</span>
        </div>
        <h3>${property.title}</h3>
        <p class="location">${property.neighborhood} - ${property.city}/MG</p>
        <p class="price">${currency.format(Number(property.price || 0))}</p>
        <p>${property.description || ""}</p>
        <div class="property-meta">
          ${meta.map((item) => `<span>${item}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPropertyMedia(index) {
  if (!activePropertyMedia.length) return;

  activePropertyMediaIndex = (index + activePropertyMedia.length) % activePropertyMedia.length;
  const media = activePropertyMedia[activePropertyMediaIndex];
  propertyMediaVideo.pause();

  if (media.type === "video") {
    propertyMediaImage.classList.add("is-hidden");
    propertyMediaImage.removeAttribute("src");
    propertyMediaVideo.classList.remove("is-hidden");
    propertyMediaVideo.src = media.src;
    propertyMediaVideo.setAttribute("aria-label", media.alt || "Vídeo do imóvel");
  } else {
    propertyMediaVideo.classList.add("is-hidden");
    propertyMediaVideo.removeAttribute("src");
    propertyMediaVideo.load();
    propertyMediaImage.classList.remove("is-hidden");
    propertyMediaImage.src = media.src;
    propertyMediaImage.alt = media.alt || "";
  }

  propertyMediaCaption.textContent = media.caption || "";
  propertyMediaThumbs.querySelectorAll(".property-media-thumb").forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activePropertyMediaIndex);
  });
}

function openPropertyMedia(propertyId) {
  const property = properties.find((item) => item.uuid === propertyId);
  if (!property?.images.length || !propertyMediaModal) return;

  activePropertyMedia = property.images;
  activePropertyMediaIndex = 0;
  propertyMediaTitle.textContent = property.title;
  propertyMediaThumbs.innerHTML = "";

  activePropertyMedia.forEach((media, index) => {
    const button = document.createElement("button");
    button.className = "property-media-thumb";
    button.type = "button";
    button.setAttribute("aria-label", `Abrir ${media.type === "video" ? "vídeo" : "foto"} ${index + 1}`);
    button.innerHTML = media.type === "video"
      ? '<span class="property-video-thumb" aria-hidden="true">▶</span>'
      : `<img src="${media.src}" alt="">`;
    button.addEventListener("click", () => renderPropertyMedia(index));
    propertyMediaThumbs.appendChild(button);
  });

  propertyMediaModal.classList.add("is-open");
  propertyMediaModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  renderPropertyMedia(0);
  propertyMediaModal.querySelector(".property-media-close").focus();
}

function closePropertyMedia() {
  if (!propertyMediaModal) return;
  propertyMediaModal.classList.remove("is-open");
  propertyMediaModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  propertyMediaImage.removeAttribute("src");
  propertyMediaVideo.pause();
  propertyMediaVideo.removeAttribute("src");
  propertyMediaVideo.load();
  activePropertyMedia = [];
}

if (propertyMediaModal) {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-property-media]");
    if (trigger) openPropertyMedia(trigger.dataset.propertyMedia);
  });
  propertyMediaModal.querySelectorAll("[data-property-media-close]").forEach((button) => {
    button.addEventListener("click", closePropertyMedia);
  });
  propertyMediaModal.querySelector("[data-property-media-prev]").addEventListener("click", () => {
    renderPropertyMedia(activePropertyMediaIndex - 1);
  });
  propertyMediaModal.querySelector("[data-property-media-next]").addEventListener("click", () => {
    renderPropertyMedia(activePropertyMediaIndex + 1);
  });
  document.addEventListener("keydown", (event) => {
    if (!propertyMediaModal.classList.contains("is-open")) return;
    if (event.key === "Escape") closePropertyMedia();
    if (event.key === "ArrowLeft") renderPropertyMedia(activePropertyMediaIndex - 1);
    if (event.key === "ArrowRight") renderPropertyMedia(activePropertyMediaIndex + 1);
  });
}

function uniqueValues(key) {
  return [...new Set(properties.map((property) => property[key]).filter(Boolean))].sort();
}

function fillSelects() {
  document.querySelectorAll('select[name="city"]').forEach((select) => {
    const current = select.value;
    uniqueValues("city").forEach((city) => {
      if ([...select.options].some((option) => option.value === city)) return;
      select.add(new Option(city, city));
    });
    select.value = current;
  });

  document.querySelectorAll('select[name="type"]').forEach((select) => {
    const current = select.value;
    uniqueValues("type").forEach((type) => {
      if ([...select.options].some((option) => option.value === type)) return;
      select.add(new Option(type, type));
    });
    select.value = current;
  });
}

function getFilters(form) {
  const data = new FormData(form);
  return {
    purpose: data.get("purpose"),
    city: data.get("city"),
    type: data.get("type"),
    bedrooms: Number(data.get("bedrooms") || 0),
  };
}

function applyFilters(items, filters) {
  return items.filter((property) => {
    if (filters.purpose && property.purpose !== filters.purpose) return false;
    if (filters.city && property.city !== filters.city) return false;
    if (filters.type && property.type !== filters.type) return false;
    if (filters.bedrooms && Number(property.bedrooms || 0) < filters.bedrooms) return false;
    return true;
  });
}

function setLoadingState() {
  const featuredList = document.querySelector("#featured-list");
  const propertyList = document.querySelector("#property-list");
  const resultCount = document.querySelector("#result-count");

  if (featuredList) featuredList.innerHTML = '<div class="empty-state">Carregando imóveis em destaque...</div>';
  if (propertyList) propertyList.innerHTML = '<div class="empty-state">Carregando imóveis cadastrados...</div>';
  if (resultCount) resultCount.textContent = "";
}

function setErrorState(message) {
  const featuredList = document.querySelector("#featured-list");
  const propertyList = document.querySelector("#property-list");
  const details = message ? `<small>${message}</small>` : "";
  const html = `<div class="empty-state">Não foi possível carregar os imóveis agora. ${details}</div>`;

  if (featuredList) featuredList.innerHTML = html;
  if (propertyList) propertyList.innerHTML = html;
}

function clearDynamicOptions() {
  document.querySelectorAll('select[name="city"], select[name="type"]').forEach((select) => {
    const firstOption = select.options[0]?.cloneNode(true);
    select.innerHTML = "";
    if (firstOption) select.add(firstOption);
  });
}

function renderPublicPage() {
  const featuredCarousel = document.querySelector("#featured-carousel");
  const featuredList = document.querySelector("#featured-list");
  const propertyList = document.querySelector("#property-list");
  const filters = document.querySelector("#filters");
  const heroSearch = document.querySelector("#hero-search");
  const resultCount = document.querySelector("#result-count");
  if (!featuredList || !propertyList || !filters) return;

  clearDynamicOptions();
  fillSelects();

  const featured = properties.filter((property) => property.featured);
  featuredList.innerHTML = featured.length
    ? featured.map((property) => propertyCard(property, true)).join("")
    : '<div class="empty-state">Nenhum imóvel em destaque no momento.</div>';
  setupFeaturedCarousel(featuredCarousel, featuredList, featured.length);

  function renderList() {
    const filtered = applyFilters(properties, getFilters(filters));
    resultCount.textContent = `${filtered.length} imóveis encontrados`;
    propertyList.innerHTML = filtered.length
      ? filtered.map((property) => propertyCard(property)).join("")
      : '<div class="empty-state">Nenhum imóvel encontrado com esses filtros.</div>';
  }

  if (!publicPageEventsBound) {
    filters.addEventListener("input", renderList);
    filters.addEventListener("reset", () => window.setTimeout(renderList, 0));
    heroSearch.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(heroSearch);
      filters.elements.purpose.value = data.get("purpose");
      filters.elements.city.value = data.get("city");
      filters.elements.type.value = data.get("type");
      document.querySelector("#lista").scrollIntoView({ behavior: "smooth" });
      renderList();
    });
    publicPageEventsBound = true;
  }

  renderList();
}

function setupFeaturedCarousel(carousel, track, total) {
  if (!carousel || !track) return;

  let previousButton = carousel.querySelector("[data-featured-prev]");
  let nextButton = carousel.querySelector("[data-featured-next]");
  let current = 0;

  if (carousel._azaFeaturedTimer) {
    window.clearInterval(carousel._azaFeaturedTimer);
    carousel._azaFeaturedTimer = null;
  }

  if (previousButton) {
    const cleanButton = previousButton.cloneNode(true);
    previousButton.replaceWith(cleanButton);
    previousButton = cleanButton;
  }

  if (nextButton) {
    const cleanButton = nextButton.cloneNode(true);
    nextButton.replaceWith(cleanButton);
    nextButton = cleanButton;
  }

  carousel.classList.toggle("is-single", total <= 1);

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
  }

  function goTo(nextIndex) {
    if (total <= 1) return;
    current = (nextIndex + total) % total;
    update();
  }

  function start() {
    if (total <= 1) return;
    stop();
    carousel._azaFeaturedTimer = window.setInterval(() => goTo(current + 1), 5200);
  }

  function stop() {
    if (!carousel._azaFeaturedTimer) return;
    window.clearInterval(carousel._azaFeaturedTimer);
    carousel._azaFeaturedTimer = null;
  }

  previousButton?.addEventListener("click", () => {
    goTo(current - 1);
    start();
  });

  nextButton?.addEventListener("click", () => {
    goTo(current + 1);
    start();
  });

  update();
  start();
}

async function initPublicPage(options = {}) {
  if (!options.silent) setLoadingState();

  try {
    properties = await window.AZA_DATA.loadPublishedProperties();
    renderPublicPage();
  } catch (error) {
    setErrorState(error.message);
  }
}

initPublicPage();
window.setInterval(() => initPublicPage({ silent: true }), 45000);
window.addEventListener("focus", () => initPublicPage({ silent: true }));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) initPublicPage({ silent: true });
});
