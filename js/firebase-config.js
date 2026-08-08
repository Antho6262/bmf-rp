// ============================================================
// BMF — Black Mafia Family — Firebase config & constantes
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDZmEjwS2Y3y4cKBBLJgZJLjxpsHc2LuCE",
  authDomain: "bmf-rp.firebaseapp.com",
  databaseURL: "https://bmf-rp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bmf-rp",
  storageBucket: "bmf-rp.firebasestorage.app",
  messagingSenderId: "701363604694",
  appId: "1:701363604694:web:48fa467ffad98f48700d77",
  measurementId: "G-M34X4J1XZ3"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

// Auth anonyme obligatoire (les rules exigent auth != null)
const authReady = new Promise((resolve) => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) { resolve(user); return; }
    firebase.auth().signInAnonymously().catch((e) => console.error("Auth anonyme échouée", e));
  });
});

// Pages gérables dans Admin → Permissions / Visibilité
const PAGES_DISPO = [
  { id: "dashboard",    label: "Dashboard" },
  { id: "tracker",      label: "Tracker" },
  { id: "taxes",        label: "Taxes" },
  { id: "paye",         label: "Paye" },
  { id: "blanchiment",  label: "Blanchiment" },
  { id: "radio",        label: "Radio" },
  { id: "profil",       label: "Profil" },
  { id: "tv",           label: "Mode TV" }
];

// Badges & records (paliers)
const BADGES_DEFS = [
  { id: "actions_50",  type: "actions", seuil: 50,  nom: "Recrue confirmée",   icone: "🥉" },
  { id: "actions_100", type: "actions", seuil: 100, nom: "Soldat",             icone: "🥈" },
  { id: "actions_250", type: "actions", seuil: 250, nom: "Lieutenant",         icone: "🥇" },
  { id: "actions_500", type: "actions", seuil: 500, nom: "Capo",               icone: "👑" },
  { id: "streak_2",    type: "streak",  seuil: 2,   nom: "Série en tête x2",   icone: "🔥" },
  { id: "streak_3",    type: "streak",  seuil: 3,   nom: "Série en tête x3",   icone: "🔥🔥" },
  { id: "streak_5",    type: "streak",  seuil: 5,   nom: "Série en tête x5",   icone: "🔥🔥🔥" }
];

const KK_LOGO_URL = "https://bmf-rp.web.app/img/logo.png"; // à remplacer par l'URL GitHub Pages réelle une fois déployé
const KK_COLOR_GOLD = 0xc9a227;
const KK_COLOR_DARK = 0x0d0d0d;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function slugify(str) {
  return (str || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uid() {
  return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function fmtArgent(n) {
  n = Math.round(Number(n) || 0);
  return n.toLocaleString("fr-FR") + " $";
}

function limitesSemaine(base) {
  // Semaine calendaire courante (lundi 00:00 -> dimanche 23:59:59)
  const d = base ? new Date(base) : new Date();
  const jour = (d.getDay() + 6) % 7; // 0 = lundi
  const lundi = new Date(d);
  lundi.setHours(0, 0, 0, 0);
  lundi.setDate(d.getDate() - jour);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  dimanche.setHours(23, 59, 59, 999);
  const verrouAt = new Date(dimanche);
  verrouAt.setHours(19, 0, 0, 0);
  return { debut: lundi.getTime(), fin: dimanche.getTime(), verrouAt: verrouAt.getTime() };
}

function prochainesBornes(derniere) {
  const debut = derniere.fin + 1;
  const fin = debut + 6 * 24 * 3600 * 1000 + (23 * 3600 + 59 * 60 + 59) * 1000 - (24 * 3600 * 1000 - 1);
  // fin = debut + 6 jours, à 23:59:59
  const dDebut = new Date(debut);
  const dFin = new Date(dDebut);
  dFin.setDate(dDebut.getDate() + 6);
  dFin.setHours(23, 59, 59, 999);
  const verrouAt = new Date(dDebut);
  verrouAt.setDate(dDebut.getDate() + 6);
  verrouAt.setHours(19, 0, 0, 0);
  return { debut, fin: dFin.getTime(), verrouAt: verrouAt.getTime() };
}

function nomSemaine(debut, fin) {
  const f = (t) => {
    const d = new Date(t);
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
  };
  return `Semaine du ${f(debut)} au ${f(fin)}`;
}
