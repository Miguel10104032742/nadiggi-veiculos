/* ===== CONFIGURAÇÃO — preencher antes de publicar ===== */
const CONFIG = {
  phone: "551938822220",
  whatsapp: "",            // Ex.: "5519999999999" — só após confirmar que o número usa WhatsApp
  hours: [],               // Ex.: ["Segunda a sexta: 8h às 18h"] — confirmar com a loja
  rating: "4,6", reviews: 176, // informados pela loja (Google Maps) — conferir antes de publicar
  address: "Rua Campinas, 901 - Kalmann, Cosmópolis - SP, 13150-580",
};

const $ = (s) => document.querySelector(s);
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maxFractionDigits: 0 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
let vehicles = [];

/* ---------- contato ---------- */
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + enc("Nadiggi Veículos " + CONFIG.address);
function wppUrl(text) { return CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${enc(text)}` : ""; }
function contactBtn(text, cls = "btn btn-line") {
  const u = wppUrl(text);
  return u ? `<a class="${cls}" href="${u}" target="_blank" rel="noopener">Consultar no WhatsApp</a>`
           : `<a class="${cls}" href="tel:+${CONFIG.phone}">Ligar para a loja</a>`;
}
function setupStatic() {
  $("#mapLink").href = mapsUrl;
  $("#reviewsLink").href = mapsUrl;
  $("#rating").textContent = CONFIG.rating;
  $("#rcount").textContent = CONFIG.reviews;
  $("#year").textContent = new Date().getFullYear();
  if (CONFIG.whatsapp) { const w = $("#wppLink"); w.hidden = false; w.href = wppUrl("Olá! Gostaria de falar com a equipe da Nadiggi Veículos."); }
  if (CONFIG.hours.length) { const h = $("#hours"); h.hidden = false; h.innerHTML = CONFIG.hours.map((x) => `<li>${esc(x)}</li>`).join(""); }
}

/* ---------- menu e cabeçalho ---------- */
const hdr = $("#hdr"), nav = $("#nav"), burger = $("#burger");
const onScroll = () => hdr.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
function toggleMenu(open) {
  nav.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  hdr.classList.toggle("open-m", open);
}
burger.addEventListener("click", () => toggleMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) toggleMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });

/* ---------- filtros ---------- */
const F = { marca: $("#f-marca"), modelo: $("#f-modelo"), ano: $("#f-ano"), min: $("#f-min"), max: $("#f-max"),
            q: $("#f-q"), comb: $("#f-comb"), camb: $("#f-camb"), sort: $("#f-sort") };

function fillSelect(sel, values, numeric) {
  const uniq = [...new Set(values.filter(Boolean))].sort((a, b) => numeric ? b - a : String(a).localeCompare(String(b), "pt-BR"));
  sel.innerHTML = sel.options[0].outerHTML + uniq.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}

function filtered() {
  const q = norm(F.q.value), mod = norm(F.modelo.value);
  const min = parseFloat(F.min.value), max = parseFloat(F.max.value);
  let list = vehicles.filter((v) =>
    (!F.marca.value || v.marca === F.marca.value) &&
    (!mod || norm(v.modelo).includes(mod)) &&
    (!F.ano.value || String(v.anoModelo ?? v.anoFab) === F.ano.value) &&
    (!F.comb.value || v.combustivel === F.comb.value) &&
    (!F.camb.value || v.cambio === F.camb.value) &&
    (isNaN(min) || v.preco >= min) && (isNaN(max) || v.preco <= max) &&
    (!q || norm([v.marca, v.modelo, v.cor, v.combustivel, v.cambio, v.descricao].join(" ")).includes(q)));
  const s = F.sort.value;
  if (s === "menor") list.sort((a, b) => a.preco - b.preco);
  if (s === "maior") list.sort((a, b) => b.preco - a.preco);
  if (s === "ano") list.sort((a, b) => (b.anoModelo ?? b.anoFab) - (a.anoModelo ?? a.anoFab));
  return list;
}

function card(v, i) {
  const title = `${v.marca} ${v.modelo}`;
  const yr = v.anoFab && v.anoModelo ? `${v.anoFab}/${v.anoModelo}` : (v.anoModelo ?? v.anoFab ?? "");
  const specs = [v.km != null && `${v.km.toLocaleString("pt-BR")} km`, v.cambio, v.combustivel].filter(Boolean);
  const msg = `Olá! Gostaria de obter mais informações sobre o veículo ${title}. Ele ainda está disponível?`;
  return `<article class="card" style="animation-delay:${Math.min(i, 8) * 50}ms">
    <div class="ph"><img src="${esc(v.fotos?.[0] ?? "")}" width="640" height="480" loading="lazy" alt="${esc(title)} ${esc(yr)}"></div>
    <div class="bd"><div><h3>${esc(title)}</h3><p class="yr">${esc(yr)}</p></div>
    <ul class="specs">${specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <div class="price">${v.preco != null ? brl(v.preco) : "Consulte"}</div>
    <div class="row"><button class="btn btn-red" data-id="${esc(v.id)}">Ver detalhes</button>${contactBtn(msg)}</div></div></article>`;
}

function render() {
  const list = filtered(), grid = $("#grid"), empty = $("#empty");
  grid.innerHTML = list.map(card).join("");
  const none = !list.length;
  grid.hidden = none; empty.hidden = !none;
  $("#count").textContent = vehicles.length ? `${list.length} ${list.length === 1 ? "veículo encontrado" : "veículos encontrados"}` : "";
  if (none) {
    const noStock = !vehicles.length;
    empty.innerHTML = `<h3>${noStock ? "Estoque em atualização" : "Nenhum veículo encontrado"}</h3>
      <p>${noStock ? "Entre em contato com a nossa equipe para consultar as opções disponíveis." : "Tente ajustar ou limpar os filtros, ou fale com a equipe para consultar outras opções."}</p>
      <div class="row" style="justify-content:center">${contactBtn("Olá! Gostaria de consultar os veículos disponíveis na Nadiggi.", "btn btn-red")}${noStock ? "" : '<button class="btn btn-line" id="clear2">Limpar filtros</button>'}</div>`;
    $("#clear2")?.addEventListener("click", clearAll);
  }
}

function clearAll() { $("#filters").reset(); render(); }
$("#filters").addEventListener("submit", (e) => { e.preventDefault(); render(); $("#veiculos").scrollIntoView(); });
$("#filters").addEventListener("input", () => render());
$("#clear").addEventListener("click", clearAll);

/* ---------- detalhes ---------- */
const dlg = $("#dlg");
function openDetail(id) {
  const v = vehicles.find((x) => String(x.id) === String(id)); if (!v) return;
  const title = `${v.marca} ${v.modelo}`, fotos = v.fotos?.length ? v.fotos : [""];
  const yr = v.anoFab && v.anoModelo ? `${v.anoFab}/${v.anoModelo}` : (v.anoModelo ?? v.anoFab);
  const rows = [["Ano", yr], ["Quilometragem", v.km != null && v.km.toLocaleString("pt-BR") + " km"], ["Combustível", v.combustivel], ["Câmbio", v.cambio], ["Cor", v.cor]]
    .filter((r) => r[1]).map((r) => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("");
  const msg = `Olá! Gostaria de obter mais informações sobre o veículo ${title}. Ele ainda está disponível?`;
  dlg.innerHTML = `<button class="close" aria-label="Fechar">×</button><div class="dt">
    <div class="gal"><img class="main" id="gmain" src="${esc(fotos[0])}" alt="${esc(title)}, foto 1">
    ${fotos.length > 1 ? `<div class="thumbs">${fotos.map((f, i) => `<button data-i="${i}" aria-label="Foto ${i + 1}" ${i ? "" : 'aria-current="true"'}><img src="${esc(f)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}</div>
    <div><h2 id="d-title">${esc(title)}</h2><p class="price">${v.preco != null ? brl(v.preco) : "Consulte"}</p><dl>${rows}</dl>
    ${v.descricao ? `<p>${esc(v.descricao)}</p>` : ""}
    ${v.opcionais?.length ? `<ul class="specs">${v.opcionais.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
    <div class="row" style="margin-top:20px">${contactBtn(msg, "btn btn-red")}<a class="btn btn-line" href="tel:+${CONFIG.phone}">Ligar</a></div></div></div>`;
  dlg.showModal();
  history.replaceState(null, "", "#veiculo-" + v.id);
  dlg.querySelector(".thumbs")?.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const i = +b.dataset.i; $("#gmain").src = fotos[i]; $("#gmain").alt = `${title}, foto ${i + 1}`;
    dlg.querySelectorAll(".thumbs button").forEach((x) => x.removeAttribute("aria-current")); b.setAttribute("aria-current", "true");
  });
}
$("#grid").addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) openDetail(b.dataset.id); });
dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest(".close")) dlg.close(); });
dlg.addEventListener("close", () => { if (location.hash.startsWith("#veiculo-")) history.replaceState(null, "", "#veiculos"); });

/* ---------- animação de entrada ---------- */
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: .12 }) : null;
document.querySelectorAll(".rv").forEach((el) => io ? io.observe(el) : el.classList.add("on"));

/* ---------- inicialização ---------- */
async function init() {
  setupStatic();
  try {
    const r = await fetch("data/vehicles.json");
    if (!r.ok) throw new Error(r.status);
    vehicles = await r.json();
  } catch (err) {
    console.warn("Não foi possível carregar o estoque:", err);
    vehicles = [];
  }
  fillSelect(F.marca, vehicles.map((v) => v.marca));
  fillSelect(F.ano, vehicles.map((v) => v.anoModelo ?? v.anoFab), true);
  fillSelect(F.comb, vehicles.map((v) => v.combustivel));
  fillSelect(F.camb, vehicles.map((v) => v.cambio));
  render();
  const m = location.hash.match(/^#veiculo-(.+)$/); if (m) openDetail(decodeURIComponent(m[1]));
}
init();
