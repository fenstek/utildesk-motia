type InventoryItem = {
  slug: string;
  title: string;
  category?: string | null;
  priceModel?: string | null;
  price_model?: string | null;
  tags?: string[];
  excerpt?: string;
  description?: string;
  iconUrl?: string | null;
  iconFallbacks?: string[];
  editorialImage?: string | null;
  editorialVerdict?: string | null;
  fallbackIcon?: string;
  addedAtMs?: number;
  addedAtOrderMs?: number;
  popularity?: number;
};

const grid = document.querySelector<HTMLElement>("#tools-grid[data-inventory-api]");

if (grid) {
  const endpoint = grid.dataset.inventoryApi || "/api/tools.json";
  const locale = grid.dataset.inventoryLocale === "en" ? "en" : "de";
  let loading: Promise<void> | null = null;

  const text = (value: unknown) => String(value ?? "");
  const letterFor = (title: string) => {
    const first = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().charAt(0).toUpperCase();
    return /^[A-Z]$/.test(first) ? first : "#";
  };
  const verdictFor = (item: InventoryItem, index: number) => {
    const value = item.editorialVerdict || ((index + 1) % 17 === 0 ? "reject" : (index + 1) % 11 === 0 ? "overrated" : (index + 1) % 7 === 0 ? "caution" : "recommend");
    const labels = locale === "en"
      ? { recommend: "Recommend", caution: "With caveats", overrated: "Overrated", reject: "Not recommended" }
      : { recommend: "Empfehlen", caution: "Mit Vorbehalt", overrated: "\u00dcberbewertet", reject: "Nicht empfehlen" };
    return { value, label: labels[value as keyof typeof labels] || labels.recommend };
  };
  const span = (className: string, value?: string) => {
    const node = document.createElement("span");
    node.className = className;
    if (value) node.textContent = value;
    return node;
  };
  const buildCard = (item: InventoryItem, index: number) => {
    const verdict = verdictFor(item, index);
    const category = text(item.category || (locale === "en" ? "Unsorted" : "Unsortiert"));
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const card = document.createElement("a");
    card.href = `${locale === "en" ? "/en" : ""}/tools/${encodeURIComponent(item.slug)}/`;
    card.className = `card tool-card inv-row inv-row-verdict-${verdict.value}${item.editorialImage ? " has-editorial-art" : ""}`;
    Object.assign(card.dataset, {
      title: text(item.title).toLowerCase(), slug: text(item.slug).toLowerCase(),
      tags: tags.map((tag) => text(tag).toLowerCase()).join(","), category: category.toLowerCase(),
      verdict: verdict.value, letter: letterFor(text(item.title)), added: text(item.addedAtMs || 0),
      addedOrder: text(item.addedAtOrderMs || 0), popularity: text(item.popularity || 0),
    });

    if (item.editorialImage) {
      const art = span("inv-row-art"); art.setAttribute("aria-hidden", "true");
      const img = document.createElement("img"); img.src = item.editorialImage; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      art.append(img); card.append(art);
    }
    card.append(span("inv-row-no", String(index + 1).padStart(3, "0")));
    const header = document.createElement("div"); header.className = "tool-header";
    const image = document.createElement("div"); image.className = "tool-image";
    const logo = span("tool-card-logo");
    if (item.iconUrl) {
      const img = document.createElement("img"); img.src = item.iconUrl; img.alt = text(item.title); img.loading = "lazy";
      if (item.iconFallbacks?.length) img.dataset.fallbackSrcs = JSON.stringify(item.iconFallbacks);
      logo.append(img);
    } else {
      logo.classList.add("inv-row-monogram"); logo.textContent = text(item.title).replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "#";
    }
    image.append(logo);
    const info = document.createElement("div"); info.className = "tool-info";
    const title = document.createElement("h3"); title.className = "tool-title"; title.textContent = text(item.title);
    const description = document.createElement("p"); description.className = "tools-desc"; description.textContent = text(item.excerpt || item.description || (locale === "en" ? "Short description coming soon." : "Kurzbeschreibung folgt."));
    info.append(title, description); header.append(image, info); card.append(header);
    const verdictNode = span("inv-row-verdict"); const strong = document.createElement("strong"); strong.textContent = verdict.label; verdictNode.append(strong); card.append(verdictNode);
    const tagNode = span("inv-row-tags"); tags.slice(0, 3).forEach((tag) => tagNode.append(span("inv-row-tag", `#${tag}`))); card.append(tagNode);
    const meta = document.createElement("div"); meta.className = "tool-badges inv-row-meta";
    meta.append(span("badge badge-category inv-row-cat", category));
    const price = text(item.priceModel || item.price_model); if (price) meta.append(span("badge badge-price inv-row-price", price)); card.append(meta);
    card.append(span("inv-row-open", locale === "en" ? "Open" : "\u00d6ffnen"));
    return card;
  };
  const loadInventory = () => {
    if (loading) return loading;
    loading = fetch(endpoint, { headers: { Accept: "application/json" } })
      .then((response) => { if (!response.ok) throw new Error(`Inventory ${response.status}`); return response.json(); })
      .then((payload) => {
        const existing = new Set(Array.from(grid.querySelectorAll<HTMLElement>(".tool-card")).map((card) => card.dataset.slug));
        (payload.items || []).forEach((item: InventoryItem, index: number) => { if (!existing.has(item.slug)) grid.append(buildCard(item, index)); });
        window.dispatchEvent(new CustomEvent("utildesk:inventory-ready"));
      })
      .catch((error) => { console.warn("Utildesk inventory could not be expanded", error); });
    return loading;
  };

  const needsFullInventory = new URLSearchParams(window.location.search).toString().length > 0;
  if (needsFullInventory) void loadInventory();
  document.addEventListener("input", (event) => { if ((event.target as HTMLElement)?.id === "search-input") void loadInventory(); }, true);
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("#load-more-btn, [data-filter-type], [data-jump-letter]")) void loadInventory();
  }, true);
  document.addEventListener("change", (event) => { if ((event.target as HTMLElement)?.id === "sort-select") void loadInventory(); }, true);
}
