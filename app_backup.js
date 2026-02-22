// ═══════════════════════════════════════════════════════════════════════════════
//  MANUTENÇÃO PREVENTIVA — app.js
//  Firebase + PWA + Notificações + Export
// ═══════════════════════════════════════════════════════════════════════════════

// ── Firebase Config (substitua com suas credenciais do Firebase Console) ───────
const FIREBASE_CONFIG = {
  apiKey:            "COLE_SUA_API_KEY_AQUI",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO",
  storageBucket:     "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID"
};
// ──────────────────────────────────────────────────────────────────────────────

// Dados base dos teares (estrutura fixa — pode ser ampliada via admin no futuro)
const BASE_TEARES = [
  { tear:1,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:42996173 },
  { tear:2,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:71637940 },
  { tear:3,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:68689056 },
  { tear:4,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:65715051 },
  { tear:5,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:35519077 },
  { tear:6,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:57082464 },
  { tear:7,  modelo:'ORIZIO 32" MONO',    rpm:28, setup:1600000, realizado:59517445 },
  { tear:8,  modelo:'ORIZIO 30" RIBANA',  rpm:18, setup:1800000, realizado:22558180 },
  { tear:9,  modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:66741244 },
  { tear:10, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:74221195 },
  { tear:11, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:5916785  },
  { tear:12, modelo:'MAYER 30" DUPLA',    rpm:25, setup:0,       realizado:0        },
  { tear:13, modelo:'MAYER 30" DUPLA',    rpm:25, setup:0,       realizado:0        },
  { tear:14, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:12074407 },
  { tear:15, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:61891468 },
  { tear:16, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:63149078 },
  { tear:17, modelo:'ORIZIO 30" RIBANA',  rpm:18, setup:1800000, realizado:54169508 },
  { tear:18, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:56957857 },
  { tear:19, modelo:'ORIZIO 42" MONO',    rpm:28, setup:1800000, realizado:53275086 },
  { tear:20, modelo:'ORIZIO 30" DUPLA',   rpm:25, setup:1800000, realizado:null     },
  { tear:21, modelo:'ORIZIO 30" DUPLA',   rpm:25, setup:1800000, realizado:null     },
  { tear:22, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
  { tear:23, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
  { tear:24, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
  { tear:25, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
  { tear:26, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
  { tear:27, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     },
];

// ── Estado global ──────────────────────────────────────────────────────────────
let db         = null;
let auth       = null;
let currentUser = null;
let firestoreData = {};   // { tearIndex: { realizado, real, dataManut } }
let usingFirebase = false;
const today = new Date(); today.setHours(0,0,0,0);
const STORAGE_KEY = 'mp_preventiva_v4';

// ═══════════════════════════════════════════════════════════════════════════════
//  FIREBASE INIT
// ═══════════════════════════════════════════════════════════════════════════════
async function initFirebase() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db   = firebase.firestore();
    usingFirebase = true;
    console.log('[Firebase] iniciado');

    auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        onLogin(user);
      } else {
        currentUser = null;
        showScreen('screen-login');
      }
    });
  } catch (err) {
    console.warn('[Firebase] não configurado, usando localStorage:', err.message);
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════════════
async function doLogin() {
  const email = document.getElementById('inp-email').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  const err   = document.getElementById('login-err');
  err.textContent = '';
  setLoginLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    err.textContent = traduzErroAuth(e.code);
    setLoginLoading(false);
  }
}

async function doRegister() {
  const email = document.getElementById('inp-email').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  const name  = document.getElementById('inp-name')?.value?.trim() || '';
  const err   = document.getElementById('login-err');
  err.textContent = '';
  if (pass.length < 6) { err.textContent = 'A senha deve ter ao menos 6 caracteres.'; return; }
  setLoginLoading(true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    if (name) await cred.user.updateProfile({ displayName: name });
  } catch(e) {
    err.textContent = traduzErroAuth(e.code);
    setLoginLoading(false);
  }
}

async function doLogout() {
  if (auth) await auth.signOut();
  else { currentUser = null; showScreen('screen-login'); }
}

function traduzErroAuth(code) {
  const map = {
    'auth/user-not-found':    'Usuário não encontrado.',
    'auth/wrong-password':    'Senha incorreta.',
    'auth/invalid-email':     'E-mail inválido.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/weak-password':     'Senha muito fraca.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    'auth/invalid-credential':'Credenciais inválidas.',
  };
  return map[code] || 'Erro: ' + code;
}

function setLoginLoading(on) {
  const btn = document.getElementById('btn-login-submit');
  if (btn) btn.disabled = on;
  if (btn) btn.textContent = on ? 'Aguarde...' : (document.getElementById('reg-fields')?.style.display !== 'none' ? 'Criar conta' : 'Entrar');
}

function toggleRegister() {
  const reg = document.getElementById('reg-fields');
  const btnText = document.getElementById('btn-login-submit');
  const toggle  = document.getElementById('btn-toggle-reg');
  const title   = document.getElementById('login-title');
  const isReg = reg.style.display !== 'none';
  reg.style.display   = isReg ? 'none' : 'flex';
  btnText.textContent = isReg ? 'Entrar' : 'Criar conta';
  toggle.textContent  = isReg ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar';
  title.textContent   = isReg ? 'Entrar' : 'Criar conta';
}

async function onLogin(user) {
  document.getElementById('user-name').textContent = user.displayName || user.email;
  showScreen('screen-app');
  await loadFromFirebase();
  buildTable();
  scheduleNotificationCheck();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FIRESTORE DATA
// ═══════════════════════════════════════════════════════════════════════════════
async function loadFromFirebase() {
  if (!db || !currentUser) return;
  try {
    showSyncIndicator('sync');
    const snap = await db.collection('teams')
      .doc(currentUser.uid)
      .collection('teares')
      .get();
    firestoreData = {};
    snap.forEach(doc => { firestoreData[doc.id] = doc.data(); });
    showSyncIndicator('ok');
  } catch(e) {
    console.error('[Firestore] load error:', e);
    showSyncIndicator('err');
  }
}

async function saveRowToFirebase(i) {
  if (!db || !currentUser) { saveLocal(); return; }
  const row = {
    realizado:  document.getElementById(`r-${i}`)?.value ?? '',
    real:       document.getElementById(`v-${i}`)?.value ?? '',
    dataManut:  document.getElementById(`d-${i}`)?.value ?? '',
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy:  currentUser.email,
  };
  try {
    await db.collection('teams')
      .doc(currentUser.uid)
      .collection('teares')
      .doc(String(i))
      .set(row, { merge: true });
    firestoreData[String(i)] = row;
    showSyncIndicator('ok');
  } catch(e) {
    console.error('[Firestore] save error:', e);
    showSyncIndicator('err');
    saveLocal();
  }
}

// ── LocalStorage fallback ──────────────────────────────────────────────────────
function loadLocal() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch(e) { return {}; }
}
function saveLocal() {
  const state = {};
  BASE_TEARES.forEach((_, i) => {
    state[i] = {
      realizado: document.getElementById(`r-${i}`)?.value ?? '',
      real:      document.getElementById(`v-${i}`)?.value ?? '',
      dataManut: document.getElementById(`d-${i}`)?.value ?? '',
    };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  showSyncIndicator('ok');
}

function getRowData(i) {
  // Prefer Firestore data, fallback to localStorage
  if (usingFirebase && firestoreData[String(i)]) return firestoreData[String(i)];
  const local = loadLocal();
  return local[i] || {};
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TABLE
// ═══════════════════════════════════════════════════════════════════════════════
function buildTable() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  BASE_TEARES.forEach((d, i) => {
    const s    = getRowData(i);
    const initR = s.realizado !== undefined && s.realizado !== '' ? s.realizado : (d.realizado != null ? d.realizado : '');
    const initV = s.real      ?? '';
    const initD = s.dataManut ?? '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="tear-num">${d.tear}</span></td>
      <td><span class="model-name">${d.modelo}</span></td>
      <td class="hide-mobile">${d.rpm}</td>
      <td class="hide-mobile" style="color:var(--muted);text-align:right">${fmt(d.setup)}</td>
      <td>
        <input class="cell-input input-date inp-info" type="date"
          id="d-${i}" value="${initD}"
          onchange="onFieldChange(${i})" >
      </td>
      <td>
        <input class="cell-input input-num inp-accent" type="number"
          id="r-${i}" value="${initR}" placeholder="0"
          oninput="calcRow(${i})" onblur="onFieldChange(${i})">
      </td>
      <td>
        <input class="cell-input input-num inp-accent" type="number"
          id="v-${i}" value="${initV}" placeholder="Leitura atual"
          oninput="calcRow(${i})" onblur="onFieldChange(${i})">
      </td>
      <td id="saldo-${i}" class="hide-mobile" style="text-align:right;font-weight:500">—</td>
      <td id="bar-${i}" class="hide-mobile">—</td>
      <td id="fc-${i}">—</td>
      <td id="st-${i}">—</td>
    `;
    tbody.appendChild(tr);
    calcRow(i);
  });

  updateStats();
  document.getElementById('lbl-today').textContent =
    today.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});
}

function onFieldChange(i) {
  calcRow(i);
  if (usingFirebase && currentUser) {
    saveRowToFirebase(i);
  } else {
    saveLocal();
  }
}

function calcRow(i) {
  const d = BASE_TEARES[i];
  const rzdVal    = document.getElementById(`r-${i}`)?.value;
  const realVal   = document.getElementById(`v-${i}`)?.value;
  const dataManut = document.getElementById(`d-${i}`)?.value;

  const realizado = rzdVal  !== '' && rzdVal  != null ? parseFloat(rzdVal)  : null;
  const real      = realVal !== '' && realVal != null ? parseFloat(realVal) : null;

  const proximo = realizado != null ? realizado + d.setup : null;
  const saldo   = (real != null && proximo != null) ? proximo - real : null;

  let forecastDate = null;
  if (saldo != null && d.rpm > 0)
    forecastDate = new Date(today.getTime() + (saldo / d.rpm / 60 / 24) * 86400000);

  // Saldo
  const sc = document.getElementById(`saldo-${i}`);
  if (sc) {
    sc.textContent  = saldo != null ? fmt(Math.round(saldo)) : '—';
    sc.style.color  = saldo == null ? 'var(--muted)' : saldo < 0 ? 'var(--danger)' : saldo < 500000 ? 'var(--warn)' : 'var(--ok)';
  }

  // Bar
  const bc = document.getElementById(`bar-${i}`);
  if (bc) {
    if (real != null && proximo != null && proximo > 0) {
      const pct = Math.max(0, Math.min(100, (real / proximo) * 100));
      const col = saldo < 0 ? 'var(--danger)' : saldo < 500000 ? 'var(--warn)' : 'var(--ok)';
      bc.innerHTML = `<div style="display:flex;align-items:center;gap:6px">
        <div class="bar-wrap"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${col}"></div></div>
        <span style="font-size:0.68rem;color:var(--muted)">${pct.toFixed(0)}%</span>
      </div>`;
    } else bc.innerHTML = '—';
  }

  // Forecast
  const fc = document.getElementById(`fc-${i}`);
  if (fc) {
    if (forecastDate) {
      const days = Math.round((forecastDate - today) / 86400000);
      const col  = days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--ok)';
      const lbl  = days === 0 ? 'Hoje' : days > 0 ? `em ${days}d` : `${Math.abs(days)}d atrás`;
      fc.innerHTML = `<div class="fc-date" style="color:${col}">${forecastDate.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}</div><div class="fc-days">${lbl}</div>`;
    } else fc.innerHTML = '<span style="color:var(--muted)">—</span>';
  }

  // Status
  const st = document.getElementById(`st-${i}`);
  if (st) {
    if (dataManut) {
      st.innerHTML = `<span class="chip chip-done">✓ ${fmtDate(dataManut)}</span>`;
    } else if (!forecastDate) {
      st.innerHTML = '<span class="chip chip-na">—</span>';
    } else {
      const days = Math.round((forecastDate - today) / 86400000);
      st.innerHTML = days < 0
        ? '<span class="chip chip-danger">Vencido</span>'
        : days <= 30
          ? '<span class="chip chip-warn">Atenção</span>'
          : '<span class="chip chip-ok">Em dia</span>';
    }
  }

  updateStats();
}

function updateStats() {
  let vencido = 0, atencao = 0, emDia = 0;
  BASE_TEARES.forEach((_, i) => {
    const t = document.getElementById(`st-${i}`)?.textContent?.trim() || '';
    if (t.includes('Vencido'))  vencido++;
    else if (t.includes('Atenção')) atencao++;
    else if (t.includes('Em dia'))  emDia++;
  });
  document.getElementById('s-vencido').textContent = vencido;
  document.getElementById('s-atencao').textContent = atencao;
  document.getElementById('s-ok').textContent      = emDia;
  document.getElementById('s-total').textContent   = BASE_TEARES.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  const btn = document.getElementById('btn-notif');
  if (perm === 'granted') {
    btn.textContent = '🔔 Notificações ativas';
    btn.classList.add('active');
    scheduleNotificationCheck();
  } else {
    btn.textContent = '🔕 Notificações bloqueadas';
  }
}

function scheduleNotificationCheck() {
  if (Notification.permission !== 'granted') return;
  checkAndNotify();
  // Check daily
  setInterval(checkAndNotify, 24 * 60 * 60 * 1000);
}

function checkAndNotify() {
  const alerts = [];
  BASE_TEARES.forEach((d, i) => {
    const s = getRowData(i);
    const realizado = s.realizado !== '' ? parseFloat(s.realizado) : d.realizado;
    const real      = s.real !== '' ? parseFloat(s.real) : null;
    if (realizado == null || real == null || d.rpm === 0) return;
    const proximo = realizado + d.setup;
    const saldo   = proximo - real;
    const days    = Math.round(saldo / d.rpm / 60 / 24);
    if (days <= 7 && !s.dataManut) {
      alerts.push({ tear: d.tear, modelo: d.modelo, days });
    }
  });

  if (alerts.length === 0) return;

  const vencidos = alerts.filter(a => a.days < 0);
  const proximos = alerts.filter(a => a.days >= 0);

  let body = '';
  if (vencidos.length) body += `⚠️ ${vencidos.length} tear(es) com manutenção vencida. `;
  if (proximos.length) body += `🕐 ${proximos.length} tear(es) com manutenção nos próximos 7 dias.`;

  new Notification('Manutenção Preventiva', {
    body,
    icon: '/icons/icon-192.png',
    tag: 'mp-daily'
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
function exportCSV() {
  const rows = [['Tear','Modelo','RPM','Setup','Data Manutenção','Realizado','Real (Voltas)','Saldo','Próxima Manutenção','Status']];
  BASE_TEARES.forEach((d, i) => {
    const s  = getRowData(i);
    const realizado = s.realizado !== undefined && s.realizado !== '' ? parseFloat(s.realizado) : (d.realizado ?? '');
    const real      = s.real      !== '' ? parseFloat(s.real)      : '';
    const dataManut = s.dataManut ?? '';
    const proximo   = realizado !== '' ? realizado + d.setup : '';
    const saldo     = real !== '' && proximo !== '' ? proximo - real : '';
    let fc = '', status = '';
    if (saldo !== '' && d.rpm > 0) {
      const fcDate = new Date(today.getTime() + (saldo / d.rpm / 60 / 24) * 86400000);
      fc = fcDate.toLocaleDateString('pt-BR');
      const days = Math.round((fcDate - today) / 86400000);
      status = dataManut ? 'Realizada' : days < 0 ? 'Vencido' : days <= 30 ? 'Atenção' : 'Em dia';
    }
    rows.push([d.tear, d.modelo, d.rpm, d.setup, dataManut, realizado, real, saldo, fc, status]);
  });

  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `manutencao_${today.toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado com sucesso!');
}

function exportPDF() {
  window.print();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function showScreen(id) {
  ['screen-login','screen-app'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? (id === 'screen-login' ? 'flex' : 'block') : 'none';
  });
}

function showSyncIndicator(state) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  const map = { sync: ['↻ Sincronizando...','#7a8aaa'], ok: ['✓ Salvo na nuvem','#22c55e'], err: ['⚠ Erro ao salvar','#ef4444'] };
  const [txt, col] = map[state] || map.ok;
  el.textContent = txt;
  el.style.color = col;
  el.style.opacity = '1';
  if (state !== 'sync') setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function toggleMenu() {
  const m = document.getElementById('menu-dropdown');
  if (m) m.classList.toggle('open');
}

// Close menu on outside click
document.addEventListener('click', e => {
  const menu = document.getElementById('menu-dropdown');
  const btn  = document.getElementById('btn-menu');
  if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) { return n != null && n !== '' ? Number(n).toLocaleString('pt-BR') : '—'; }
function fmtDate(str) {
  if (!str) return '—';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SERVICE WORKER + PWA INSTALL
// ═══════════════════════════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('btn-install');
  if (btn) { btn.style.display = 'flex'; }
});

async function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    document.getElementById('btn-install').style.display = 'none';
    showToast('App instalado com sucesso!');
  }
  deferredInstallPrompt = null;
}

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('btn-install');
  if (btn) btn.style.display = 'none';
});

// ── Register Service Worker ───────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('[SW] registrado:', reg.scope);
  }).catch(err => console.warn('[SW] erro:', err));
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Try Firebase — if config is placeholder, fall back to localStorage
  if (FIREBASE_CONFIG.apiKey === 'COLE_SUA_API_KEY_AQUI') {
    console.info('[App] Firebase não configurado — modo offline/localStorage');
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
  } else {
    initFirebase();
  }

  // Notification button state
  const btn = document.getElementById('btn-notif');
  if (btn && Notification.permission === 'granted') {
    btn.textContent = '🔔 Notificações ativas';
    btn.classList.add('active');
  }
});
