const properties = window.AZA_PROPERTIES || [];
const whatsappButton = document.querySelector(".floating-whatsapp");
let whatsappNotificationPlayed = false;
let whatsappAudioContext = null;
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
      <img src="${property.image}" alt="">
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

function renderPublicPage() {
  const featuredCarousel = document.querySelector("#featured-carousel");
  const featuredList = document.querySelector("#featured-list");
  const propertyList = document.querySelector("#property-list");
  const filters = document.querySelector("#filters");
  const heroSearch = document.querySelector("#hero-search");
  const resultCount = document.querySelector("#result-count");
  if (!featuredList || !propertyList || !filters) return;

  fillSelects();

  const featured = properties.filter((property) => property.featured);
  featuredList.innerHTML = featured.map((property) => propertyCard(property, true)).join("");
  setupFeaturedCarousel(featuredCarousel, featuredList, featured.length);

  function renderList() {
    const filtered = applyFilters(properties, getFilters(filters));
    resultCount.textContent = `${filtered.length} imóveis encontrados`;
    propertyList.innerHTML = filtered.length
      ? filtered.map((property) => propertyCard(property)).join("")
      : '<div class="empty-state">Nenhum imóvel encontrado com esses filtros.</div>';
  }

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

  renderList();
}

function setupFeaturedCarousel(carousel, track, total) {
  if (!carousel || !track) return;

  const previousButton = carousel.querySelector("[data-featured-prev]");
  const nextButton = carousel.querySelector("[data-featured-next]");
  let current = 0;
  let timer = null;

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
    timer = window.setInterval(() => goTo(current + 1), 5200);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  previousButton?.addEventListener("click", () => {
    goTo(current - 1);
    start();
  });

  nextButton?.addEventListener("click", () => {
    goTo(current + 1);
    start();
  });

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);

  update();
  start();
}

renderPublicPage();
