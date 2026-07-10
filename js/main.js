const storedProperties = JSON.parse(localStorage.getItem("azaProperties") || "[]");
const properties = [...(window.AZA_PROPERTIES || []), ...storedProperties];
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

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
  const featuredList = document.querySelector("#featured-list");
  const propertyList = document.querySelector("#property-list");
  const filters = document.querySelector("#filters");
  const heroSearch = document.querySelector("#hero-search");
  const resultCount = document.querySelector("#result-count");
  if (!featuredList || !propertyList || !filters) return;

  fillSelects();

  const featured = properties.filter((property) => property.featured).slice(0, 2);
  featuredList.innerHTML = featured.map((property) => propertyCard(property, true)).join("");

  function renderList() {
    const filtered = applyFilters(properties, getFilters(filters));
    resultCount.textContent = `${filtered.length} imoveis encontrados`;
    propertyList.innerHTML = filtered.length
      ? filtered.map((property) => propertyCard(property)).join("")
      : '<div class="empty-state">Nenhum imovel encontrado com esses filtros.</div>';
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

function adminPropertyFromForm(form) {
  const data = new FormData(form);
  return {
    id: data.get("id"),
    title: data.get("title"),
    purpose: data.get("purpose"),
    type: data.get("type"),
    city: data.get("city"),
    neighborhood: data.get("neighborhood"),
    price: Number(data.get("price") || 0),
    area: Number(data.get("area") || 0),
    bedrooms: Number(data.get("bedrooms") || 0),
    suites: Number(data.get("suites") || 0),
    bathrooms: Number(data.get("bathrooms") || 0),
    parking: Number(data.get("parking") || 0),
    image: data.get("image"),
    description: data.get("description"),
    featured: data.get("featured") === "on",
  };
}

function renderAdminPage() {
  const form = document.querySelector("#property-form");
  const preview = document.querySelector("#admin-preview-card");
  const clearButton = document.querySelector("#clear-local");
  if (!form || !preview) return;

  function updatePreview() {
    preview.innerHTML = propertyCard(adminPropertyFromForm(form));
  }

  form.addEventListener("input", updatePreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const property = adminPropertyFromForm(form);
    const saved = JSON.parse(localStorage.getItem("azaProperties") || "[]");
    const next = saved.filter((item) => item.id !== property.id);
    next.push(property);
    localStorage.setItem("azaProperties", JSON.stringify(next));
    alert("Imovel salvo no prototipo local.");
  });

  clearButton.addEventListener("click", () => {
    localStorage.removeItem("azaProperties");
    alert("Imoveis locais removidos.");
  });

  form.elements.id.value = `AZA-${Math.floor(Math.random() * 800 + 100)}`;
  form.elements.title.value = "Casa com acabamento premium";
  form.elements.city.value = "Piumhi";
  form.elements.neighborhood.value = "Centro";
  form.elements.price.value = "650000";
  form.elements.area.value = "180";
  form.elements.description.value = "Imovel com excelente apresentacao, ambientes bem distribuidos e documentacao pronta para negociacao.";
  updatePreview();
}

renderPublicPage();
renderAdminPage();
