// =============================================================================
//  MANUTENCAO PREVENTIVA - app.js v4.2
// =============================================================================

// Config Firebase — inline para garantir disponibilidade
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAXTpEVEkwT6mcN40wyox0mii7SARFN0sw",
  authDomain:        "mpdoptex-c5654.firebaseapp.com",
  projectId:         "mpdoptex-c5654",
  storageBucket:     "mpdoptex-c5654.firebasestorage.app",
  messagingSenderId: "697477319756",
  appId:             "1:697477319756:web:661ce11fe22714d431f8e9"
};

// Alias firebaseConfig = FIREBASE_CONFIG para compatibilidade
var firebaseConfig = FIREBASE_CONFIG;

var BASE_TEARES = [
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
  { tear:27, modelo:'LEADSFON 30" DUPLA', rpm:25, setup:1800000, realizado:null     }
];

var CHECKLIST_ITENS = [
  'ALINHAMENTO DAS GAIOLAS','ALINHAMENTO DOS PINOS SUPORTE','AIR JET',
  'PORCELANA DE ENTRADA DO CANINHO','PORCELANA DE SAIDA DO CANINHO','CANINHO CONDUTOR',
  'CORREIA TRACIONADORA (FITA)','RODA DE QUALIDADE','ESTICADORES/ROLDANAS DA CORREIA',
  'TETO DA MAQUINA','ILUMINACAO SUPERIOR','PEGA NO',
  'ALIMENTADOR POSITIVO (CARRINHO)','PORCELANA DO ALIMENTADOR GUIA','ALIMENTADOR GUIA FIO',
  'AGULHAS','PLATINAS','ANEL DE PLATINA','CILINDRO','BLOCOS','PEDRAS CAMES',
  'BICOS DE LUBRIFICACAO','BASE DO CILINDRO (CREMALHEIRA)','ILUMINACAO INFERIOR',
  'ALARGADOR DE MALHA','CILINDROS DO PUXADOR','POLIAS DO PUXADOR','CORREIAS DO PUXADOR',
  'CILINDROS DA BASE DO PUXADOR','PORTAS','SISTEMA DE EMERGENCIA','MOTOR',
  'CORREIA DO MOTOR','BOMBA DE OLEO','MANGUEIRAS DA BOMBA DE OLEO','ENGRENAGENS DO FUNITOR'
];

// =============================================================================
//  ESTADO
// =============================================================================
var db = null, auth = null, currentUser = null;
var firestoreData = {}, usingFirebase = false;
var today = new Date(); today.setHours(0,0,0,0);
var STORAGE_KEY = 'mp_preventiva_v4';
var EMPRESA_ID  = 'mpdoptex';
var _fbReady    = false;
var manutsAtivas = {};  // tearIndex -> { startTime, timerInterval, checklist, obs }
var clTearIndex  = null;

// =============================================================================
//  FIREBASE INIT
// =============================================================================
function initFirebase() {
  if (_fbReady) return;
  _fbReady = true;

  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK nao carregou');
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
    return;
  }

  try {
    // Usa FIREBASE_CONFIG para evitar conflito com nome reservado
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db   = firebase.firestore();
    usingFirebase = true;

    auth.onAuthStateChanged(function(user) {
      if (user) {
        currentUser = user;
        onLogin(user);
      } else {
        currentUser = null;
        Object.keys(manutsAtivas).forEach(function(k){ clearInterval(manutsAtivas[k].timerInterval); });
        manutsAtivas = {};
        showScreen('screen-login');
        resetLoginForm();
      }
    });
  } catch(e) {
    console.error('[Firebase init]', e.message);
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
  }
}

function resetLoginForm() {
  mostrarLogin();
  var err = document.getElementById('login-err');
  if (err) { err.textContent = ''; err.style.color = '#ef4444'; }
}

function tearRef(i) { return db.collection('empresa').doc(EMPRESA_ID).collection('teares').doc(String(i)); }
function tearCol()  { return db.collection('empresa').doc(EMPRESA_ID).collection('teares'); }
function histCol()  { return db.collection('empresa').doc(EMPRESA_ID).collection('historico'); }

// =============================================================================
//  AUTH
// =============================================================================
var _tela = 'login';

function mostrarLogin() {
  _tela = 'login';
  _setEl('reg-fields',   'display', 'none');
  _setEl('reset-fields', 'display', 'none');
  _setEl('campo-senha',  'display', 'block');
  _setEl('btn-toggle-reg', 'display', 'block');
  _setEl('btn-forgot',   'display', 'block');
  _setEl('btn-back',     'display', 'none');
  _setText('login-title', 'Entrar');
  _setBtnSubmit('Entrar', false);
  _clearErr();
}
function mostrarRegistro() {
  _tela = 'registro';
  _setEl('reg-fields',   'display', 'flex');
  _setEl('reset-fields', 'display', 'none');
  _setEl('campo-senha',  'display', 'block');
  _setEl('btn-toggle-reg', 'display', 'block');
  _setEl('btn-forgot',   'display', 'none');
  _setEl('btn-back',     'display', 'none');
  _setText('login-title', 'Criar Conta');
  _setBtnSubmit('Criar conta', false);
  _clearErr();
}
function mostrarReset() {
  _tela = 'reset';
  _setEl('reg-fields',   'display', 'none');
  _setEl('reset-fields', 'display', 'flex');
  _setEl('campo-senha',  'display', 'none');
  _setEl('btn-toggle-reg', 'display', 'none');
  _setEl('btn-forgot',   'display', 'none');
  _setEl('btn-back',     'display', 'block');
  _setText('login-title', 'Recuperar Senha');
  _setBtnSubmit('Enviar e-mail', false);
  _clearErr();
}

function _setEl(id, prop, val) { var el = document.getElementById(id); if (el) el.style[prop] = val; }
function _setText(id, txt)     { var el = document.getElementById(id); if (el) el.textContent = txt; }
function _setBtnSubmit(txt, disabled) {
  var btn = document.getElementById('btn-submit');
  if (!btn) return;
  btn.textContent = txt;
  btn.disabled = disabled;
}
function _clearErr() {
  var el = document.getElementById('login-err');
  if (el) { el.textContent = ''; el.style.color = '#ef4444'; }
}
function _showErr(msg) {
  var el = document.getElementById('login-err');
  if (el) { el.textContent = msg; el.style.color = '#ef4444'; }
}

function toggleTela() { if (_tela === 'login') mostrarRegistro(); else mostrarLogin(); }

function submitForm() {
  if (_tela === 'login')         doLogin();
  else if (_tela === 'registro') doRegistro();
  else if (_tela === 'reset')    doReset();
}

async function doLogin() {
  var emailEl = document.getElementById('inp-email');
  var passEl  = document.getElementById('inp-pass');
  var email   = emailEl ? emailEl.value.trim() : '';
  var pass    = passEl  ? passEl.value : '';
  _clearErr();
  if (!email || !pass) { _showErr('Preencha e-mail e senha.'); return; }
  _setBtnSubmit('Aguarde...', true);
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    _showErr(traduzErro(e.code));
    _setBtnSubmit('Entrar', false);
  }
}

async function doRegistro() {
  var emailEl = document.getElementById('inp-email');
  var passEl  = document.getElementById('inp-pass');
  var nameEl  = document.getElementById('inp-name');
  var email   = emailEl ? emailEl.value.trim() : '';
  var pass    = passEl  ? passEl.value : '';
  var name    = nameEl  ? nameEl.value.trim() : '';
  _clearErr();
  if (!email)          { _showErr('Informe o e-mail.'); return; }
  if (pass.length < 6) { _showErr('Senha precisa ter ao menos 6 caracteres.'); return; }
  _setBtnSubmit('Aguarde...', true);
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    if (name) await cred.user.updateProfile({ displayName: name });
  } catch(e) {
    _showErr(traduzErro(e.code));
    _setBtnSubmit('Criar conta', false);
  }
}

async function doReset() {
  var emailEl = document.getElementById('inp-reset-email');
  var email   = emailEl ? emailEl.value.trim() : '';
  _clearErr();
  if (!email) { _showErr('Informe o e-mail cadastrado.'); return; }
  _setBtnSubmit('Aguarde...', true);
  try {
    await auth.sendPasswordResetEmail(email);
    var el = document.getElementById('login-err');
    if (el) { el.style.color = '#22c55e'; el.textContent = 'E-mail enviado! Verifique sua caixa.'; }
    _setBtnSubmit('Enviar e-mail', false);
  } catch(e) {
    _showErr(traduzErro(e.code));
    _setBtnSubmit('Enviar e-mail', false);
  }
}

async function doLogout() {
  Object.keys(manutsAtivas).forEach(function(k){ clearInterval(manutsAtivas[k].timerInterval); });
  manutsAtivas = {};
  if (auth) await auth.signOut();
  else { currentUser = null; showScreen('screen-login'); mostrarLogin(); }
}

function traduzErro(code) {
  var m = {
    'auth/user-not-found':       'E-mail nao encontrado.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/invalid-email':        'E-mail invalido.',
    'auth/email-already-in-use': 'E-mail ja cadastrado.',
    'auth/weak-password':        'Senha muito fraca (min 6 caracteres).',
    'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential':   'E-mail ou senha incorretos.',
    'auth/network-request-failed':'Sem conexao com a internet.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'API key invalida. Contate o administrador.'
  };
  return m[code] || 'Erro ao autenticar. Tente novamente.';
}

async function onLogin(user) {
  _setText('user-name', user.displayName || user.email);
  showScreen('screen-app');
  await loadFirestore();
  await carregarRole(user.uid);  // define currentRole antes de buildTable
  buildTable();
  listenRealtime();
  scheduleNotifications();
}

// =============================================================================
//  FIRESTORE
// =============================================================================
async function loadFirestore() {
  if (!db || !currentUser) return;
  try {
    showSync('sync');
    var snap = await tearCol().get();
    firestoreData = {};
    snap.forEach(function(doc) { firestoreData[doc.id] = doc.data(); });
    showSync('ok');
  } catch(e) { showSync('err'); }
}

function listenRealtime() {
  if (!db || !currentUser) return;
  var primeiro = true;
  tearCol().onSnapshot(function(snap) {
    if (primeiro) { primeiro = false; return; }
    snap.docChanges().forEach(function(ch) {
      if (ch.type === 'modified' || ch.type === 'added') {
        var idx  = parseInt(ch.doc.id);
        var data = ch.doc.data();
        firestoreData[ch.doc.id] = data;
        atualizarLinhaNuvem(idx);
        var quem = data.updatedBy || 'outro dispositivo';
        if (quem !== (currentUser.displayName || currentUser.email)) showSync('realtime', quem);
      }
    });
    updateStats();
  });
}

function atualizarLinhaNuvem(i) {
  var s = firestoreData[String(i)]; if (!s) return;
  var rEl = document.getElementById('r-'+i);
  var vEl = document.getElementById('v-'+i);
  var dEl = document.getElementById('d-'+i);
  if (rEl && document.activeElement !== rEl) rEl.value = s.realizado || '';
  if (vEl && document.activeElement !== vEl) vEl.value = s.real      || '';
  if (dEl && document.activeElement !== dEl) dEl.value = s.dataManut || '';
  calcRow(i);
}

async function salvarLinha(i) {
  if (!db || !currentUser) { salvarLocal(); return; }
  var row = {
    realizado: (document.getElementById('r-'+i)||{}).value || '',
    real:      (document.getElementById('v-'+i)||{}).value || '',
    dataManut: (document.getElementById('d-'+i)||{}).value || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: currentUser.displayName || currentUser.email
  };
  try {
    showSync('sync');
    await tearRef(i).set(row, { merge: true });
    firestoreData[String(i)] = row;
    showSync('ok');
  } catch(e) { showSync('err'); salvarLocal(); }
}

function loadLocal() {
  try { var r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch(e) { return {}; }
}
function salvarLocal() {
  var s = {};
  BASE_TEARES.forEach(function(_,i) {
    s[i] = {
      realizado: (document.getElementById('r-'+i)||{}).value||'',
      real:      (document.getElementById('v-'+i)||{}).value||'',
      dataManut: (document.getElementById('d-'+i)||{}).value||''
    };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  showSync('ok');
}
function getDados(i) {
  if (usingFirebase && firestoreData[String(i)]) return firestoreData[String(i)];
  return loadLocal()[i] || {};
}

// =============================================================================
//  TABELA
// =============================================================================
function buildTable() {
  var tbody = document.getElementById('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  BASE_TEARES.forEach(function(d, i) {
    var s     = getDados(i);
    var initR = (s.realizado !== undefined && s.realizado !== '') ? s.realizado : (d.realizado != null ? d.realizado : '');
    var initV = s.real || '';
    var initD = s.dataManut || '';
    var emManut = !!manutsAtivas[i];
    var tr = document.createElement('tr');
    tr.id = 'tr-'+i;
    if (emManut) tr.style.background = 'rgba(249,115,22,0.06)';
    tr.innerHTML =
      '<td><span class="tear-num">'+d.tear+'</span></td>'+
      '<td><span class="model-name">'+d.modelo+'</span></td>'+
      '<td class="hide-mobile">'+d.rpm+'</td>'+
      '<td class="hide-mobile" style="color:var(--muted);text-align:right">'+fmt(d.setup)+'</td>'+
      // Chave + timer (oculto para operador)
      '<td style="white-space:nowrap;padding:4px 6px">'+
        '<button class="btn-action btn-wrench'+(emManut?' active':'')+'" id="btn-wrench-'+i+'" onclick="clicarChave('+i+')" title="'+(emManut?'Abrir checklist':'Iniciar manutencao')+'"'+(currentRole==='operador'?' style="display:none"':'')+'>'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'+
        '</button>'+
        '<span class="row-timer" id="rt-'+i+'" style="display:'+(emManut?'inline':'none')+'">00:00</span>'+
      '</td>'+
      '<td><input class="cell-input input-date inp-info" type="date" id="d-'+i+'" value="'+initD+'" onchange="onChange('+i+')"></td>'+
      '<td><input class="cell-input input-num inp-accent" type="number" id="r-'+i+'" value="'+initR+'" placeholder="0" oninput="calcRow('+i+')" onblur="onChange('+i+')"></td>'+
      '<td><input class="cell-input input-num inp-accent" type="number" id="v-'+i+'" value="'+initV+'" placeholder="Leitura atual" oninput="calcRow('+i+')" onblur="onChange('+i+')"></td>'+
      '<td id="saldo-'+i+'" class="hide-mobile" style="text-align:right;font-weight:500">-</td>'+
      '<td id="bar-'+i+'" class="hide-mobile">-</td>'+
      '<td id="fc-'+i+'">-</td>'+
      '<td id="st-'+i+'">-</td>'+
      // Check verde
      '<td style="padding:4px 6px">'+
        '<button class="btn-action btn-finish" id="btn-finish-'+i+'" onclick="abrirChecklist('+i+')" title="Abrir checklist" style="display:'+(emManut&&currentRole!=='operador'?'inline-flex':'none')+'">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'+
        '</button>'+
      '</td>';
    tbody.appendChild(tr);
    calcRow(i);
  });
  updateStats();
  var lbl = document.getElementById('lbl-today');
  if (lbl) lbl.textContent = today.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});
}

function onChange(i) {
  calcRow(i);
  if (usingFirebase && currentUser) salvarLinha(i); else salvarLocal();
}

function calcRow(i) {
  var d       = BASE_TEARES[i];
  var rVal    = (document.getElementById('r-'+i)||{}).value;
  var vVal    = (document.getElementById('v-'+i)||{}).value;
  var dataMnt = (document.getElementById('d-'+i)||{}).value;
  var realizado = (rVal !== '' && rVal != null) ? parseFloat(rVal) : null;
  var real      = (vVal !== '' && vVal != null) ? parseFloat(vVal) : null;
  var proximo   = realizado != null ? realizado + d.setup : null;
  var saldo     = (real != null && proximo != null) ? proximo - real : null;
  var fcDate    = (saldo != null && d.rpm > 0) ? new Date(today.getTime() + (saldo/d.rpm/60/24)*86400000) : null;

  var sc = document.getElementById('saldo-'+i);
  if (sc) {
    sc.textContent = saldo != null ? fmt(Math.round(saldo)) : '-';
    sc.style.color = saldo == null ? 'var(--muted)' : saldo < 0 ? 'var(--danger)' : saldo < 500000 ? 'var(--warn)' : 'var(--ok)';
  }

  var bc = document.getElementById('bar-'+i);
  if (bc) {
    if (real != null && proximo != null && proximo > 0) {
      var pct = Math.max(0, Math.min(100, (real/proximo)*100));
      var col = saldo < 0 ? 'var(--danger)' : saldo < 500000 ? 'var(--warn)' : 'var(--ok)';
      bc.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><div class="bar-wrap"><div class="bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div><span style="font-size:.68rem;color:var(--muted)">'+pct.toFixed(0)+'%</span></div>';
    } else bc.innerHTML = '-';
  }

  var fc = document.getElementById('fc-'+i);
  if (fc) {
    if (fcDate) {
      var days = Math.round((fcDate - today) / 86400000);
      var fcCol = days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--ok)';
      var lbl   = days === 0 ? 'Hoje' : days > 0 ? 'em '+days+'d' : Math.abs(days)+'d atras';
      fc.innerHTML = '<div class="fc-date" style="color:'+fcCol+'">'+fcDate.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+'</div><div class="fc-days">'+lbl+'</div>';
    } else fc.innerHTML = '<span style="color:var(--muted)">-</span>';
  }

  var st = document.getElementById('st-'+i);
  if (st) {
    if (dataMnt) {
      st.innerHTML = '<span class="chip chip-done">&#10003; '+fmtDate(dataMnt)+'</span>';
    } else if (!fcDate) {
      st.innerHTML = '<span class="chip chip-na">-</span>';
    } else {
      var d2 = Math.round((fcDate - today) / 86400000);
      st.innerHTML = d2 < 0 ? '<span class="chip chip-danger">Vencido</span>' : d2 <= 30 ? '<span class="chip chip-warn">Atencao</span>' : '<span class="chip chip-ok">Em dia</span>';
    }
  }
  updateStats();
}

function updateStats() {
  var v=0, a=0, e=0;
  BASE_TEARES.forEach(function(d, i) {
    var rVal = (document.getElementById('r-'+i)||{}).value;
    var vVal = (document.getElementById('v-'+i)||{}).value;
    var realizado = (rVal!==''&&rVal!=null) ? parseFloat(rVal) : (d.realizado!=null?d.realizado:null);
    var real      = (vVal!==''&&vVal!=null) ? parseFloat(vVal) : null;

    // Sem leitura atual = nao conta
    if (real === null || realizado === null || d.setup === 0) return;

    var saldo = (realizado + d.setup) - real;

    if (saldo < 0) {
      v++; // VENCIDO: saldo negativo independente de ter data
    } else if (d.rpm > 0) {
      var dias = Math.round(saldo / d.rpm / 60 / 24);
      if (dias <= 10) a++; // ATENCAO: faltam 10 dias ou menos
      else e++;             // EM DIA: mais de 10 dias
    } else {
      e++;
    }
  });
  _setText('s-vencido', v);
  _setText('s-atencao', a);
  _setText('s-ok',      e);
  _setText('s-total',   BASE_TEARES.length);
}

// =============================================================================
//  MANUTENCOES MULTIPLAS SIMULTANEAS
// =============================================================================
function clicarChave(i) {
  if (manutsAtivas[i]) {
    abrirChecklist(i);
  } else {
    iniciarManutencao(i);
  }
}

function iniciarManutencao(i) {
  var d = BASE_TEARES[i];
  manutsAtivas[i] = {
    tearIndex:     i,
    startTime:     Date.now(),
    timerInterval: null,
    checklist:     {},
    obs:           ''
  };

  var btnW = document.getElementById('btn-wrench-'+i);
  var rt   = document.getElementById('rt-'+i);
  var btnF = document.getElementById('btn-finish-'+i);
  var tr   = document.getElementById('tr-'+i);
  if (btnW) btnW.classList.add('active');
  if (rt)   rt.style.display = 'inline';
  if (btnF) btnF.style.display = 'inline-flex';
  if (tr)   tr.style.background = 'rgba(249,115,22,0.06)';

  manutsAtivas[i].timerInterval = setInterval(function() {
    var manut = manutsAtivas[i]; if (!manut) return;
    var elapsed = Math.floor((Date.now() - manut.startTime) / 1000);
    var h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60), s = elapsed%60;
    var rtEl = document.getElementById('rt-'+i);
    if (rtEl) rtEl.textContent = (h>0?pad(h)+':':'')+pad(m)+':'+pad(s);
    if (clTearIndex === i && document.getElementById('modal-checklist').classList.contains('open')) {
      var mEl = document.getElementById('modal-timer');
      if (mEl) mEl.textContent = pad(h)+':'+pad(m)+':'+pad(s);
    }
  }, 1000);

  showToast('Manutencao iniciada — Tear '+d.tear);
  abrirChecklist(i);
}

function pad(n) { return n < 10 ? '0'+n : String(n); }

// =============================================================================
//  CHECKLIST MODAL
// =============================================================================
function abrirChecklist(i) {
  clTearIndex = i;
  var d     = BASE_TEARES[i];
  var manut = manutsAtivas[i];

  _setText('cl-title',  'Checklist — Tear '+d.tear);
  _setText('cl-modelo', d.modelo);

  if (manut) {
    var e = Math.floor((Date.now()-manut.startTime)/1000);
    var h=Math.floor(e/3600),m=Math.floor((e%3600)/60),s=e%60;
    _setText('modal-timer', pad(h)+':'+pad(m)+':'+pad(s));
  }

  var body = document.getElementById('cl-body');
  body.innerHTML = '';
  CHECKLIST_ITENS.forEach(function(item, idx) {
    var saved = (manut && manut.checklist[idx]) || {};
    var row = document.createElement('div');
    row.className = 'cl-row';
    row.innerHTML =
      '<div class="cl-item-name">'+item+'</div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-verif-'+idx+'"   '+(saved.verif   ?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-ajuste-'+idx+'"  '+(saved.ajuste  ?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-limpeza-'+idx+'" '+(saved.limpeza ?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-lubrif-'+idx+'"  '+(saved.lubrif  ?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-troca-'+idx+'"   '+(saved.troca   ?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div><input class="cl-qty" type="number" id="cl-qty-'+idx+'" value="'+(saved.qtde||'')+'" placeholder="-" onchange="clUpdate('+i+','+idx+')" min="0"></div>';
    body.appendChild(row);
  });

  var obsEl = document.getElementById('cl-obs');
  if (obsEl) obsEl.value = (manut && manut.obs) || '';

  atualizarProgressoCL(i);
  document.getElementById('modal-checklist').classList.add('open');
}

function clUpdate(tearIdx, itemIdx) {
  var manut = manutsAtivas[tearIdx]; if (!manut) return;
  manut.checklist[itemIdx] = {
    verif:   !!(document.getElementById('cl-verif-'+itemIdx)||{}).checked,
    ajuste:  !!(document.getElementById('cl-ajuste-'+itemIdx)||{}).checked,
    limpeza: !!(document.getElementById('cl-limpeza-'+itemIdx)||{}).checked,
    lubrif:  !!(document.getElementById('cl-lubrif-'+itemIdx)||{}).checked,
    troca:   !!(document.getElementById('cl-troca-'+itemIdx)||{}).checked,
    qtde:    ((document.getElementById('cl-qty-'+itemIdx)||{}).value||'')
  };
  atualizarProgressoCL(tearIdx);
}

function atualizarProgressoCL(tearIdx) {
  var manut = manutsAtivas[tearIdx]; if (!manut) return;
  var marcados = 0;
  CHECKLIST_ITENS.forEach(function(_,idx) {
    var s = manut.checklist[idx];
    if (s && (s.verif||s.ajuste||s.limpeza||s.lubrif||s.troca)) marcados++;
  });
  var total = CHECKLIST_ITENS.length;
  var pct   = Math.round((marcados/total)*100);
  var fill  = document.getElementById('cl-prog-fill');
  var txt   = document.getElementById('cl-prog-txt');
  if (fill) fill.style.width = pct+'%';
  if (txt)  txt.textContent  = marcados+' / '+total;
}

function fecharChecklist() {
  var obsEl = document.getElementById('cl-obs');
  if (obsEl && clTearIndex !== null && manutsAtivas[clTearIndex]) {
    manutsAtivas[clTearIndex].obs = obsEl.value;
  }
  document.getElementById('modal-checklist').classList.remove('open');
}

async function finalizarManutencao() {
  var i = clTearIndex;
  if (i === null || !manutsAtivas[i]) { fecharChecklist(); return; }

  var manut   = manutsAtivas[i];
  var d       = BASE_TEARES[i];
  var elapsed = Math.floor((Date.now() - manut.startTime) / 1000);
  var obsEl   = document.getElementById('cl-obs');
  var obs     = obsEl ? obsEl.value.trim() : '';

  // Captura estado final de todos os checkboxes
  CHECKLIST_ITENS.forEach(function(_, idx) { clUpdate(i, idx); });

  // Monta registro
  var registro = {
    tearIndex:  i,
    tear:       d.tear,
    modelo:     d.modelo,
    inicio:     new Date(manut.startTime).toISOString(),
    fim:        new Date().toISOString(),
    duracaoSeg: elapsed,
    tecnico:    currentUser ? (currentUser.displayName || currentUser.email) : 'desconhecido',
    obs:        obs,
    checklist:  JSON.parse(JSON.stringify(manut.checklist))
  };

  // Salva no Firestore
  if (usingFirebase && db && currentUser) {
    try {
      registro.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      var docRef = await histCol().add(registro);
      console.log('[Historico] salvo:', docRef.id);
      showSync('ok');
    } catch(e) {
      console.error('[Historico] erro ao salvar:', e);
      showSync('err');
      // Salva localmente como fallback
      var local = loadLocal();
      if (!local._historico) local._historico = [];
      local._historico.unshift(registro);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    }
  }

  // Atualiza data na linha
  var dEl  = document.getElementById('d-'+i);
  if (dEl) { dEl.value = new Date().toISOString().slice(0,10); onChange(i); }

  // Fecha modal e limpa estado
  fecharChecklist();
  clearInterval(manut.timerInterval);
  delete manutsAtivas[i];

  var btnW = document.getElementById('btn-wrench-'+i);
  var rt   = document.getElementById('rt-'+i);
  var btnF = document.getElementById('btn-finish-'+i);
  var tr   = document.getElementById('tr-'+i);
  if (btnW) btnW.classList.remove('active');
  if (rt)   { rt.style.display = 'none'; rt.textContent = '00:00'; }
  if (btnF) btnF.style.display = 'none';
  if (tr)   tr.style.background = '';

  var h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
  showToast('Concluido em '+pad(h)+'h'+pad(m)+'m'+pad(s)+'s — Tear '+d.tear);
}

// =============================================================================
//  HISTORICO
// =============================================================================
var _historicoTodos = [];

async function abrirHistorico() {
  document.getElementById('modal-historico').classList.add('open');
  document.getElementById('hist-body').innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';

  if (!usingFirebase || !db || !currentUser) {
    document.getElementById('hist-body').innerHTML = '<div class="empty-state"><p>Faca login para ver o historico.</p></div>';
    return;
  }

  try {
    // Tenta com orderBy (requer indice no Firestore)
    var snap;
    try {
      snap = await histCol().orderBy('inicio','desc').limit(100).get();
    } catch(e) {
      // Fallback sem orderBy se indice nao existir ainda
      console.warn('[Historico] sem indice, buscando sem ordenacao:', e.message);
      snap = await histCol().limit(100).get();
    }
    _historicoTodos = [];
    snap.forEach(function(doc) { _historicoTodos.push(doc.data()); });
    // Ordena no cliente
    _historicoTodos.sort(function(a,b){ return (b.inicio||'').localeCompare(a.inicio||''); });
    renderHistorico(_historicoTodos);
  } catch(e) {
    console.error('[Historico] erro:', e);
    document.getElementById('hist-body').innerHTML =
      '<div class="empty-state"><p>Erro ao carregar. Verifique as regras do Firestore.<br><small>'+e.message+'</small></p></div>';
  }
}

function fecharHistorico() { document.getElementById('modal-historico').classList.remove('open'); }

function filtrarHistorico(filtro, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var agora = new Date();
  var dados = _historicoTodos;
  if (filtro === 'mes') {
    dados = _historicoTodos.filter(function(r) {
      var d = new Date(r.inicio);
      return d.getMonth()===agora.getMonth() && d.getFullYear()===agora.getFullYear();
    });
  } else if (filtro === 'semana') {
    var ini = new Date(agora); ini.setDate(agora.getDate()-agora.getDay()); ini.setHours(0,0,0,0);
    dados = _historicoTodos.filter(function(r){ return new Date(r.inicio) >= ini; });
  }
  renderHistorico(dados);
}

function renderHistorico(lista) {
  var body = document.getElementById('hist-body');
  if (!lista || lista.length === 0) {
    body.innerHTML = '<div class="empty-state"><p>Nenhuma manutencao registrada neste periodo.</p></div>';
    return;
  }
  body.innerHTML = lista.map(function(r) {
    var dt    = new Date(r.inicio);
    var dtFmt = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    var dur   = r.duracaoSeg||0;
    var h=Math.floor(dur/3600),m=Math.floor((dur%3600)/60),s=dur%60;
    var durStr = h>0 ? pad(h)+'h '+pad(m)+'min' : pad(m)+'min '+pad(s)+'s';
    var itens = 0;
    if (r.checklist) Object.values(r.checklist).forEach(function(item){ if(item&&(item.verif||item.ajuste||item.limpeza||item.lubrif||item.troca)) itens++; });
    return '<div class="hist-item">'+
      '<div class="hist-head"><span class="hist-tear">Tear '+r.tear+'</span><span class="hist-modelo">'+r.modelo+'</span><span class="hist-date">'+dtFmt+'</span></div>'+
      '<div class="hist-meta">'+
        '<span>&#9201; <strong>'+durStr+'</strong></span>'+
        '<span>&#128295; <strong>'+itens+'/'+CHECKLIST_ITENS.length+' itens</strong></span>'+
        '<span>&#128100; <strong>'+(r.tecnico||'-')+'</strong></span>'+
      '</div>'+
      (r.obs ? '<div class="hist-obs">'+r.obs+'</div>' : '')+
    '</div>';
  }).join('');
}

// =============================================================================
//  NOTIFICACOES / EXPORT / PWA
// =============================================================================
async function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Sem suporte a notificacoes.'); return; }
  var perm = await Notification.requestPermission();
  if (perm === 'granted') { _setText('btn-notif','&#128276; Notificacoes ativas'); showToast('Notificacoes ativadas!'); scheduleNotifications(); }
}
function scheduleNotifications() { if (typeof Notification==='undefined'||Notification.permission!=='granted') return; checkNotify(); setInterval(checkNotify,86400000); }
function checkNotify() {
  var alerts = [];
  BASE_TEARES.forEach(function(d,i){ var s=getDados(i),r=s.realizado?parseFloat(s.realizado):d.realizado,v=s.real?parseFloat(s.real):null; if(r==null||v==null||d.rpm===0)return; var days=Math.round(((r+d.setup)-v)/d.rpm/60/24); if(days<=7&&!s.dataManut)alerts.push(d.tear); });
  if (!alerts.length) return;
  new Notification('Manutencao Preventiva',{body:alerts.length+' tear(es) precisam de manutencao em breve: '+alerts.join(', '),icon:'/icons/icon-192.png',tag:'mp-daily'});
}

function exportCSV() {
  var rows=[['Tear','Modelo','RPM','Setup','Data Manutencao','Realizado','Real (Voltas)','Saldo','Proxima','Status']];
  BASE_TEARES.forEach(function(d,i){
    var s=getDados(i),realizado=(s.realizado!==undefined&&s.realizado!=='')?parseFloat(s.realizado):(d.realizado||'');
    var real=s.real?parseFloat(s.real):'',dataMnt=s.dataManut||'';
    var proximo=realizado!==''?realizado+d.setup:'',saldo=real!==''&&proximo!==''?proximo-real:'';
    var fc='',status='';
    if(saldo!==''&&d.rpm>0){var fcDate=new Date(today.getTime()+(saldo/d.rpm/60/24)*86400000);fc=fcDate.toLocaleDateString('pt-BR');var days=Math.round((fcDate-today)/86400000);status=dataMnt?'Realizada':days<0?'Vencido':days<=30?'Atencao':'Em dia';}
    rows.push([d.tear,d.modelo,d.rpm,d.setup,dataMnt,realizado,real,saldo,fc,status]);
  });
  var csv=rows.map(function(r){return r.map(function(v){return'"'+v+'"';}).join(',');}).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='manutencao_'+today.toISOString().slice(0,10)+'.csv';a.click();
  URL.revokeObjectURL(url);showToast('CSV exportado!');
}

// =============================================================================
//  UI HELPERS
// =============================================================================
function showScreen(id) {
  ['screen-login','screen-app'].forEach(function(s){
    var el = document.getElementById(s); if (!el) return;
    el.style.display = (s===id) ? (id==='screen-login'?'flex':'block') : 'none';
  });
}
function showSync(state, extra) {
  var el = document.getElementById('sync-indicator'); if (!el) return;
  var m = {sync:['Sincronizando...','#7a8aaa'],ok:['Salvo na nuvem','#22c55e'],err:['Erro ao salvar','#ef4444'],realtime:['Atualizado por','#38bdf8']};
  var p = m[state]||m.ok;
  el.textContent = extra ? p[0]+' '+extra : p[0];
  el.style.color = p[1]; el.style.opacity = '1';
  if (state !== 'sync') setTimeout(function(){ el.style.opacity='0'; }, 4000);
}
function showToast(msg) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 3000);
}
function toggleMenu() { var m=document.getElementById('menu-dropdown'); if(m) m.classList.toggle('open'); }
document.addEventListener('click', function(e) {
  var menu=document.getElementById('menu-dropdown'), btn=document.getElementById('btn-menu');
  if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) menu.classList.remove('open');
});
function fmt(n)      { return (n!=null&&n!=='') ? Number(n).toLocaleString('pt-BR') : '-'; }
function fmtDate(str){ if(!str)return'-'; var p=str.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

// PWA
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferredPrompt=e; var btn=document.getElementById('btn-install'); if(btn)btn.style.display='flex'; });
async function installPWA() { if(!deferredPrompt)return; deferredPrompt.prompt(); var r=await deferredPrompt.userChoice; if(r.outcome==='accepted'){var btn=document.getElementById('btn-install');if(btn)btn.style.display='none';showToast('App instalado!');}deferredPrompt=null; }
window.addEventListener('appinstalled', function(){ var btn=document.getElementById('btn-install'); if(btn)btn.style.display='none'; });
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(function(e){ console.warn('[SW]',e); }); }

// =============================================================================
//  INIT
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  var btnSubmit = document.getElementById('btn-submit');     if(btnSubmit) btnSubmit.onclick = submitForm;
  var btnToggle = document.getElementById('btn-toggle-reg'); if(btnToggle) btnToggle.onclick = toggleTela;
  var btnForgot = document.getElementById('btn-forgot');     if(btnForgot) btnForgot.onclick = mostrarReset;
  var btnBack   = document.getElementById('btn-back');       if(btnBack)   btnBack.onclick   = mostrarLogin;
  var inputPass = document.getElementById('inp-pass');       if(inputPass) inputPass.addEventListener('keydown', function(e){ if(e.key==='Enter') submitForm(); });
  initFirebase();
});

// =============================================================================
//  NIVEIS DE ACESSO
//  Roles: 'admin' | 'tecnico' | 'operador'
//  Salvo em: /empresa/mpdoptex/usuarios/{uid}
// =============================================================================
var currentRole = 'admin'; // default mostra botoes; carregarRole ajusta depois

function usuariosCol() { return db.collection('empresa').doc(EMPRESA_ID).collection('usuarios'); }

async function carregarRole(uid) {
  if (!db) return;
  try {
    var doc = await usuariosCol().doc(uid).get();
    if (doc.exists && doc.data().role) {
      currentRole = doc.data().role;
    } else {
      // Primeiro usuario = admin, demais = operador
      var snap = await usuariosCol().get();
      currentRole = snap.empty ? 'admin' : 'operador';
      await usuariosCol().doc(uid).set({
        email: currentUser.email,
        nome:  currentUser.displayName || currentUser.email,
        role:  currentRole,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    aplicarRole();
  } catch(e) { console.warn('[Role]', e.message); currentRole = 'admin'; aplicarRole(); }
}

function aplicarRole() {
  var readonly = (currentRole === 'operador');
  document.querySelectorAll('.cell-input').forEach(function(el) {
    el.readOnly = readonly;
    el.style.opacity = readonly ? '0.6' : '1';
  });
  // Botoes de manutencao: buildTable ja gerencia por role
  // Aqui apenas garante readonly visual nos inputs

  // Badge de role no header
  var badge = document.getElementById('role-badge');
  var cores  = { admin:'#f97316', tecnico:'#38bdf8', operador:'#7a8aaa' };
  var labels = { admin:'Admin', tecnico:'Tecnico', operador:'Operador' };
  if (badge) {
    badge.textContent = labels[currentRole] || currentRole;
    badge.style.color = cores[currentRole] || '#7a8aaa';
  }
  // Menu de usuarios: so admin ve
  var menuUsers = document.getElementById('menu-usuarios');
  if (menuUsers) menuUsers.style.display = (currentRole === 'admin') ? 'flex' : 'none';
}

// =============================================================================
//  MODAL GERENCIAR USUARIOS (admin only)
// =============================================================================
var _listaUsuarios = [];

async function abrirGerenciarUsuarios() {
  var modal = document.getElementById('modal-usuarios');
  if (modal) modal.classList.add('open');
  var body  = document.getElementById('usuarios-body');
  if (body) body.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';
  if (!db || !currentUser) return;
  try {
    var snap = await usuariosCol().get();
    _listaUsuarios = [];
    snap.forEach(function(doc) { _listaUsuarios.push({ id: doc.id, ...doc.data() }); });
    renderUsuarios();
  } catch(e) {
    if (body) body.innerHTML = '<div class="empty-state"><p>Erro: '+e.message+'</p></div>';
  }
}

function fecharGerenciarUsuarios() {
  var modal = document.getElementById('modal-usuarios');
  if (modal) modal.classList.remove('open');
}

function renderUsuarios() {
  var body = document.getElementById('usuarios-body');
  if (!body) return;
  if (!_listaUsuarios.length) {
    body.innerHTML = '<div class="empty-state"><p>Nenhum usuario cadastrado.</p></div>';
    return;
  }
  var roleLabel = { admin:'Admin', tecnico:'Tecnico', operador:'Operador' };
  var roleColor = { admin:'var(--accent)', tecnico:'var(--info)', operador:'var(--muted)' };
  body.innerHTML = _listaUsuarios.map(function(u) {
    var isSelf = (u.id === currentUser.uid);
    return '<div class="usuario-row">'+
      '<div class="usuario-info">'+
        '<div class="usuario-nome">'+(u.nome||u.email)+(isSelf?' <span style="color:var(--muted);font-size:.7rem">(voce)</span>':'')+'</div>'+
        '<div class="usuario-email">'+u.email+'</div>'+
      '</div>'+
      '<div class="usuario-role-wrap">'+
        '<select class="usuario-role-sel" id="role-sel-'+u.id+'" onchange="salvarRole(\''+u.id+'\')" '+(isSelf?'disabled':'')+' style="color:'+roleColor[u.role||'operador']+'">'+
          ['admin','tecnico','operador'].map(function(r){
            return '<option value="'+r+'" '+(u.role===r?'selected':'')+'>'+roleLabel[r]+'</option>';
          }).join('')+
        '</select>'+
      '</div>'+
    '</div>';
  }).join('');
}

async function salvarRole(uid) {
  var sel = document.getElementById('role-sel-'+uid);
  if (!sel || !db) return;
  var novoRole = sel.value;
  try {
    await usuariosCol().doc(uid).update({ role: novoRole });
    _listaUsuarios.forEach(function(u){ if(u.id===uid) u.role=novoRole; });
    showToast('Permissao atualizada!');
    renderUsuarios();
  } catch(e) { showToast('Erro: '+e.message); }
}

// =============================================================================
//  DASHBOARD — LINHA DO TEMPO 30 DIAS + PECAS MAIS USADAS
// =============================================================================
async function abrirDashboard() {
  var modal = document.getElementById('modal-dashboard');
  if (modal) modal.classList.add('open');
  renderTimeline();
  await renderPecasUsadas();
}

function fecharDashboard() {
  var modal = document.getElementById('modal-dashboard');
  if (modal) modal.classList.remove('open');
}

function renderTimeline() {
  var container = document.getElementById('dash-timeline');
  if (!container) return;

  // Coleta teares com data prevista nos proximos 30 dias
  var eventos = [];
  BASE_TEARES.forEach(function(d, i) {
    var rVal = (document.getElementById('r-'+i)||{}).value;
    var vVal = (document.getElementById('v-'+i)||{}).value;
    var realizado = (rVal!==''&&rVal!=null) ? parseFloat(rVal) : (d.realizado!=null?d.realizado:null);
    var real      = (vVal!==''&&vVal!=null) ? parseFloat(vVal) : null;
    if (realizado === null || real === null || d.rpm === 0 || d.setup === 0) return;
    var saldo   = (realizado + d.setup) - real;
    var dias    = Math.round(saldo / d.rpm / 60 / 24);
    var fcDate  = new Date(today.getTime() + dias * 86400000);
    eventos.push({ tear: d.tear, modelo: d.modelo, dias: dias, data: fcDate, saldo: saldo });
  });

  // Ordena por dias
  eventos.sort(function(a,b){ return a.dias - b.dias; });

  if (!eventos.length) {
    container.innerHTML = '<div class="empty-state"><p>Preencha as leituras dos teares para ver a linha do tempo.</p></div>';
    return;
  }

  // Separa: vencidos, proximos 30d, futuros
  var vencidos = eventos.filter(function(e){ return e.dias < 0; });
  var proximos = eventos.filter(function(e){ return e.dias >= 0 && e.dias <= 30; });
  var futuros  = eventos.filter(function(e){ return e.dias > 30 && e.dias <= 60; });

  var html = '';

  if (vencidos.length) {
    html += '<div class="tl-section-title" style="color:var(--danger)">&#9888; Vencidos ('+vencidos.length+')</div>';
    html += vencidos.map(function(e){ return renderTLCard(e, 'danger'); }).join('');
  }

  if (proximos.length) {
    html += '<div class="tl-section-title" style="color:var(--accent)">&#128197; Proximos 30 dias ('+proximos.length+')</div>';
    // Mini linha do tempo visual
    html += '<div class="tl-ruler">';
    for (var d=0; d<=30; d+=5) {
      html += '<span class="tl-ruler-mark" style="left:'+((d/30)*100)+'%">'+(d===0?'Hoje':d+'d')+'</span>';
    }
    html += proximos.map(function(e) {
      var pct = Math.max(0, Math.min(100, (e.dias/30)*100));
      var col = e.dias<=5?'var(--danger)':e.dias<=15?'var(--warn)':'var(--ok)';
      return '<div class="tl-dot-wrap" style="left:'+pct+'%">'+
        '<div class="tl-dot" style="background:'+col+'" title="Tear '+e.tear+' — '+e.dias+'d"></div>'+
        '<div class="tl-dot-label">T'+e.tear+'</div>'+
      '</div>';
    }).join('');
    html += '</div>';
    html += proximos.map(function(e){ return renderTLCard(e, e.dias<=5?'danger':e.dias<=15?'warn':'ok'); }).join('');
  } else {
    html += '<div class="empty-state" style="padding:20px"><p>Nenhuma manutencao prevista nos proximos 30 dias. &#127881;</p></div>';
  }

  if (futuros.length) {
    html += '<div class="tl-section-title" style="color:var(--muted)">&#128336; Proximos 60 dias ('+futuros.length+')</div>';
    html += futuros.map(function(e){ return renderTLCard(e, 'muted'); }).join('');
  }

  container.innerHTML = html;
}

function renderTLCard(e, tipo) {
  var cores = { danger:'var(--danger)', warn:'var(--warn)', ok:'var(--ok)', muted:'var(--muted)', accent:'var(--accent)' };
  var cor   = cores[tipo] || 'var(--muted)';
  var label = e.dias < 0 ? Math.abs(e.dias)+'d atrasado' : e.dias === 0 ? 'Hoje!' : 'em '+e.dias+' dias';
  return '<div class="tl-card" style="border-left-color:'+cor+'">'+
    '<div class="tl-card-head">'+
      '<span class="tl-tear-num" style="color:'+cor+'">Tear '+e.tear+'</span>'+
      '<span class="tl-modelo">'+e.modelo+'</span>'+
      '<span class="tl-days" style="color:'+cor+'">'+label+'</span>'+
    '</div>'+
    '<div class="tl-date">'+e.data.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})+'</div>'+
  '</div>';
}

async function renderPecasUsadas() {
  var container = document.getElementById('dash-pecas');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';

  if (!db || !currentUser) {
    container.innerHTML = '<div class="empty-state"><p>Login necessario.</p></div>';
    return;
  }

  try {
    var snap;
    try { snap = await histCol().orderBy('inicio','desc').limit(200).get(); }
    catch(e) { snap = await histCol().limit(200).get(); }

    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum historico ainda. Complete manutencoes para ver as pecas mais trocadas.</p></div>';
      return;
    }

    // Conta apenas TROCAS com quantidade
    var contadores = {};
    CHECKLIST_ITENS.forEach(function(_, idx) {
      contadores[idx] = { trocas: 0, qtdeTotal: 0 };
    });

    var totalManutencoes = 0;
    snap.forEach(function(doc) {
      var r = doc.data();
      totalManutencoes++;
      if (!r.checklist) return;
      Object.keys(r.checklist).forEach(function(idx) {
        var item = r.checklist[idx];
        var i    = parseInt(idx);
        if (!contadores[i] || !item.troca) return;
        contadores[i].trocas++;
        var qtde = parseFloat(item.qtde);
        contadores[i].qtdeTotal += (qtde > 0 ? qtde : 1);
      });
    });

    // Ranking por numero de trocas, top 10
    var ranking = Object.keys(contadores).map(function(idx) {
      return {
        idx:       parseInt(idx),
        nome:      CHECKLIST_ITENS[idx],
        trocas:    contadores[idx].trocas,
        qtdeTotal: contadores[idx].qtdeTotal
      };
    }).filter(function(r){ return r.trocas > 0; })
      .sort(function(a,b){ return b.trocas - a.trocas; })
      .slice(0, 10);

    if (!ranking.length) {
      container.innerHTML = '<div class="empty-state"><p>Nenhuma troca registrada ainda.<br>Marque a coluna "Troca" no checklist para ver o ranking.</p></div>';
      return;
    }

    var maxTrocas = ranking[0].trocas;
    var html = '<div class="pecas-header">' +
      '<span>Pecas mais trocadas &mdash; baseado em <strong>' + totalManutencoes + '</strong> manutencao(oes)</span>' +
    '</div>';

    html += ranking.map(function(r, pos) {
      var pct    = Math.round((r.trocas / maxTrocas) * 100);
      var cor    = pos === 0 ? 'var(--accent)' : pos <= 2 ? 'var(--warn)' : 'var(--ok)';
      var qtdeTxt = r.qtdeTotal > r.trocas
        ? ' &mdash; <strong>' + r.qtdeTotal + '</strong> unid. trocadas'
        : '';
      return '<div class="peca-row">' +
        '<div class="peca-pos" style="color:' + cor + '">' + (pos + 1) + '</div>' +
        '<div class="peca-info">' +
          '<div class="peca-nome">' + r.nome + '</div>' +
          '<div class="peca-bar-wrap"><div class="peca-bar" style="width:' + pct + '%;background:' + cor + '"></div></div>' +
          '<div style="font-size:.72rem;color:var(--muted);margin-top:3px">Trocada em <strong style="color:' + cor + '">' + r.trocas + '</strong> manutencao(oes)' + qtdeTxt + '</div>' +
        '</div>' +
        '<div class="peca-total" style="color:' + cor + '">' + r.trocas + 'x</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar: ' + e.message + '</p></div>';
  }
}
// Dashboard tab switcher
function switchDashTab(tab, btn) {
  document.querySelectorAll('.dash-tab').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var tl = document.getElementById('dash-timeline');
  var pc = document.getElementById('dash-pecas');
  if (tab === 'timeline') {
    if (tl) tl.style.display = '';
    if (pc) pc.style.display = 'none';
  } else {
    if (tl) tl.style.display = 'none';
    if (pc) pc.style.display = '';
  }
}
