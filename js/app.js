/* KR Luxury Nails — página pública */
(function () {
  "use strict";

  const ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 18-8-8 18-2-8-8-2Z"/></svg>'
  };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (name) => {
    const words = (name || "KR").split(/\s+/).filter(Boolean);
    if (words[0].length <= 3 && words[0] === words[0].toUpperCase()) return words[0];
    return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  };

  function waLink(p) {
    const num = String(p.whatsapp || "").replace(/\D/g, "");
    if (!num) return "";
    return "https://wa.me/" + num + (p.whatsappMessage ? "?text=" + encodeURIComponent(p.whatsappMessage) : "");
  }

  let DATA = null;
  let homeScroll = 0;

  const isCatalog = () => location.hash.replace("#", "").startsWith("catalogo");

  function photoFigure(it, catName) {
    return `
        <figure class="photo" data-id="${esc(it.id)}">
          <img src="${esc(it.src)}" alt="${esc(it.title || catName)}" loading="lazy">
          ${it.title || it.price ? `<figcaption class="cap">${it.price ? `<b>${esc(it.price)}</b>` : ""}${esc(it.title)}</figcaption>` : ""}
        </figure>`;
  }

  // Inicio: información de la estilista (sin el catálogo completo)
  function renderHome(data) {
    const p = data.profile || {};
    const cats = data.categories || [];
    const wa = waLink(p);
    const ig = p.instagram ? "https://instagram.com/" + String(p.instagram).replace(/^@/, "") : "";
    const mapQ = encodeURIComponent(p.mapsQuery || p.address || "");
    const total = cats.reduce((n, c) => n + (c.items || []).length, 0);
    // Una foto de cada categoría para la vista previa
    const preview = cats.map((c) => (c.items || [])[0]).filter(Boolean).slice(0, 3);

    const services = (p.services || []).map((s) => `
      <div class="service"><span class="name">${esc(s.name)}</span><span class="dots"></span><span class="price">${esc(s.price)}</span></div>`).join("");

    const hours = (p.hours || []).map(esc).join("<br>");

    return `
      <header class="hero">
        <div class="monogram"><span>${esc(initials(p.name))}</span></div>
        <h1>${esc(p.name)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <div class="hero-actions">
          ${wa ? `<a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">${ICONS.whatsapp} Reservar cita</a>` : ""}
          <a class="btn btn-ghost" href="#catalogo">Ver catálogo</a>
        </div>
      </header>

      <section class="section reveal" id="sobre-mi">
        <h2 class="section-title">Sobre mí</h2>
        <div class="about-photo">
          ${p.photo
            ? `<img src="${esc(p.photo)}" alt="${esc(p.stylistName || p.name)}">`
            : `<span class="about-photo-empty">${esc(initials(p.name))}</span>`}
        </div>
        ${p.stylistName ? `<p class="stylist-name">${esc(p.stylistName)}</p>` : ""}
        ${p.about ? `<div class="about-card">${esc(p.about)}</div>` : ""}
      </section>

      ${preview.length ? `
      <section class="section reveal" id="disenos">
        <h2 class="section-title">Mis diseños</h2>
        <a class="teaser" href="#catalogo" aria-label="Ver catálogo completo">
          <div class="teaser-grid">${preview.map((it) => `<img src="${esc(it.src)}" alt="" loading="lazy">`).join("")}</div>
          <span class="btn btn-primary">Ver catálogo completo${total ? ` · ${total} fotos` : ""}</span>
        </a>
      </section>` : ""}

      ${services ? `
      <section class="section reveal" id="servicios">
        <h2 class="section-title">Servicios</h2>
        <div class="services">${services}</div>
      </section>` : ""}

      <section class="section reveal" id="ubicacion">
        <h2 class="section-title">Ubicación</h2>
        <div class="info-card">
          ${mapQ ? `<iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa" src="https://maps.google.com/maps?q=${mapQ}&z=16&output=embed"></iframe>` : ""}
          <div class="info-body">
            ${p.address ? `<div class="info-row"><span class="ic">${ICONS.pin}</span><div><small>Dirección</small>${esc(p.address)}</div></div>` : ""}
            ${hours ? `<div class="info-row"><span class="ic">${ICONS.clock}</span><div><small>Horario</small>${hours}</div></div>` : ""}
            ${p.phone ? `<div class="info-row"><span class="ic">${ICONS.phone}</span><div><small>Teléfono</small><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></div></div>` : ""}
            ${mapQ ? `<a class="btn btn-primary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${mapQ}">${ICONS.route} Cómo llegar</a>` : ""}
          </div>
        </div>
      </section>

      <section class="section reveal" id="contacto">
        <h2 class="section-title">Reserva tu cita</h2>
        <p class="section-sub">Escríbeme y separa tu espacio</p>
        <div class="contact">
          ${wa ? `<a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">${ICONS.whatsapp} WhatsApp</a>` : ""}
          ${ig ? `<a class="btn btn-ghost" href="${ig}" target="_blank" rel="noopener">${ICONS.instagram} Instagram</a>` : ""}
        </div>
      </section>

      ${footer(p)}
      ${wa ? `<a class="fab" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONS.whatsapp}</a>` : ""}
    `;
  }

  // Catálogo: pantalla aparte con todas las fotos y los botones de categorías
  function renderCatalog(data) {
    const p = data.profile || {};
    const cats = data.categories || [];
    const wa = waLink(p);

    const nav = cats.map((c) => `<li><button type="button" data-target="${esc(c.id)}">${esc(c.name)}</button></li>`).join("");
    const catalog = cats.map((c) => `
        <div class="category" id="${esc(c.id)}">
          <h3>${esc(c.name)}</h3>
          ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ""}
          <div class="gallery">${(c.items || []).map((it) => photoFigure(it, c.name)).join("") || '<div class="empty-cat">Muy pronto nuevos diseños ✨</div>'}</div>
        </div>`).join("");

    return `
      <div class="catalog-top">
        <a class="back-home" href="#" aria-label="Volver al inicio">‹ Inicio</a>
        <span class="catalog-title">Catálogo</span>
        <span class="back-home-spacer"></span>
      </div>
      ${cats.length ? `<nav class="cat-nav"><ul>${nav}</ul></nav>` : ""}
      <section class="section catalog-page">
        <p class="section-sub">Toca una foto para verla en grande</p>
        ${catalog}
      </section>
      ${footer(p)}
      ${wa ? `<a class="fab" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONS.whatsapp}</a>` : ""}
    `;
  }

  function footer(p) {
    return `
      <footer class="footer">
        <span class="script">${esc(p.name)}</span>
        © ${new Date().getFullYear()} · Hecho con amor
        <br><a class="admin-link" href="admin.html">✦ Administrar</a>
      </footer>`;
  }

  function route() {
    if (!DATA) return;
    const p = DATA.profile || {};
    const catalog = isCatalog();
    document.title = (catalog ? "Catálogo · " : "") + (p.name || "KR Luxury Nails");
    document.getElementById("app").innerHTML = catalog ? renderCatalog(DATA) : renderHome(DATA);
    setupReveal();
    if (catalog) {
      window.scrollTo(0, 0);
      setupCategoryButtons();
      setupNavSpy();
      setupLightbox(DATA.categories || []);
    } else {
      window.scrollTo(0, homeScroll);
    }
  }

  window.addEventListener("hashchange", route);
  // Recordar dónde estaba en el inicio para volver al mismo lugar
  window.addEventListener("scroll", () => { if (!isCatalog()) homeScroll = window.scrollY; }, { passive: true });

  function setupCategoryButtons() {
    document.querySelectorAll(".cat-nav button").forEach((b) => {
      b.addEventListener("click", () => {
        const el = document.getElementById(b.dataset.target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  function setupNavSpy() {
    const links = [...document.querySelectorAll(".cat-nav button")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const byId = Object.fromEntries(links.map((a) => [a.dataset.target, a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const a = byId[e.target.id];
        if (!a || a.classList.contains("active")) return;
        links.forEach((l) => l.classList.remove("active"));
        a.classList.add("active");
        // Solo se desplaza la barra de categorías de lado; nunca la página.
        const ul = a.closest("ul");
        ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".category").forEach((c) => io.observe(c));
  }

  const lightbox = { all: [], idx: 0, ready: false };

  function setupLightbox(cats) {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lbImg");
    const cap = document.getElementById("lbCap");
    const count = document.getElementById("lbCount");
    lightbox.all = [];
    cats.forEach((c) => (c.items || []).forEach((it) => lightbox.all.push({ ...it, cat: c.name })));

    function show(i) {
      const all = lightbox.all;
      lightbox.idx = (i + all.length) % all.length;
      const it = all[lightbox.idx];
      img.src = it.src;
      img.alt = it.title || it.cat;
      cap.innerHTML = `${it.price ? `<b>${esc(it.price)}</b>` : ""}${esc(it.title || it.cat)}`;
      count.textContent = `${lightbox.idx + 1} / ${all.length}`;
    }
    function open(i) { show(i); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
    function close() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

    document.querySelectorAll(".photo").forEach((el) => {
      el.addEventListener("click", () => open(lightbox.all.findIndex((x) => x.id === el.dataset.id)));
    });
    if (lightbox.ready) return;
    lightbox.ready = true;
    document.getElementById("lbClose").onclick = close;
    document.getElementById("lbPrev").onclick = (e) => { e.stopPropagation(); show(lightbox.idx - 1); };
    document.getElementById("lbNext").onclick = (e) => { e.stopPropagation(); show(lightbox.idx + 1); };
    lb.onclick = (e) => { if (e.target === lb) close(); };
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(lightbox.idx - 1);
      if (e.key === "ArrowRight") show(lightbox.idx + 1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(lightbox.idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // En Vercel el catálogo viene de /api/catalog (lo que guarda el panel);
  // si no está disponible (por ejemplo en GitHub Pages) se usa el archivo del repositorio.
  const getJson = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  getJson("/api/catalog")
    .catch(() => getJson(window.KR_CONFIG.catalogPath + "?v=" + Date.now()))
    .then((data) => { DATA = data; route(); })
    .catch(() => {
      document.getElementById("app").innerHTML = '<div class="loading"><span class="script">Ups…</span>No se pudo cargar el catálogo.</div>';
    });
})();
