// Configuración del repositorio donde se guarda el catálogo.
// El panel de administración guarda los cambios directamente aquí.
window.KR_CONFIG = {
  owner: "saverio1993",
  repo: "KR-LUXURY-NAILS",
  branch: "claude/happy-davinci-nakljr",
  catalogPath: "data/catalog.json",
  imagesDir: "images/catalog"
};

// Tipos de letra que se pueden elegir desde el panel (Google Fonts).
// "spec" es lo que va en la URL de Google Fonts para esa familia.
window.KR_FONTS = {
  script: [
    { name: "Great Vibes", spec: "Great+Vibes" },
    { name: "Pinyon Script", spec: "Pinyon+Script" },
    { name: "Allura", spec: "Allura" },
    { name: "Parisienne", spec: "Parisienne" },
    { name: "Alex Brush", spec: "Alex+Brush" },
    { name: "Italianno", spec: "Italianno" },
    { name: "Tangerine", spec: "Tangerine:wght@400;700" },
    { name: "Petit Formal Script", spec: "Petit+Formal+Script" },
    { name: "Dancing Script", spec: "Dancing+Script:wght@400;600" },
    { name: "Playfair Display", spec: "Playfair+Display:ital,wght@0,400;1,400" },
  ],
  body: [
    { name: "Cormorant Garamond", spec: "Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,500;1,600" },
    { name: "EB Garamond", spec: "EB+Garamond:ital,wght@0,400;0,600;1,400;1,600" },
    { name: "Playfair Display", spec: "Playfair+Display:ital,wght@0,400;0,600;1,400;1,600" },
    { name: "Lora", spec: "Lora:ital,wght@0,400;0,600;1,400;1,600" },
    { name: "Libre Baskerville", spec: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
    { name: "Josefin Sans", spec: "Josefin+Sans:ital,wght@0,400;0,600;1,400;1,600" },
    { name: "Montserrat", spec: "Montserrat:ital,wght@0,400;0,600;1,400;1,600" },
    { name: "Poppins", spec: "Poppins:ital,wght@0,400;0,600;1,400;1,600" },
  ],
  defaults: { scriptFont: "Great Vibes", bodyFont: "Cormorant Garamond", bodyItalic: true },
};

// Carga las letras elegidas y las aplica a la página.
window.krApplyTheme = function (theme) {
  const F = window.KR_FONTS;
  const t = Object.assign({}, F.defaults, theme || {});
  const script = F.script.find((f) => f.name === t.scriptFont) || F.script[0];
  const body = F.body.find((f) => f.name === t.bodyFont) || F.body[0];
  const href = "https://fonts.googleapis.com/css2?family=" + script.spec + "&family=" + body.spec + "&display=swap";
  let link = document.getElementById("kr-theme-fonts");
  if (!link) {
    link = document.createElement("link");
    link.id = "kr-theme-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
  const root = document.documentElement.style;
  root.setProperty("--script", `"${script.name}", "Great Vibes", cursive`);
  root.setProperty("--serif", `"${body.name}", Georgia, serif`);
  root.setProperty("--body-style", t.bodyItalic === false ? "normal" : "italic");
};
