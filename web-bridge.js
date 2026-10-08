// Мост для мобильной версии (iPhone, Safari): та же форма API, что у preload.js
// в программе для компьютера, но записи хранятся в IndexedDB этого телефона.
(function () {
  "use strict";
  const DB_NAME = "dnevnik-bar", STORE = "docs";
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, mode);
      const s = t.objectStore(STORE);
      let out;
      Promise.resolve(fn(s)).then((v) => { out = v; });
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error("Запись не сохранилась"));
    });
  }
  function getAll() {
    return tx("readonly", (s) => new Promise((res) => {
      const out = {};
      const c = s.openCursor();
      c.onsuccess = () => {
        const cur = c.result;
        if (cur) { out[cur.key] = cur.value; cur.continue(); } else res(out);
      };
    }));
  }
  const put = (id, data) => tx("readwrite", (s) => { s.put(data, id); return true; });
  const replaceAll = (obj) => tx("readwrite", (s) => {
    s.clear();
    for (const [k, v] of Object.entries(obj || {})) s.put(v, k);
    return true;
  });

  // Просим браузер не удалять данные при нехватке места.
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  const MIME = { json: "application/json", csv: "text/csv", txt: "text/plain", pdf: "application/pdf" };
  async function saveFile(filename, text) {
    const ext = filename.split(".").pop();
    const file = new File([text], filename, { type: (MIME[ext] || "application/octet-stream") + ";charset=utf-8" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return { status: "saved" }; }
      catch (e) { if (e && e.name === "AbortError") return { status: "canceled" }; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return { status: "saved" };
  }

  function openJSON() {
    return new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = ".json,application/json";
      inp.style.display = "none";
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        inp.remove();
        if (!f) return res(null);
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => res(null);
        r.readAsText(f);
      };
      document.body.appendChild(inp);
      inp.click();
    });
  }

  // PDF: отчёт печатается из скрытого фрейма; в окне печати iPhone
  // нажмите «Поделиться» → «Сохранить в Файлы», чтобы получить PDF.
  function savePDF(_filename, html) {
    return new Promise((res, rej) => {
      const old = document.getElementById("printFrame");
      if (old) old.remove();
      const f = document.createElement("iframe");
      f.id = "printFrame";
      f.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";
      f.srcdoc = String(html).split("%FONTBASE%").join(new URL("fonts", location.href).href);
      f.onload = async () => {
        try {
          await f.contentDocument.fonts.ready;
          f.contentWindow.focus();
          f.contentWindow.print();
          res({ status: "printed" });
        } catch (e) { rej(e); }
      };
      document.body.appendChild(f);
    });
  }

  const PREFS_KEY = "bar-diary-web-prefs";
  function readPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch (e) { return {}; } }

  window.diary = {
    isWeb: true,
    version: "1.1.0",
    getAll, put, replaceAll, saveFile, openJSON, savePDF,
    copy: (text) => navigator.clipboard.writeText(String(text)),
    openDataFolder: () => Promise.resolve(),
    getPrefs: async () => ({ theme: readPrefs().theme || "system" }),
    setPrefs: async (p) => {
      const cur = readPrefs();
      if (p && ["system", "light", "dark"].includes(p.theme)) cur.theme = p.theme;
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(cur)); } catch (e) {}
      return { theme: cur.theme || "system" };
    },
    testReminder: async () => false,
  };

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
