/* Royalty Desk partner kit: runs entirely in the browser. Free keyless AI (via ai-helper.js) drafts the
   one-pager and first message. The draft is saved only in localStorage. Nothing is sent to Royalty Desk. */
(function () {
  "use strict";
  var KEY = "royaltydesk.kit.v1";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("match-form"), kit = $("kit"), confirmEl = $("confirm"), btn = $("buildKit"), note = $("kitNote");
  var FIELDS = ["name", "stage", "product", "details", "ask", "link"];
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function val(id) { return ($(id).value || "").trim(); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function msg(text, tone) {
    confirmEl.className = "confirm show";
    var c = tone === "ok" ? ["rgba(61,214,198,0.35)", "rgba(61,214,198,0.1)", "#b8f5ec"] : ["rgba(255,180,84,0.45)", "rgba(255,180,84,0.1)", "#ffd9a0"];
    confirmEl.style.borderColor = c[0]; confirmEl.style.background = c[1]; confirmEl.style.color = c[2];
    confirmEl.textContent = text;
  }
  function keywords(product) {
    var stop = /^(a|an|the|for|and|or|of|to|with|that|my|our|seeking|royalty|odm|oem|partner|partners|joint|dev|deal|license|licensing|in|on|new|—|-)$/i;
    var w = product.split(/[^A-Za-z0-9\-]+/).filter(function (x) { return x && !stop.test(x); });
    return w.slice(0, 4).join(" ") || product.slice(0, 40);
  }
  function links(product) {
    var k = encodeURIComponent(keywords(product));
    return [
      ["Alibaba (verified manufacturers)", "https://www.alibaba.com/trade/search?SearchText=" + k + "&IndexArea=product_en"],
      ["Made-in-China.com", "https://www.made-in-china.com/products-search/hot-china-products/" + encodeURIComponent(keywords(product).replace(/\s+/g, "_")) + ".html"],
      ["Global Sources", "https://www.globalsources.com/searchList/products?keyWord=" + k],
      ["Google Patents (check prior art)", "https://patents.google.com/?q=" + k],
      ["USPTO trademark search", "https://tmsearch.uspto.gov/search/search-information"],
      ["China trademark office (CNIPA)", "https://sbj.cnipa.gov.cn/sbj/index.html"]
    ];
  }
  var CHECKLIST = [
    "Search Google Patents first so you know what already exists.",
    "If it's new, consider a US provisional patent application before you share anything detailed (talk to a registered patent attorney or agent).",
    "Register your brand as a trademark in China early. China is first-to-file, so whoever files first owns the name there.",
    "Share only this non-confidential one-pager in first contact. No CAD files, formulas, schematics or source code.",
    "Before any detail, sign an NNN agreement (non-disclosure, non-use, non-circumvention) written for China, in Chinese and English, enforceable in a Chinese court.",
    "Vet the factory: business licence on the official company registry, years trading, audit reports, real factory photos or video call, and samples you pay for.",
    "Royalty terms to settle in writing: rate (often 2–10% of the factory's wholesale price), minimum annual royalty, territory, exclusivity, term, audits, who owns improvements, and how the deal ends.",
    "Never pay into a personal bank account, and have counsel review before you sign."
  ];
  function prompt(d) {
    return "Product: " + d.product + "\nStage: " + d.stage + "\nWho it's for / why it's better: " + (d.details || "(not given)") +
      "\nPartnership ask: " + d.ask + "\nInventor or brand name: " + (d.name || "(leave as [Your name])") + (d.link ? "\nLink: " + d.link : "");
  }
  var SYS = "You help inventors approach overseas OEM/ODM factories for royalty or joint-development deals. Using ONLY the facts given (invent no numbers, specs, patents or customers; write [add …] where a fact is missing), write two things. First, a NON-CONFIDENTIAL one-page pitch in plain text with these headings: Product, The problem, Who buys it, Why it's better, Stage, What we're asking a partner for, What we bring, Next step. Keep it under 250 words, and reveal no inner workings. Second, a short first message (under 120 words) to a factory's sales team. It should be polite and clear, ask whether they take royalty or joint-development projects in this category, and offer to share more under an NNN agreement. Output exactly:\n===ONEPAGER===\n(one-pager)\n===MESSAGE===\n(message)";
  function split(r) {
    var a = r.split(/=+\s*ONE-?PAGER\s*=+/i), rest = a.length > 1 ? a[1] : r;
    var b = rest.split(/=+\s*MESSAGE\s*=+/i);
    return { one: (b[0] || "").trim(), msg: (b[1] || "").trim() };
  }
  function render(d) {
    var L = links(d.product);
    kit.hidden = false;
    kit.innerHTML =
      '<div class="kit-card"><h3>1 · Your one-pager (edit freely)</h3><textarea id="kOne">' + esc(d.one) + '</textarea>' +
      '<div class="kit-actions"><button class="btn btn-ghost" data-copy="kOne">Copy</button><button class="btn btn-ghost" data-dl="kOne">Download .txt</button><button class="btn btn-ghost" data-print="kOne">Print / PDF</button></div></div>' +
      '<div class="kit-card"><h3>2 · First message to a factory</h3><textarea id="kMsg" style="min-height:160px">' + esc(d.msg) + '</textarea>' +
      '<div class="kit-actions"><button class="btn btn-ghost" data-copy="kMsg">Copy</button></div><p class="form-note">Paste it into the supplier\'s "Contact supplier" form. You send it yourself.</p></div>' +
      '<div class="kit-card"><h3>3 · Find partners</h3><p class="form-note">Searches for “' + esc(keywords(d.product)) + '”. Look for listings that mention OEM/ODM and custom development, then ask about royalty terms.</p><div class="links">' +
      L.map(function (l) { return '<a class="btn btn-ghost" target="_blank" rel="noopener" href="' + l[1] + '">' + esc(l[0]) + ' ↗</a>'; }).join("") + '</div></div>' +
      '<div class="kit-card"><h3>4 · Protect first, then share</h3><ul>' + CHECKLIST.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") +
      '</ul><p class="form-note">General information, not legal advice.</p></div>' +
      '<div class="kit-actions"><button class="btn btn-ghost" id="kitAgain">↻ Redraft with free AI</button><button class="btn btn-ghost" id="kitClear">Clear my kit</button></div>';
    ["kOne", "kMsg"].forEach(function (id) { $(id).addEventListener("input", function () { d[id === "kOne" ? "one" : "msg"] = $(id).value; save(d); }); });
  }
  kit.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    if (t.dataset.copy) { var v = $(t.dataset.copy).value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { t.textContent = "Copied ✓"; setTimeout(function () { t.textContent = "Copy"; }, 1200); }, function () { $(t.dataset.copy).select(); }); }
    if (t.dataset.dl) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([$(t.dataset.dl).value], { type: "text/plain" })); a.download = "one-pager.txt"; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 300); }
    if (t.dataset.print) { var pa = document.createElement("div"); pa.id = "printArea"; pa.textContent = $(t.dataset.print).value; document.body.appendChild(pa); window.print(); setTimeout(function () { pa.remove(); }, 500); }
    if (t.id === "kitAgain") build();
    if (t.id === "kitClear") { if (confirm("Clear your saved kit from this browser?")) { localStorage.removeItem(KEY); kit.hidden = true; kit.innerHTML = ""; form.reset(); confirmEl.className = "confirm"; } }
  });
  var busy = false;
  async function build() {
    if (busy) return;
    var d = {}; FIELDS.forEach(function (f) { d[f] = val(f); });
    if (!d.product) { msg("Add a one-line description of your product first."); $("product").focus(); return; }
    if (!window.AIHelper) { msg("The free AI didn't load. Check your connection and reload the page."); return; }
    busy = true; btn.disabled = true; var old = btn.textContent; btn.textContent = "Drafting…";
    msg("Free AI is drafting your one-pager and first message…", "ok");
    try {
      var r = await AIHelper.ask(SYS, prompt(d), {
        onWait: function (s) { msg("Free AI answers 1 request every 30 seconds. Yours starts in " + s + " s…", "ok"); }
      });
      var p = split(r || "");
      if (!p.one) throw new Error("empty");
      d.one = p.one; d.msg = p.msg || ""; d.at = Date.now(); save(d); render(d);
      msg("Your partner kit is ready below. Edit anything, then copy or print it.", "ok");
      kit.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      msg("The free AI is busy right now. Please try again in a minute. Your search links and checklist are below.");
      d.one = d.one || ""; d.msg = d.msg || ""; render(d);
    }
    busy = false; btn.disabled = false; btn.textContent = old;
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); build(); });
  var prev = load();
  if (prev && prev.product) { FIELDS.forEach(function (f) { if (prev[f] != null && $(f)) $(f).value = prev[f]; }); if (prev.one) render(prev); }
})();
