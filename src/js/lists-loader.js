(() => {
  function isAbsolutePath(value) {
    return (
      !value ||
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("#") ||
      value.startsWith("mailto:")
    );
  }

  function normalizeLink(link, slug) {
    if (isAbsolutePath(link)) return link;
    if (link.startsWith(`${slug}/`)) return `/${link}`;
    return `/${slug}/${link}`;
  }

  function normalizeIcon(icon) {
    if (!icon) return "";
    if (/^bi-[\w-]+$/.test(icon)) return icon;
    if (isAbsolutePath(icon)) return icon;
    return `/${icon.replace(/^(\.\.\/)+/, "")}`;
  }

  function extractItems(config, slug) {
    return (config.sections || []).flatMap((section) =>
      (section.items || []).map((item) => ({
        title: item.title,
        description: item.description || "",
        icon: normalizeIcon(item.icon || ""),
        link: normalizeLink(item.link || "#", slug),
        target: item.target,
      })),
    );
  }

  const sources = window.INNER_LINKS_DATA || {};
  window.CARDS_DATA = Object.fromEntries(
    Object.entries(sources).map(([slug, config]) => [
      slug,
      extractItems(config, slug),
    ]),
  );
  document.dispatchEvent(
    new CustomEvent("cards-data-ready", { detail: window.CARDS_DATA }),
  );
  if (typeof window.tryRenderAll === "function") {
    window.tryRenderAll();
  }
  window.CARDS_DATA_READY = Promise.resolve(window.CARDS_DATA);
})();
