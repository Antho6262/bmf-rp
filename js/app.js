// ============================================================
// BMF — Black Mafia Family — Logique applicative
// ============================================================

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",   href: "pages/dashboard.html",   icon: "grid" },
  { id: "tracker",     label: "Tracker",     href: "pages/tracker.html",     icon: "target" },
  { id: "taxes",       label: "Taxes",       href: "pages/taxes.html",       icon: "coin" },
  { id: "paye",        label: "Paye",        href: "pages/paye.html",        icon: "cash" },
  { id: "blanchiment", label: "Blanchiment", href: "pages/blanchiment.html", icon: "wash" },
  { id: "radio",       label: "Radio",       href: "pages/radio.html",       icon: "radio" },
  { id: "profil",      label: "Profil",      href: "pages/profil.html",      icon: "user" },
  { id: "tv",          label: "Mode TV",     href: "pages/tv.html",          icon: "tv" },
];

const ICONS = {
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5-1.3 2-3 2-3 .8-3 2.3 1.3 2.7 3 2.7 3-1 3-2.5"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v.01M18 14v.01"/>',
  wash: '<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3"/><path d="M8 3h8"/>',
  radio: '<circle cx="7" cy="16" r="1.5"/><path d="M3 16h18v5H3zM7 12a5 5 0 1 1 10 0M4.5 9.5a9 9 0 0 1 15 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="1"/><path d="M8 21h8M12 17v4"/>',
  admin: '<path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"/>',
};

function svgIcon(name, cls = "nav-icon") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

// ---------- SESSION ----------
function getSession() {
  try { return JSON.parse(sessionStorage.getItem("bmf_session") || "null"); }
  catch { return null; }
}
function setSession(membre) {
  sessionStorage.setItem("bmf_session", JSON.stringify(membre));
}
function clearSession() {
  sessionStorage.removeItem("bmf_session");
}
async function requireSession() {
  await authReady;
  const s = getSession();
  if (!s) {
    const here = location.pathname.includes("/pages/") ? "../index.html" : "index.html";
    location.href = here;
    return null;
  }
  // Revalide contre la base (actif, rôle, grade à jour)
  const snap = await db.ref("membres/" + s.id).get();
  if (!snap.exists() || snap.val().actif === false) {
    clearSession();
    const here = location.pathname.includes("/pages/") ? "../index.html" : "index.html";
    location.href = here;
    return null;
  }
  const fresh = { id: s.id, ...snap.val() };
  setSession(fresh);
  return fresh;
}

// ---------- AUDIT ----------
function logAudit(action, details) {
  const s = getSession();
  db.ref("audit").push({
    action,
    details: details || "",
    membre: s ? `${s.prenom} ${s.nom}` : "?",
    membre_id: s ? s.id : "?",
    createdAt: Date.now(),
  });
}

// ---------- SHELL / NAVIGATION ----------
async function initShell(activePage) {
  const s = await requireSession();
  if (!s) return null;

  const isRoot = !location.pathname.includes("/pages/");
  const prefix = isRoot ? "" : "../";

  const [permSnap, visSnap] = await Promise.all([
    db.ref("permissions").get(),
    db.ref("visibilite").get(),
  ]);
  const permissions = permSnap.val() || {};
  const visibilite = visSnap.val() || {};

  const peutVoir = (pageId) => {
    if (s.role === "admin") return true;
    const p1 = permissions[s.grade] ? permissions[s.grade][pageId] : undefined;
    const p2 = visibilite[s.grade] ? visibilite[s.grade][pageId] : undefined;
    // Par défaut visible tant que non explicitement désactivé
    return p1 !== false && p2 !== false;
  };

  const items = NAV_ITEMS.filter((it) => peutVoir(it.id));

  const shell = document.createElement("div");
  shell.className = "shell";
  shell.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <img src="${prefix}img/logo.png" alt="BMF" class="brand-logo" onerror="this.style.display='none'"/>
        <div class="brand-text">
          <span class="brand-name">BMF</span>
          <span class="brand-sub">Black Mafia Family</span>
        </div>
      </div>
      <nav class="nav-list">
        ${items.map(it => `
          <a href="${prefix}${it.href}" class="nav-item ${activePage === it.id ? "active" : ""}">
            ${svgIcon(it.icon)}<span>${it.label}</span>
          </a>`).join("")}
        ${s.role === "admin" ? `
          <a href="${prefix}admin.html" class="nav-item ${activePage === "admin" ? "active" : ""}">
            ${svgIcon("admin")}<span>Admin</span>
          </a>` : ""}
      </nav>
      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="user-avatar">${(s.prenom || "?")[0]}${(s.nom || "?")[0]}</div>
          <div class="user-meta">
            <span class="user-name">${s.prenom} ${s.nom}</span>
            <span class="user-grade">${s.grade || ""}</span>
          </div>
        </div>
        <button class="btn-ghost btn-logout" id="btnLogout">Déconnexion</button>
      </div>
    </aside>
    <main class="content" id="pageContent"></main>
  `;
  document.body.prepend(shell);
  document.getElementById("btnLogout").addEventListener("click", () => {
    clearSession();
    location.href = prefix + "index.html";
  });

  injectGlobalSearch(s, prefix);
  ensureSemaineAuto();
  setInterval(ensureSemaineAuto, 60000);

  return s;
}

// ---------- SEMAINES AUTOMATIQUES ----------
async function ensureSemaineAuto() {
  try {
    const semSnap = await db.ref("semaines").orderByChild("debut").get();
    const all = semSnap.val() || {};
    const ids = Object.keys(all);

    if (ids.length === 0) {
      const { debut, fin, verrouAt } = limitesSemaine();
      await creerSemaineAvecBornes(debut, fin, verrouAt);
      return;
    }

    // dernière semaine (par debut)
    let derniereId = ids[0];
    for (const id of ids) if (all[id].debut > all[derniereId].debut) derniereId = id;
    const derniere = all[derniereId];

    if (!derniere.bloquee && Date.now() >= derniere.verrouAt) {
      await verrouillerSemaineAuto(derniereId, derniere, true);
    }
  } catch (e) {
    console.error("ensureSemaineAuto", e);
  }
}

async function creerSemaineAvecBornes(debut, fin, verrouAt, manuel) {
  const lockRef = db.ref("semaine_index/" + debut);
  // Transaction anti-doublon : si le créneau est déjà pris, on abandonne (return undefined = abort)
  const res = await lockRef.transaction((cur) => (cur === null ? "LOCKED" : undefined));
  if (!res.committed) return null;
  const id = uid();
  const nom = nomSemaine(debut, fin);
  await db.ref("semaines/" + id).set({
    nom, bloquee: false, debut, fin, verrouAt, auto: !manuel, createdAt: Date.now(),
  });
  await lockRef.set(id);
  if (manuel) logAudit("Semaine créée", nom);
  return id;
}

async function creerSemaine() {
  const semSnap = await db.ref("semaines").orderByChild("debut").get();
  const all = semSnap.val() || {};
  const ids = Object.keys(all);
  let bornes;
  if (ids.length === 0) {
    bornes = limitesSemaine();
  } else {
    let derniereId = ids[0];
    for (const id of ids) if (all[id].debut > all[derniereId].debut) derniereId = id;
    bornes = prochainesBornes(all[derniereId]);
  }
  return creerSemaineAvecBornes(bornes.debut, bornes.fin, bornes.verrouAt, true);
}

async function genererResume(semaineId) {
  const actSnap = await db.ref("actions/" + semaineId).get();
  const actions = actSnap.val() || {};
  const membresSnap = await db.ref("membres").get();
  const membres = membresSnap.val() || {};

  let totalActions = 0, gainsSale = 0, gainsPropre = 0;
  const parMembre = {};
  Object.values(actions).forEach((a) => {
    if (a.resultat !== "Réussite") return;
    totalActions++;
    gainsSale += Number(a.montant_sale) || 0;
    gainsPropre += Number(a.montant_propre) || 0;
    const total = (Number(a.montant_sale) || 0) + (Number(a.montant_propre) || 0);
    parMembre[a.membre_id] = (parMembre[a.membre_id] || 0) + total;
  });
  const classement = Object.entries(parMembre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, gain], i) => `${i + 1}. ${membres[id] ? membres[id].prenom + " " + membres[id].nom : "?"} — ${fmtArgent(gain)}`);

  const texte = [
    `Actions réussies : ${totalActions}`,
    `Gains sale : ${fmtArgent(gainsSale)}`,
    `Gains propre : ${fmtArgent(gainsPropre)}`,
    `Classement :`,
    ...(classement.length ? classement : ["(aucune action)"]),
  ].join("\n");

  return { texte, totalActions, gainsSale, gainsPropre, classement, vainqueurId: Object.entries(parMembre).sort((a, b) => b[1] - a[1])[0]?.[0] || null };
}

async function verrouillerSemaineAuto(id, semaine, auto) {
  const res = await db.ref("semaines/" + id + "/bloquee").transaction((cur) => {
    if (cur === true) return; // déjà verrouillée par un autre client -> annule
    return true;
  });
  if (!res.committed || res.snapshot.val() !== true) return;

  const resume = await genererResume(id);
  await db.ref("semaines/" + id).update({
    resume: resume.texte,
    closedAt: Date.now(),
    auto: !!auto,
  });

  await majStatsEtBadges(id, resume);

  const cfgSnap = await db.ref("config/discord_webhook_quota").get();
  // Le résumé de semaine utilise le même champ de config webhook que les alertes (config/discord_webhook_quota)
  if (cfgSnap.val()) {
    envoyerWebhookEmbed(cfgSnap.val(), {
      titre: `📋 Résumé — ${semaine.nom}`,
      couleur: 0xc9a227,
      champs: [
        { name: "Actions", value: String(resume.totalActions), inline: true },
        { name: "Gains sale", value: fmtArgent(resume.gainsSale), inline: true },
        { name: "Gains propre", value: fmtArgent(resume.gainsPropre), inline: true },
        { name: "Classement", value: resume.classement.join("\n") || "—", inline: false },
      ],
    });
  }

  const bornes = prochainesBornes(semaine);
  await creerSemaineAvecBornes(bornes.debut, bornes.fin, bornes.verrouAt, false);
}

async function bloquerSemaine(id) {
  const semSnap = await db.ref("semaines/" + id).get();
  const semaine = semSnap.val();
  if (!semaine || semaine.bloquee) return;
  await verrouillerSemaineAuto(id, semaine, false);
  logAudit("Semaine bloquée manuellement", semaine.nom);
}

// ---------- BADGES & STATS ----------
async function majStatsEtBadges(semaineId, resume) {
  const gagnantSnap = await db.ref("config/dernier_gagnant_semaine").get();
  const dernierGagnant = gagnantSnap.val();

  const membresSnap = await db.ref("membres").get();
  const membres = membresSnap.val() || {};
  const actSnap = await db.ref("actions/" + semaineId).get();
  const actions = actSnap.val() || {};

  const actionsParMembre = {};
  Object.values(actions).forEach((a) => {
    if (a.resultat !== "Réussite") return;
    actionsParMembre[a.membre_id] = (actionsParMembre[a.membre_id] || 0) + 1;
  });

  const cfgWebhookSnap = await db.ref("config/discord_webhook_quota").get();
  const webhook = cfgWebhookSnap.val();

  for (const membreId of Object.keys(membres)) {
    const statRef = db.ref("stats_membres/" + membreId);
    const statSnap = await statRef.get();
    const stat = statSnap.val() || { total_actions: 0, semaines_gagnees: 0, streak_actuel: 0, badges: {} };
    stat.total_actions = (stat.total_actions || 0) + (actionsParMembre[membreId] || 0);

    const estGagnant = resume.vainqueurId === membreId;
    if (estGagnant) {
      stat.semaines_gagnees = (stat.semaines_gagnees || 0) + 1;
      stat.streak_actuel = dernierGagnant === membreId ? (stat.streak_actuel || 0) + 1 : 1;
    } else if (dernierGagnant === membreId) {
      stat.streak_actuel = 0;
    }

    const badgesDebloqués = stat.badges || {};
    const nouveaux = [];
    for (const b of BADGES_DEFS) {
      if (badgesDebloqués[b.id]) continue;
      const valeur = b.type === "actions" ? stat.total_actions : stat.streak_actuel;
      if (valeur >= b.seuil) {
        badgesDebloqués[b.id] = Date.now();
        nouveaux.push(b);
      }
    }
    stat.badges = badgesDebloqués;
    await statRef.set(stat);

    if (nouveaux.length && webhook) {
      const membre = membres[membreId];
      envoyerWebhookEmbed(webhook, {
        titre: `🏅 Nouveau(x) badge(s) — ${membre.prenom} ${membre.nom}`,
        couleur: 0xc9a227,
        champs: nouveaux.map(b => ({ name: b.icone + " " + b.nom, value: "Débloqué", inline: true })),
      });
    }
  }

  if (resume.vainqueurId) {
    await db.ref("config/dernier_gagnant_semaine").set(resume.vainqueurId);
  }
}

// ---------- QUOTAS — ALERTE DISCORD ----------
async function verifierQuotaEtAlerter(membreId, semaineId) {
  try {
    const [membreSnap, actionsSnap, quotasCatSnap, webhookSnap, marqueursSnap] = await Promise.all([
      db.ref("membres/" + membreId).get(),
      db.ref("actions/" + semaineId).get(),
      db.ref("quotas_categorie").get(),
      db.ref("config/discord_webhook_quota").get(),
      db.ref("semaines/" + semaineId + "/quota_alertes/" + membreId).get(),
    ]);
    const webhook = webhookSnap.val();
    if (!webhook) return;

    const membre = membreSnap.val();
    if (!membre || !membre.quota_global) return;

    const actions = actionsSnap.val() || {};
    const mesActions = Object.values(actions).filter(a => a.membre_id === membreId && a.resultat === "Réussite");
    const totalGlobal = mesActions.filter(a => a.categorie !== "drogue").length;

    const marqueurs = marqueursSnap.val() || {};

    if (!marqueurs.global && totalGlobal >= membre.quota_global) {
      await db.ref(`semaines/${semaineId}/quota_alertes/${membreId}/global`).set(true);
      envoyerWebhookEmbed(webhook, {
        titre: `🎯 Quota atteint`,
        couleur: 0xd00000,
        champs: [{ name: membre.prenom + " " + membre.nom, value: `Quota global atteint (${totalGlobal}/${membre.quota_global})`, inline: false }],
      });
    }

    const quotasCat = quotasCatSnap.val() || {};
    for (const [catId, cat] of Object.entries(quotasCat)) {
      const quotaMembre = membre.quotas_categorie ? membre.quotas_categorie[catId] : null;
      if (!quotaMembre) continue;
      const count = mesActions.filter(a => a.categorie === catId).length;
      if (!marqueurs[catId] && count >= quotaMembre) {
        await db.ref(`semaines/${semaineId}/quota_alertes/${membreId}/${catId}`).set(true);
        envoyerWebhookEmbed(webhook, {
          titre: `🎯 Quota atteint`,
          couleur: 0xd00000,
          champs: [{ name: membre.prenom + " " + membre.nom, value: `Quota "${cat.nom}" atteint (${count}/${quotaMembre})`, inline: false }],
        });
      }
    }
  } catch (e) {
    console.error("verifierQuotaEtAlerter", e);
  }
}

// ---------- WEBHOOK DISCORD (embed stylé) ----------
async function envoyerWebhookEmbed(url, { titre, description, couleur, champs }) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: titre,
          description: description || undefined,
          color: couleur || 0xc9a227,
          thumbnail: { url: KK_LOGO_URL },
          fields: champs || [],
          footer: { text: "BMF — Black Mafia Family" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error("Webhook Discord échoué", e);
  }
}

// ---------- RECHERCHE GLOBALE (Ctrl+F) ----------
function injectGlobalSearch(session, prefix) {
  const modal = document.createElement("div");
  modal.className = "search-modal hidden";
  modal.innerHTML = `
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Rechercher un membre, une taxe, une action…" autocomplete="off"/>
      <div class="search-results" id="searchResults"></div>
      <div class="search-hint">Échap pour fermer</div>
    </div>`;
  document.body.appendChild(modal);

  const open = () => { modal.classList.remove("hidden"); modal.querySelector("#searchInput").focus(); };
  const close = () => { modal.classList.add("hidden"); modal.querySelector("#searchInput").value = ""; modal.querySelector("#searchResults").innerHTML = ""; };

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      open();
    } else if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      close();
    }
  });
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  let timer = null;
  modal.querySelector("#searchInput").addEventListener("input", (e) => {
    clearTimeout(timer);
    const q = e.target.value.trim().toLowerCase();
    timer = setTimeout(() => rechercherGlobal(q, prefix), 200);
  });
}

async function rechercherGlobal(q, prefix) {
  const results = document.getElementById("searchResults");
  if (!q) { results.innerHTML = ""; return; }
  const out = [];

  const [membresSnap, taxesSnap, semainesSnap] = await Promise.all([
    db.ref("membres").get(),
    db.ref("taxes").get(),
    db.ref("semaines").orderByChild("debut").limitToLast(6).get(),
  ]);

  const membres = membresSnap.val() || {};
  Object.entries(membres).forEach(([id, m]) => {
    const full = `${m.prenom} ${m.nom}`.toLowerCase();
    if (full.includes(q)) out.push({ label: `👤 ${m.prenom} ${m.nom}`, href: prefix + "admin.html#membres" });
  });

  const taxes = taxesSnap.val() || {};
  Object.entries(taxes).forEach(([id, t]) => {
    const hay = `${t.zone || ""} ${t.code || ""}`.toLowerCase();
    if (hay.includes(q)) out.push({ label: `💰 Taxe — ${t.zone || "?"} (${t.code || "?"})`, href: prefix + "pages/taxes.html" });
  });

  const semaines = semainesSnap.val() || {};
  for (const [semId, sem] of Object.entries(semaines)) {
    const actSnap = await db.ref("actions/" + semId).get();
    const actions = actSnap.val() || {};
    Object.values(actions).forEach((a) => {
      const hay = `${a.action_nom || ""}`.toLowerCase();
      if (hay.includes(q)) out.push({ label: `🎯 ${a.action_nom} — ${sem.nom}`, href: prefix + "pages/tracker.html" });
    });
  }

  results.innerHTML = out.slice(0, 20).map(r => `<a href="${r.href}" class="search-result">${r.label}</a>`).join("") || `<div class="search-empty">Aucun résultat</div>`;
}

// ---------- SON WHOOSH (Web Audio, mode TV) ----------
function jouerWhoosh() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.5);
  } catch (e) { /* silencieux si Web Audio indisponible */ }
}
