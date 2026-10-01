/* KR Luxury Nails — panel de administración
 *
 * - Inicio de sesión con Clerk (Google o correo). Las funciones de /api en Vercel
 *   verifican la sesión y que el correo esté en ADMIN_EMAILS.
 * - El catálogo y las fotos nuevas se guardan en Vercel Blob; los cambios se ven
 *   en la web al momento.
 */
(function () {
  "use strict";

  const CFG = window.KR_CONFIG;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let data = null;          // catálogo en edición
  const pending = {};       // id de foto → { base64, preview } aún sin subir
  const deletedUrls = new Set(); // fotos subidas a Blob que se quitaron del catálogo
  let dirty = false;
  let sortables = [];
  let entered = false;

  /* ---------------- utilidades ---------------- */
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }

  function setDirty(v = true) {
    dirty = v;
    const btn = $("#saveBtn");
    btn.disabled = !v;
    btn.textContent = v ? "Guardar ●" : "Guardar";
  }

  // Llama a /api con el token de sesión de Clerk.
  async function api(url, opts = {}) {
    const headers = opts.body ? { "Content-Type": "application/json" } : {};
    if (window.Clerk && Clerk.session) headers.Authorization = "Bearer " + (await Clerk.session.getToken());
    const res = await fetch(url, { ...opts, headers });
    if (!res.ok) {
      const err = new Error("API " + res.status);
      err.status = res.status;
      try { err.info = await res.json(); } catch (_) {}
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function imgSrc(item) {
    return pending[item.id] ? pending[item.id].preview : item.src;
  }

  /* ---------------- sesión ---------------- */
  async function loadCatalog() {
    data = await api("/api/catalog?fresh=" + Date.now());
    data.profile = data.profile || {};
    data.categories = data.categories || [];
  }

  function loginMessage(html) {
    $("#loginError").innerHTML = html;
  }

  async function enterPanel() {
    if (entered) return;
    loginMessage("Verificando…");
    try {
      await api("/api/me");
    } catch (ex) {
      if (ex.status === 403) {
        loginMessage(`La cuenta ${esc((ex.info && ex.info.email) || "")} no tiene permiso para administrar.
          <br><button class="btn btn-ghost" id="otherAccount" type="button">Usar otra cuenta</button>`);
        $("#otherAccount").onclick = async () => { await Clerk.signOut(); location.reload(); };
      } else {
        loginMessage(ex.info && ex.info.error ? esc(ex.info.error) : "No se pudo verificar la sesión. Inténtalo de nuevo.");
      }
      return;
    }
    entered = true;
    loginMessage("");
    await loadCatalog();
    showPanel();
  }

  async function logout() {
    if (dirty && !confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    dirty = false;
    try { await Clerk.signOut(); } catch (_) {}
    location.reload();
  }

  function loadClerk(cfg) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.dataset.clerkPublishableKey = cfg.clerkPublishableKey;
      s.src = `https://${cfg.clerkFrontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
      s.onload = async () => {
        try { await window.Clerk.load({ localization: CLERK_ES }); resolve(); } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error("Clerk no cargó"));
      document.head.appendChild(s);
    });
  }

  // Textos del recuadro de Clerk en español
  const CLERK_ES = {
    signIn: {
      start: { title: "Iniciar sesión", subtitle: "para administrar {{applicationName}}", actionText: "¿No tienes cuenta?", actionLink: "Regístrate" },
      password: { title: "Escribe tu contraseña", actionLink: "Usar otro método" },
    },
    socialButtonsBlockButton: "Continuar con {{provider|titleize}}",
    dividerText: "o",
    formFieldLabel__emailAddress: "Correo electrónico",
    formFieldLabel__password: "Contraseña",
    formFieldInputPlaceholder__emailAddress: "Escribe tu correo",
    formButtonPrimary: "Continuar",
    footerActionLink__useAnotherMethod: "Usar otro método",
  };

  function showLogin() {
    $("#panelView").hidden = true;
    $("#loginView").hidden = false;
    Clerk.mountSignIn($("#clerkSignIn"), {
      routing: "virtual",
      fallbackRedirectUrl: location.href,
      signUpFallbackRedirectUrl: location.href,
      appearance: {
        variables: { colorPrimary: "#6e3446", borderRadius: "14px", fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "17px" },
      },
    });
    // Cuando termina el inicio de sesión (sin recargar), entramos al panel.
    Clerk.addListener(({ user }) => { if (user && !entered) enterPanel(); });
  }

  function showPanel() {
    $("#loginView").hidden = true;
    $("#panelView").hidden = false;
    renderCatalog();
    renderProfile();
    setDirty(false);
  }

  /* ---------------- catálogo ---------------- */
  function renderCatalog() {
    sortables.forEach((s) => s.destroy());
    sortables = [];

    const wrap = $("#categories");
    wrap.innerHTML = data.categories.map((c) => `
      <article class="cat-card" data-cat="${esc(c.id)}">
        <div class="cat-head">
          <span class="cat-drag" title="Arrastrar categoría">⋮⋮</span>
          <button class="cat-name" data-edit-cat="${esc(c.id)}">${esc(c.name)}</button>
          <span class="cat-count">${c.items.length}</span>
          <button class="cat-edit" data-edit-cat="${esc(c.id)}">Editar</button>
        </div>
        <div class="thumbs" data-cat="${esc(c.id)}">
          ${c.items.map((it) => `
            <div class="thumb" data-id="${esc(it.id)}">
              <img src="${esc(imgSrc(it))}" alt="">
              ${pending[it.id] ? '<span class="badge">nueva</span>' : ""}
              ${it.title ? `<span class="t">${esc(it.title)}</span>` : ""}
            </div>`).join("")}
          <button class="add-tile" data-add="${esc(c.id)}"><span>＋</span>Fotos</button>
        </div>
      </article>`).join("") || '<p class="tip">Aún no hay categorías. Crea la primera ✨</p>';

    // Arrastrar categorías
    sortables.push(new Sortable(wrap, {
      handle: ".cat-drag",
      draggable: ".cat-card",
      animation: 200,
      onEnd: syncFromDom,
    }));

    // Arrastrar fotos dentro y entre categorías
    wrap.querySelectorAll(".thumbs").forEach((el) => {
      sortables.push(new Sortable(el, {
        group: "photos",
        draggable: ".thumb",
        filter: ".add-tile",
        animation: 200,
        delay: 180,
        delayOnTouchOnly: true,
        fallbackTolerance: 4,
        scroll: true,
        bubbleScroll: true,
        onMove: (evt) => !evt.related.classList.contains("add-tile") || evt.willInsertAfter === false,
        onEnd: syncFromDom,
      }));
    });
  }

  // Reconstruye el orden de categorías y fotos a partir de lo que se ve en pantalla.
  function syncFromDom() {
    const byCat = Object.fromEntries(data.categories.map((c) => [c.id, c]));
    const byItem = {};
    data.categories.forEach((c) => c.items.forEach((it) => (byItem[it.id] = it)));

    // Mantener el botón "+ Fotos" siempre al final
    document.querySelectorAll(".thumbs").forEach((el) => {
      const add = el.querySelector(".add-tile");
      if (add && el.lastElementChild !== add) el.appendChild(add);
    });

    data.categories = [...document.querySelectorAll(".cat-card")].map((card) => {
      const c = byCat[card.dataset.cat];
      c.items = [...card.querySelectorAll(".thumb")].map((t) => byItem[t.dataset.id]).filter(Boolean);
      return c;
    });
    setDirty();
    // Se redibuja después de que Sortable termine su animación
    setTimeout(renderCatalog, 0);
  }

  function findItem(id) {
    for (const c of data.categories) {
      const i = c.items.findIndex((it) => it.id === id);
      if (i > -1) return { cat: c, index: i, item: c.items[i] };
    }
    return null;
  }

  function removeItem(id) {
    const f = findItem(id);
    if (!f) return;
    f.cat.items.splice(f.index, 1);
    if (pending[id]) delete pending[id];
    else if (/^https:\/\//.test(f.item.src)) deletedUrls.add(f.item.src);
  }

  /* ---------------- hoja inferior ---------------- */
  function openSheet(html, onReady) {
    $("#sheetBody").innerHTML = html;
    $("#sheet").hidden = false;
    document.body.style.overflow = "hidden";
    onReady && onReady($("#sheetBody"));
  }
  function closeSheet() {
    $("#sheet").hidden = true;
    document.body.style.overflow = "";
  }
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });

  function editCategory(id) {
    const isNew = !id;
    const c = isNew ? { id: uid("cat-"), name: "", description: "", items: [] } : data.categories.find((x) => x.id === id);
    openSheet(`
      <h2>${isNew ? "Nueva categoría" : "Editar categoría"}</h2>
      <form id="catForm">
        <label>Nombre<input name="name" value="${esc(c.name)}" placeholder="Ej. Acrílicas" required maxlength="40"></label>
        <label>Descripción (opcional)<textarea name="description" placeholder="Una frase corta que la describa">${esc(c.description)}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? "" : '<button type="button" class="btn btn-danger" id="delCat">Eliminar</button>'}
          <button type="submit" class="btn btn-primary">${isNew ? "Crear" : "Listo"}</button>
        </div>
      </form>`, (root) => {
      const form = root.querySelector("#catForm");
      if (isNew) setTimeout(() => form.name.focus(), 50);
      form.onsubmit = (e) => {
        e.preventDefault();
        c.name = form.name.value.trim();
        c.description = form.description.value.trim();
        if (!c.name) return;
        if (isNew) data.categories.push(c);
        setDirty();
        closeSheet();
        renderCatalog();
        if (isNew) document.querySelector(`.cat-card[data-cat="${c.id}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
      };
      const del = root.querySelector("#delCat");
      if (del) del.onclick = () => {
        const n = c.items.length;
        if (!confirm(n ? `Se eliminará "${c.name}" y sus ${n} foto(s). ¿Continuar?` : `¿Eliminar "${c.name}"?`)) return;
        [...c.items].forEach((it) => removeItem(it.id));
        data.categories = data.categories.filter((x) => x !== c);
        setDirty();
        closeSheet();
        renderCatalog();
      };
    });
  }

  function editPhoto(id) {
    const f = findItem(id);
    if (!f) return;
    const it = f.item;
    const options = data.categories.map((c) => `<option value="${esc(c.id)}" ${c === f.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    openSheet(`
      <h2>Editar foto</h2>
      <div class="preview"><img src="${esc(imgSrc(it))}" alt=""></div>
      <form id="photoForm">
        <label>Nombre del diseño (opcional)<input name="title" value="${esc(it.title)}" maxlength="50" placeholder="Ej. Francés con brillo"></label>
        <label>Precio (opcional)<input name="price" value="${esc(it.price)}" maxlength="20" placeholder="Ej. $30"></label>
        <label>Categoría<select name="cat">${options}</select></label>
        <div class="sheet-actions">
          <button type="button" class="btn btn-danger" id="delPhoto">Eliminar</button>
          <button type="submit" class="btn btn-primary">Listo</button>
        </div>
      </form>`, (root) => {
      const form = root.querySelector("#photoForm");
      const img = root.querySelector(".preview img");
      form.onsubmit = (e) => {
        e.preventDefault();
        it.title = form.title.value.trim();
        it.price = form.price.value.trim();
        if (form.cat.value !== f.cat.id) {
          f.cat.items.splice(f.index, 1);
          data.categories.find((c) => c.id === form.cat.value).items.push(it);
        }
        setDirty();
        closeSheet();
        renderCatalog();
      };
      root.querySelector("#delPhoto").onclick = () => {
        if (!confirm("¿Eliminar esta foto?")) return;
        removeItem(id);
        setDirty();
        closeSheet();
        renderCatalog();
      };
    });
  }

  /* ---------------- subir fotos ---------------- */
  let uploadTarget = null;

  // Reduce la foto a máx. 1600px y la convierte a JPG para que cargue rápido en el móvil.
  function compress(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ preview: dataUrl, base64: dataUrl.split(",")[1] });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen no válida")); };
      img.src = url;
    });
  }

  $("#fileInput").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    const cat = data.categories.find((c) => c.id === uploadTarget);
    if (!cat || !files.length) return;
    toast(`Preparando ${files.length} foto(s)…`);
    let ok = 0;
    for (const file of files) {
      try {
        const id = uid("p");
        pending[id] = await compress(file);
        cat.items.push({ id, src: `${CFG.imagesDir}/${id}.jpg`, title: "", price: "" });
        ok++;
      } catch (_) { /* se ignora el archivo que no es imagen */ }
    }
    if (ok) {
      setDirty();
      renderCatalog();
      toast(`${ok} foto(s) agregada(s). No olvides Guardar.`);
    } else {
      toast("No se pudo leer la imagen.");
    }
  });

  /* ---------------- perfil ---------------- */
  function renderProfile() {
    const p = data.profile;
    p.services = p.services || [];
    p.hours = p.hours || [];
    const field = (key, label, attrs = "", hint = "") =>
      `<label>${label}<input name="${key}" value="${esc(p[key])}" ${attrs}>${hint ? `<span class="hint">${hint}</span>` : ""}</label>`;

    $("#profileForm").innerHTML = `
      <fieldset>
        <legend>Tu marca</legend>
        ${field("name", "Nombre del negocio")}
        ${field("tagline", "Frase de bienvenida")}
        <label>Sobre mí<textarea name="about">${esc(p.about)}</textarea></label>
      </fieldset>

      <fieldset>
        <legend>Contacto</legend>
        ${field("whatsapp", "WhatsApp", 'inputmode="tel"', "Con código de país, solo números. Ej. 50761234567")}
        ${field("whatsappMessage", "Mensaje automático de WhatsApp")}
        ${field("instagram", "Instagram", "", "Solo el usuario, sin @")}
        ${field("phone", "Teléfono (opcional)", 'inputmode="tel"')}
      </fieldset>

      <fieldset>
        <legend>Ubicación</legend>
        ${field("address", "Dirección")}
        ${field("mapsQuery", "Búsqueda en Google Maps", "", "Nombre del local + ciudad, o coordenadas (ej. 8.9824,-79.5199)")}
        <label>Horario (una línea por día)<textarea name="hours">${esc(p.hours.join("\n"))}</textarea></label>
      </fieldset>

      <fieldset>
        <legend>Servicios</legend>
        <div id="svcList">${p.services.map((s, i) => svcRow(s, i)).join("")}</div>
        <button type="button" class="add-row" id="addSvc">＋ Agregar servicio</button>
      </fieldset>`;
  }

  function svcRow(s, i) {
    return `<div class="svc-row" data-i="${i}">
      <input data-svc="name" value="${esc(s.name)}" placeholder="Servicio">
      <input data-svc="price" value="${esc(s.price)}" placeholder="Precio">
      <button type="button" class="svc-del" data-del-svc="${i}" aria-label="Quitar">×</button>
    </div>`;
  }

  $("#profileForm").addEventListener("input", (e) => {
    const t = e.target;
    const p = data.profile;
    if (t.dataset.svc) {
      const i = +t.closest(".svc-row").dataset.i;
      p.services[i][t.dataset.svc] = t.value;
    } else if (t.name === "hours") {
      p.hours = t.value.split("\n").map((l) => l.trim()).filter(Boolean);
    } else if (t.name) {
      p[t.name] = t.value;
    }
    setDirty();
  });

  $("#profileForm").addEventListener("click", (e) => {
    const p = data.profile;
    if (e.target.id === "addSvc") {
      p.services.push({ name: "", price: "" });
      renderProfile();
      const rows = document.querySelectorAll(".svc-row");
      rows[rows.length - 1].querySelector("input").focus();
      setDirty();
    }
    if (e.target.dataset.delSvc != null) {
      p.services.splice(+e.target.dataset.delSvc, 1);
      renderProfile();
      setDirty();
    }
  });

  /* ---------------- guardar ---------------- */
  async function save() {
    const btn = $("#saveBtn");
    btn.disabled = true;
    try {
      // 1. Subir fotos nuevas que siguen en el catálogo
      const used = new Set();
      data.categories.forEach((c) => c.items.forEach((it) => used.add(it.id)));
      const uploads = Object.keys(pending).filter((id) => used.has(id));
      for (let i = 0; i < uploads.length; i++) {
        const id = uploads[i];
        btn.textContent = `Subiendo ${i + 1}/${uploads.length}…`;
        const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ name: id, base64: pending[id].base64 }) });
        findItem(id).item.src = url;
        delete pending[id];
      }

      // 2. Guardar el catálogo (y borrar las fotos que se quitaron)
      btn.textContent = "Guardando…";
      await api("/api/catalog", { method: "POST", body: JSON.stringify({ catalog: data, deleted: [...deletedUrls] }) });
      deletedUrls.clear();

      setDirty(false);
      renderCatalog();
      toast("¡Guardado! Ya está en la web ✨", 4000);
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Guardar ●";
      if (err.status === 401 || err.status === 403) toast("Tu sesión expiró. Vuelve a iniciar sesión.", 4000);
      else toast("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.", 4000);
    }
  }

  /* ---------------- eventos ---------------- */
  $("#saveBtn").addEventListener("click", save);
  $("#logoutBtn").addEventListener("click", logout);
  $("#addCatBtn").addEventListener("click", () => editCategory(null));

  $("#categories").addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { uploadTarget = add.dataset.add; $("#fileInput").click(); return; }
    const ec = e.target.closest("[data-edit-cat]");
    if (ec) { editCategory(ec.dataset.editCat); return; }
    const th = e.target.closest(".thumb");
    if (th) editPhoto(th.dataset.id);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      $("#tab-catalog").hidden = tab.dataset.tab !== "catalog";
      $("#tab-profile").hidden = tab.dataset.tab !== "profile";
    });
  });

  window.addEventListener("beforeunload", (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------------- inicio ---------------- */
  (async function init() {
    try {
      const cfg = await api("/api/config");
      if (!cfg.clerkPublishableKey) {
        $("#loginView").hidden = false;
        loginMessage("Falta conectar Clerk al proyecto en Vercel.");
        return;
      }
      await loadClerk(cfg);
    } catch (_) {
      $("#loginView").hidden = false;
      loginMessage("No se pudo cargar el inicio de sesión. Revisa tu conexión.");
      return;
    }
    if (Clerk.user) {
      $("#loginView").hidden = false;
      await enterPanel();
    } else {
      showLogin();
    }
  })();
})();
