const AZA_SUPABASE_URL = "https://ulwhmtpduzxjbkqrqesd.supabase.co";
const AZA_SUPABASE_KEY = "sb_publishable_LLQAnzzF3WFr1Ln5iWPIlw_dtWb3QPH";
const AZA_MEDIA_BUCKET = "aza-media";

async function supabaseGet(path) {
  const response = await fetch(`${AZA_SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: AZA_SUPABASE_KEY,
      Authorization: `Bearer ${AZA_SUPABASE_KEY}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro ${response.status}`);
  }

  return response.json();
}

function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${AZA_SUPABASE_URL}/storage/v1/object/public/${AZA_MEDIA_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function mediaType(media) {
  if (media?.media_type) return media.media_type;
  return /\.(mp4|webm|mov|m4v)(?:$|\?)/i.test(media?.image_url || "") ? "video" : "image";
}

function displayPurpose(value) {
  return {
    sale: "Venda",
    rent: "Locação",
  }[value] || value || "Venda";
}

function normalizeProperty(record, imagesByProperty) {
  const images = (imagesByProperty.get(record.id) || [])
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const photos = images.filter((media) => mediaType(media) === "image");
  const cover = photos.find((image) => image.is_cover) || photos[0];

  return {
    id: record.code || "",
    uuid: record.id,
    title: record.title || "Imóvel sem título",
    purpose: displayPurpose(record.purpose),
    type: record.property_type || "Imóvel",
    city: record.city || "",
    neighborhood: record.neighborhood || "",
    price: Number(record.price || 0),
    bedrooms: Number(record.bedrooms || 0),
    suites: Number(record.suites || 0),
    bathrooms: Number(record.bathrooms || 0),
    parking: Number(record.parking || 0),
    area: Number(record.area || 0),
    featured: Boolean(record.featured),
    image: mediaUrl(cover?.image_url) || "assets/images/hero-residencia.jpg",
    imageAlt: cover?.alt_text || record.title || "",
    images: images.map((image) => ({
      ...image,
      type: mediaType(image),
      src: mediaUrl(image.image_url),
      alt: image.alt_text || record.title || "",
      caption: image.alt_text || record.description || record.title || "",
    })),
    description: record.description || "",
    createdAt: record.created_at || "",
  };
}

async function loadPublishedProperties() {
  const [properties, images] = await Promise.all([
    supabaseGet("properties?status=eq.published&select=*&order=featured.desc,created_at.desc"),
    supabaseGet("properties_images?select=*&order=sort_order.asc,created_at.asc"),
  ]);

  const publishedIds = new Set(properties.map((property) => property.id));
  const imagesByProperty = new Map();

  images
    .filter((image) => publishedIds.has(image.property_id))
    .forEach((image) => {
      const list = imagesByProperty.get(image.property_id) || [];
      list.push(image);
      imagesByProperty.set(image.property_id, list);
    });

  return properties.map((property) => normalizeProperty(property, imagesByProperty));
}

window.AZA_DATA = {
  loadPublishedProperties,
  mediaUrl,
};
