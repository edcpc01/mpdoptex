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
  { tear:1,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:44549291 },
  { tear:2,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:73387384 },
  { tear:3,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:70720455 },
  { tear:4,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:67412719 },
  { tear:5,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:39477421 },
  { tear:6,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:59023814 },
  { tear:7,  modelo:'ORIZIO 32" MONO',   rpm:28, setup:1600000, realizado:62379764 },
  { tear:8,  modelo:'ORIZIO 30" RIBANA', rpm:18, setup:1800000, realizado:23718297 },
  { tear:9,  modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:68330651 },
  { tear:10, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:75376480 },
  { tear:11, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:76636700 },
  { tear:12, modelo:'MAYER D4 34',       rpm:25, setup:0,       realizado:0        },
  { tear:13, modelo:'MAYER D4 34',       rpm:25, setup:0,       realizado:0        },
  { tear:14, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:13140009 },
  { tear:15, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:61891468 },
  { tear:16, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:64238816 },
  { tear:17, modelo:'ORIZIO 30" RIBANA', rpm:18, setup:1800000, realizado:55505199 },
  { tear:18, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:58552089 },
  { tear:19, modelo:'ORIZIO 42" MONO',   rpm:28, setup:1800000, realizado:53275086 },
  { tear:20, modelo:'ORIZIO CIC 34',     rpm:25, setup:1800000, realizado:null     },
  { tear:21, modelo:'ORIZIO CIC 34',     rpm:25, setup:1800000, realizado:null     },
  { tear:22, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     },
  { tear:23, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     },
  { tear:24, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     },
  { tear:25, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     },
  { tear:26, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     },
  { tear:27, modelo:'LEADSFON 34',       rpm:25, setup:1800000, realizado:null     }
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
// Reinicia 'today' usando fuso de SP
var _sp = nowBR(); today = new Date(_sp); today.setHours(0,0,0,0);

var db = null, auth = null, currentUser = null;
var firestoreData = {}, usingFirebase = false;
var today = new Date(); today.setHours(0,0,0,0);

// ── Fuso horário: America/Sao_Paulo (GMT-3) ──
var TZ = 'America/Sao_Paulo';
function nowBR() {
  // Retorna Date ajustado para GMT-3
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}
function isoLocalBR(date) {
  // Converte Date para string ISO no fuso de SP: "2026-02-25T22:30:00"
  var d = date || new Date();
  var sp = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
  var pad2 = function(n){ return String(n).padStart(2,'0'); };
  return sp.getFullYear() + '-' + pad2(sp.getMonth()+1) + '-' + pad2(sp.getDate()) +
    'T' + pad2(sp.getHours()) + ':' + pad2(sp.getMinutes()) + ':' + pad2(sp.getSeconds());
}
function dateBR(date) {
  // Retorna só a data "YYYY-MM-DD" no fuso de SP
  return isoLocalBR(date).slice(0,10);
}
var STORAGE_KEY = 'mp_preventiva_v4';
var EMPRESA_ID  = 'mpdoptex';
var _fbReady    = false;
var manutsAtivas = {};  // tearIndex -> { startTime, timerInterval, checklist, obs }
var _unsubTeares = null;
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

  // Verifica se Firebase inicializou
  if (typeof firebase === 'undefined') {
    _showErr('ERRO: Firebase SDK nao carregou. Verifique a conexao e recarregue a pagina.');
    return;
  }
  if (!auth) {
    _showErr('ERRO: Auth nao inicializado. Recarregue a pagina (F5).');
    console.error('[doLogin] auth=null, usingFirebase='+usingFirebase+', _fbReady='+_fbReady);
    return;
  }

  _setBtnSubmit('Aguarde...', true);
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    console.error('[doLogin] erro:', e.code, e.message);
    _showErr(traduzErro(e.code) + ' [' + (e.code||e.message) + ']');
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
  // 1. Para todos os listeners ANTES de fazer signOut
  if (_unsubManutsAtivas) { _unsubManutsAtivas(); _unsubManutsAtivas = null; }
  if (_unsubTeares)       { _unsubTeares();        _unsubTeares = null; }

  // 2. Remove manutenções locais ativas do Firestore
  var localKeys = Object.keys(manutsAtivas).filter(function(k){ return !manutsAtivas[k]._remote; });
  for (var k of localKeys) {
    clearInterval(manutsAtivas[k].timerInterval);
    await syncFinalizarManut(parseInt(k));
  }
  manutsAtivas = {};

  // 3. Faz logout
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
  await carregarTearesFirestore();
  await loadFirestore();
  await carregarRole(user.uid);
  buildTable();
  listenRealtime();
  listenManutsAtivas();    // escuta manutenções ativas de outros dispositivos
  await carregarManutsAtivas(); // carrega manutenções já em andamento
  scheduleNotifications();
  processarQRScan();
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
  _unsubTeares = tearCol().onSnapshot(function(snap) {
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
    obs:           '',
    fotos:         []
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

  // Sincroniza com outros dispositivos
  syncIniciarManut(i);

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
  // Reset carga fields
  var elAg = document.getElementById('cl-agulha-trocada');
  var elPl = document.getElementById('cl-platina-trocada');
  var elAgKg = document.getElementById('cl-agulha-kg');
  var elPlKg = document.getElementById('cl-platina-kg');
  var elAgW = document.getElementById('carga-agulha-kg-wrap');
  var elPlW = document.getElementById('carga-platina-kg-wrap');
  if (elAg)  elAg.checked = false;
  if (elPl)  elPl.checked = false;
  if (elAgKg) elAgKg.value = '';
  if (elPlKg) elPlKg.value = '';
  if (elAgW) elAgW.style.display = 'none';
  if (elPlW) elPlW.style.display = 'none';

  // Limpa datas anteriores e carrega do histórico async
  _setUltimaCarga('agulha', null);
  _setUltimaCarga('platina', null);
  _carregarUltimasCargasTear(d.tear);
}

function _setUltimaCarga(tipo, dataISO) {
  var elId = 'ultima-carga-' + tipo;
  var el = document.getElementById(elId);
  if (!el) return;
  if (!dataISO) {
    el.textContent = 'Buscando histórico...';
    el.style.color = 'var(--muted)';
    return;
  }
  var dt  = new Date(dataISO);
  var dtStr = dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  // Calcula dias atrás
  var diasAtras = Math.floor((nowBR() - dt) / 86400000);
  var diasStr   = diasAtras === 0 ? 'hoje' : diasAtras === 1 ? 'há 1 dia' : 'há ' + diasAtras + ' dias';
  el.textContent = 'Última troca: ' + dtStr + ' (' + diasStr + ')';
  el.style.color = diasAtras <= 30 ? 'var(--ok)' : diasAtras <= 90 ? 'var(--warn)' : 'var(--muted)';
}

async function _carregarUltimasCargasTear(tearNum) {
  if (!db || !currentUser) {
    _setUltimaCarga('agulha', 'sem-dados');
    _setUltimaCarga('platina', 'sem-dados');
    return;
  }
  try {
    var snap;
    try { snap = await histCol().where('tear','==',tearNum).orderBy('inicio','desc').limit(100).get(); }
    catch(e) { snap = await histCol().orderBy('inicio','desc').limit(300).get(); }

    var ultimaAgulha = null, ultimaPlatina = null;
    snap.forEach(function(doc) {
      var r = doc.data();
      if (r.tear !== tearNum) return; // fallback sem where
      if (!ultimaAgulha && r.cargaAgulha  && r.cargaAgulha.trocada)  ultimaAgulha  = r.fim || r.inicio;
      if (!ultimaPlatina && r.cargaPlatina && r.cargaPlatina.trocada) ultimaPlatina = r.fim || r.inicio;
    });

    var elAg = document.getElementById('ultima-carga-agulha');
    var elPl = document.getElementById('ultima-carga-platina');
    if (elAg) {
      if (ultimaAgulha) {
        _setUltimaCarga('agulha', ultimaAgulha);
      } else {
        elAg.textContent = 'Nenhum registro encontrado';
        elAg.style.color = 'var(--muted)';
      }
    }
    if (elPl) {
      if (ultimaPlatina) {
        _setUltimaCarga('platina', ultimaPlatina);
      } else {
        elPl.textContent = 'Nenhum registro encontrado';
        elPl.style.color = 'var(--muted)';
      }
    }
  } catch(e) {
    console.warn('[UltimaCarga]', e.message);
    var elAg = document.getElementById('ultima-carga-agulha');
    var elPl = document.getElementById('ultima-carga-platina');
    if (elAg) { elAg.textContent = 'Erro ao buscar'; elAg.style.color = 'var(--danger)'; }
    if (elPl) { elPl.textContent = 'Erro ao buscar'; elPl.style.color = 'var(--danger)'; }
  }
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

  // Captura dados de carga de agulhas/platinas
  var agulhaTrocada = document.getElementById('cl-agulha-trocada');
  var platinaTrocada = document.getElementById('cl-platina-trocada');
  var agulhaKg = document.getElementById('cl-agulha-kg');
  var platinaKg = document.getElementById('cl-platina-kg');
  var cargaAgulha = (agulhaTrocada && agulhaTrocada.checked) ? {
    trocada: true,
    kg: parseFloat((agulhaKg && agulhaKg.value) || '0') || 0
  } : null;
  var cargaPlatina = (platinaTrocada && platinaTrocada.checked) ? {
    trocada: true,
    kg: parseFloat((platinaKg && platinaKg.value) || '0') || 0
  } : null;

  // Captura fotos
  var fotos = (manut.fotos && manut.fotos.length) ? manut.fotos.slice() : [];

  // Monta registro
  var registro = {
    tearIndex:     i,
    tear:          d.tear,
    modelo:        d.modelo,
    inicio:        isoLocalBR(new Date(manut.startTime)),
    fim:           isoLocalBR(new Date()),
    duracaoSeg:    elapsed,
    tecnico:       currentUser ? (currentUser.displayName || currentUser.email) : 'desconhecido',
    obs:           obs,
    checklist:     JSON.parse(JSON.stringify(manut.checklist)),
    cargaAgulha:   cargaAgulha,
    cargaPlatina:  cargaPlatina,
    fotos:         fotos
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
  if (dEl) { dEl.value = dateBR(); onChange(i); }

  // Sincroniza fim com outros dispositivos
  await syncFinalizarManut(i);

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
    snap.forEach(function(doc) { var d = doc.data(); d._docId = doc.id; _historicoTodos.push(d); });
    // Ordena no cliente
    _historicoTodos.sort(function(a,b){ return (b.inicio||'').localeCompare(a.inicio||''); });
    _popularSelectTeares();
    _aplicarFiltrosHistorico();
  } catch(e) {
    console.error('[Historico] erro:', e);
    document.getElementById('hist-body').innerHTML =
      '<div class="empty-state"><p>Erro ao carregar. Verifique as regras do Firestore.<br><small>'+e.message+'</small></p></div>';
  }
}

function fecharHistorico() { document.getElementById('modal-historico').classList.remove('open'); }

var _filtroTempo = 'todos';
var _filtroTear  = '';

function filtrarHistorico(filtro, btn) {
  document.querySelectorAll('.tab-btn-tempo').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  _filtroTempo = filtro;
  _aplicarFiltrosHistorico();
}

function filtrarHistoricoTear(val) {
  _filtroTear = val;
  _aplicarFiltrosHistorico();
}

function _aplicarFiltrosHistorico() {
  var agora = nowBR();
  var dados = _historicoTodos;

  // Filtro de período
  if (_filtroTempo === 'mes') {
    dados = dados.filter(function(r) {
      var d = new Date(r.inicio);
      return d.getMonth()===agora.getMonth() && d.getFullYear()===agora.getFullYear();
    });
  } else if (_filtroTempo === 'semana') {
    var ini = new Date(agora); ini.setDate(agora.getDate()-agora.getDay()); ini.setHours(0,0,0,0);
    dados = dados.filter(function(r){ return new Date(r.inicio) >= ini; });
  }

  // Filtro por tear
  if (_filtroTear && _filtroTear !== '') {
    var tearNum = parseInt(_filtroTear);
    dados = dados.filter(function(r){ return r.tear === tearNum; });
  }

  renderHistorico(dados);
}

function renderHistorico(lista) {
  var body = document.getElementById('hist-body');
  if (!lista || lista.length === 0) {
    body.innerHTML = '<div class="empty-state"><p>Nenhuma manutencao registrada neste periodo.</p></div>';
    return;
  }
  // Atualiza contador
  var countEl = document.getElementById('hist-count');
  if (countEl) countEl.textContent = lista.length + ' registro' + (lista.length !== 1 ? 's' : '');

  body.innerHTML = lista.map(function(r) {
    var dt    = new Date(r.inicio);
    var dtFmt = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    var dur   = r.duracaoSeg||0;
    var h=Math.floor(dur/3600),m=Math.floor((dur%3600)/60),s=dur%60;
    var durStr = h>0 ? pad(h)+'h '+pad(m)+'min' : pad(m)+'min '+pad(s)+'s';
    var itens = 0;
    if (r.checklist) Object.values(r.checklist).forEach(function(item){ if(item&&(item.verif||item.ajuste||item.limpeza||item.lubrif||item.troca)) itens++; });
    var editadoInfo = r._editadoEm ? '<span style="color:var(--warn);font-size:.65rem">&#9998; Editado por '+r._editadoPor+' em '+new Date(r._editadoEm).toLocaleDateString('pt-BR')+' '+new Date(r._editadoEm).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</span>' : '';
    var btnEditar  = (currentRole === 'admin' && r._docId) ? '<button class="btn-editar-manut" onclick="abrirEditarManutencao(\'' + r._docId + '\')" title="Editar manutencao">&#9998; Editar</button>' : '';
    var btnExcluir = (currentRole === 'admin' && r._docId) ? '<button class="btn-excluir-manut" onclick="confirmarExcluirManutencao(\'' + r._docId + '\','+r.tear+')" title="Excluir registro">&#128465; Excluir</button>' : '';
    return '<div class="hist-item">'+
      '<div class="hist-head"><span class="hist-tear">Tear '+r.tear+'</span><span class="hist-modelo">'+r.modelo+'</span><span class="hist-date">'+dtFmt+'</span>'+btnEditar+btnExcluir+'</div>'+
      '<div class="hist-meta">'+
        '<span>&#9201; <strong>'+durStr+'</strong></span>'+
        '<span>&#128295; <strong>'+itens+'/'+CHECKLIST_ITENS.length+' itens</strong></span>'+
        '<span>&#128100; <strong>'+(r.tecnico||'-')+'</strong></span>'+
      '</div>'+
      (editadoInfo ? '<div style="padding:4px 0">'+editadoInfo+'</div>' : '')+
      (r.obs ? '<div class="hist-obs">'+r.obs+'</div>' : '')+
      (r.fotos && r.fotos.length ? '<div class="hist-fotos"><button class="btn-ver-fotos" onclick="verFotosHistorico(\''+r._docId+'\')">&#128247; '+r.fotos.length+' foto'+(r.fotos.length>1?'s':'')+' anexada'+(r.fotos.length>1?'s':'')+'</button></div>' : '')+
    '</div>';
  }).join('');
}

// =============================================================================
//  NOTIFICACOES / EXPORT / PWA
// =============================================================================
async function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Sem suporte a notificacoes.'); return; }
  var perm = await Notification.requestPermission();
  if (perm === 'granted') {
    var nb = document.getElementById('btn-notif');
    if (nb) nb.textContent = '\uD83D\uDD14 Notificacoes ativas';
    showToast('Notificacoes ativadas!');
    scheduleNotifications();
  }
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
  a.href=url;a.download='manutencao_'+dateBR()+'.csv';a.click();
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
// ── Vincula eventos dos botões de login ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Le ?tear=N da URL antes do login (QR scan)
  verificarQRScan();   //
  // Enter nos campos de login submete o formulário
  ['inp-email','inp-pass'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter') submitForm();
    });
  });

  // Inicializa Firebase
  initFirebase();
});

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
// Service Worker — cache offline + auto-update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function(reg) {

    // Detecta nova versao disponivel
    reg.addEventListener('updatefound', function() {
      var newSW = reg.installing;
      newSW.addEventListener('statechange', function() {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          _mostrarBannerUpdate(newSW);
        }
      });
    });

    // Verifica update a cada abertura do app
    reg.update();

  }).catch(function(err) { console.warn('[SW]', err); });

  // Recarrega automaticamente quando novo SW assume
  var _swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!_swRefreshing) { _swRefreshing = true; window.location.reload(); }
  });
}

function _mostrarBannerUpdate(newSW) {
  var old = document.getElementById('update-banner');
  if (old) return;
  var banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#f97316;color:#000;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:1rem;box-shadow:0 -4px 20px rgba(0,0,0,.4);flex-wrap:wrap';
  banner.innerHTML =
    '<span>&#9654; Nova versao disponivel!</span>' +
    '<div style="display:flex;gap:8px">' +
      '<button onclick="_aplicarUpdate()" style="background:#000;color:#f97316;border:none;padding:8px 18px;border-radius:6px;font-family:inherit;font-weight:800;font-size:.9rem;cursor:pointer">Atualizar agora</button>' +
      '<button onclick="_fecharBanner()" style="background:rgba(0,0,0,.2);color:#000;border:none;padding:8px 14px;border-radius:6px;font-family:inherit;font-size:.85rem;cursor:pointer">Mais tarde</button>' +
    '</div>';
  document.body.appendChild(banner);
  window._pendingSW = newSW;
}

function _aplicarUpdate() {
  var banner = document.getElementById('update-banner');
  if (banner) banner.innerHTML = '<span>&#8635; Atualizando...</span>';
  if (window._pendingSW) window._pendingSW.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
}
function _fecharBanner() {
  var b = document.getElementById('update-banner');
  if (b) b.remove();
}

function _mostrarBannerUpdate(newSW) {
  var banner = document.createElement('div');
  banner.id  = 'update-banner';
  banner.style.cssText = [
    'position:fixed;bottom:0;left:0;right:0;z-index:99999',
    'background:#f97316;color:#000;padding:14px 20px',
    'display:flex;align-items:center;justify-content:space-between;gap:12px',
    'font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:1rem',
    'box-shadow:0 -4px 20px rgba(0,0,0,.4);flex-wrap:wrap'
  ].join(';');
  banner.innerHTML =
    '<span>&#9654; Nova versao do app disponivel!</span>' +
    '<div style="display:flex;gap:8px">' +
      '<button onclick="_aplicarUpdate()" style="background:#000;color:#f97316;border:none;padding:8px 18px;border-radius:6px;font-family:inherit;font-weight:800;font-size:.9rem;cursor:pointer">Atualizar agora</button>' +
      '<button onclick="document.getElementById(\'update-banner\').remove()" style="background:rgba(0,0,0,.2);color:#000;border:none;padding:8px 14px;border-radius:6px;font-family:inherit;font-size:.85rem;cursor:pointer">Mais tarde</button>' +
    '</div>';
  document.body.appendChild(banner);
  window._pendingSW = newSW;
}

function _aplicarUpdate() {
  var banner = document.getElementById('update-banner');
  if (banner) banner.innerHTML = '<span>&#8635; Atualizando...</span>';
  if (window._pendingSW) {
    window._pendingSW.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
  }
};

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
  var menuUsers  = document.getElementById('menu-usuarios');
  var menuTeares = document.getElementById('menu-teares');
  if (menuUsers)  menuUsers.style.display  = (currentRole === 'admin') ? 'flex' : 'none';
  if (menuTeares) menuTeares.style.display = (currentRole === 'admin') ? 'flex' : 'none';
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

    // Ranking por qtdeTotal (unidades trocadas), top 10
    var ranking = Object.keys(contadores).map(function(idx) {
      return {
        idx:       parseInt(idx),
        nome:      CHECKLIST_ITENS[idx],
        trocas:    contadores[idx].trocas,
        qtdeTotal: contadores[idx].qtdeTotal
      };
    }).filter(function(r){ return r.trocas > 0; })
      .sort(function(a,b){ return b.qtdeTotal - a.qtdeTotal; })
      .slice(0, 10);

    if (!ranking.length) {
      container.innerHTML = '<div class="empty-state"><p>Nenhuma troca registrada ainda.<br>Marque a coluna "Troca" no checklist para ver o ranking.</p></div>';
      return;
    }

    var maxQtde = ranking[0].qtdeTotal || 1;
    var html = '<div class="pecas-header">' +
      '<span>Pecas mais trocadas &mdash; baseado em <strong>' + totalManutencoes + '</strong> manutencao(oes)</span>' +
    '</div>';

    html += ranking.map(function(r, pos) {
      var pct    = Math.round((r.qtdeTotal / maxQtde) * 100);
      var cor    = pos === 0 ? 'var(--accent)' : pos <= 2 ? 'var(--warn)' : 'var(--ok)';
      var vezesTxt = r.trocas === 1 ? '1 manutencao' : r.trocas + ' manutencoes';
      return '<div class="peca-row">' +
        '<div class="peca-pos" style="color:' + cor + '">' + (pos + 1) + '</div>' +
        '<div class="peca-info">' +
          '<div class="peca-nome">' + r.nome + '</div>' +
          '<div class="peca-bar-wrap"><div class="peca-bar" style="width:' + pct + '%;background:' + cor + '"></div></div>' +
          '<div style="font-size:.72rem;color:var(--muted);margin-top:3px">Em ' + vezesTxt + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div class="peca-total" style="color:' + cor + '">' + r.qtdeTotal + '</div>' +
          '<div style="font-size:.6rem;color:var(--muted)">unidades</div>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><p>Erro ao carregar: ' + e.message + '</p></div>';
  }
}
// Dashboard tab switcher
// =============================================================================
//  GERENCIAR TEARES (Admin only)
//  Salvo em: /empresa/mpdoptex/config/teares
// =============================================================================
var _tearesEditaveis = [];

function configCol() { return db.collection('empresa').doc(EMPRESA_ID).collection('config'); }

async function abrirGerenciarTeares() {
  var modal = document.getElementById('modal-teares');
  if (modal) modal.classList.add('open');
  var body = document.getElementById('teares-body');
  if (body) body.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';

  // Tenta carregar do Firestore, senão usa BASE_TEARES
  try {
    var doc = await configCol().doc('teares').get();
    if (doc.exists && doc.data().lista && doc.data().lista.length) {
      _tearesEditaveis = JSON.parse(JSON.stringify(doc.data().lista));
    } else {
      _tearesEditaveis = JSON.parse(JSON.stringify(BASE_TEARES));
    }
  } catch(e) {
    _tearesEditaveis = JSON.parse(JSON.stringify(BASE_TEARES));
  }
  renderTearesEditor();
}

function fecharGerenciarTeares() {
  var modal = document.getElementById('modal-teares');
  if (modal) modal.classList.remove('open');
}

function renderTearesEditor() {
  var body = document.getElementById('teares-body');
  if (!body) return;

  console.log('[Teares] renderizando', _tearesEditaveis.length, 'teares');
  console.log('[Teares] primeiro tear:', JSON.stringify(_tearesEditaveis[0]));

  // Toolbar
  var html = '<div class="teares-toolbar">' +
    '<button class="btn-add-tear" onclick="adicionarTear()">+ Adicionar Tear</button>' +
    '<span style="font-size:.72rem;color:var(--muted)">' + _tearesEditaveis.length + ' tear(es) cadastrado(s)</span>' +
  '</div>' +
  '<div class="teares-cards-wrap" id="teares-rows">';

  for (var i = 0; i < _tearesEditaveis.length; i++) {
    html += renderTearRow(_tearesEditaveis[i], i);
  }

  html += '</div>' +
  '<div class="teares-footer">' +
    '<button class="btn-save-teares" onclick="salvarTeares()">&#10003; Salvar Alteracoes</button>' +
    '<span style="font-size:.7rem;color:var(--muted)">As alteracoes afetam todos os usuarios</span>' +
  '</div>';

  body.innerHTML = html;

  // Preenche os inputs via JS DEPOIS do innerHTML (evita problema de aspas no value="")
  for (var j = 0; j < _tearesEditaveis.length; j++) {
    var t = _tearesEditaveis[j];
    var prefix = 'tr-' + j + '-';
    var elModelo   = document.getElementById(prefix + 'modelo');
    var elNum      = document.getElementById(prefix + 'num');
    var elRpm      = document.getElementById(prefix + 'rpm');
    var elSetup    = document.getElementById(prefix + 'setup');
    var elRealiz   = document.getElementById(prefix + 'realizado');
    if (elModelo)  elModelo.value  = t.modelo  || '';
    if (elNum)     elNum.value     = t.tear     != null ? t.tear    : '';
    if (elRpm)     elRpm.value     = t.rpm      != null ? t.rpm     : '';
    if (elSetup)   elSetup.value   = t.setup    != null ? t.setup   : '';
    if (elRealiz)  elRealiz.value  = t.realizado != null ? t.realizado : '';
  }
}

function renderTearRow(t, i) {
  var prefix = 'tr-' + i + '-';
  // Usa IDs para preencher valores via JS depois (evita problema de aspas no HTML)
  return '<div class="tear-card" id="tear-row-' + i + '">' +
    '<div class="tear-card-head">' +
      '<div class="tear-card-badge">Tear <strong>' + (t.tear || (i+1)) + '</strong></div>' +
      '<button class="btn-del-inline" onclick="removerTear(' + i + ')">&#10005; Remover</button>' +
    '</div>' +
    '<div class="tear-card-fields">' +
      '<div class="tear-field-full">' +
        '<label class="tear-field-lbl">Modelo</label>' +
        '<input class="tear-inp" id="' + prefix + 'modelo" type="text" placeholder="Ex: ORIZIO 32 MONO" onchange="updateTear(' + i + ',\'modelo\',this.value)">' +
      '</div>' +
      '<div class="tear-field-half">' +
        '<label class="tear-field-lbl">Nr do Tear</label>' +
        '<input class="tear-inp" id="' + prefix + 'num" type="number" min="1" onchange="updateTear(' + i + ',\'tear\',this.value)">' +
      '</div>' +
      '<div class="tear-field-half">' +
        '<label class="tear-field-lbl">RPM</label>' +
        '<input class="tear-inp" id="' + prefix + 'rpm" type="number" min="0" onchange="updateTear(' + i + ',\'rpm\',this.value)">' +
      '</div>' +
      '<div class="tear-field-half">' +
        '<label class="tear-field-lbl">Setup (voltas)</label>' +
        '<input class="tear-inp" id="' + prefix + 'setup" type="number" min="0" onchange="updateTear(' + i + ',\'setup\',this.value)">' +
      '</div>' +
      '<div class="tear-field-half">' +
        '<label class="tear-field-lbl">Realizado (voltas)</label>' +
        '<input class="tear-inp" id="' + prefix + 'realizado" type="number" min="0" placeholder="0" onchange="updateTear(' + i + ',\'realizado\',this.value)">' +
      '</div>' +
    '</div>' +
  '</div>';
}

function updateTear(i, campo, valor) {
  if (!_tearesEditaveis[i]) return;
  if (campo === 'tear' || campo === 'rpm' || campo === 'setup' || campo === 'realizado') {
    _tearesEditaveis[i][campo] = valor === '' ? null : Number(valor);
  } else {
    _tearesEditaveis[i][campo] = valor;
  }
}

function adicionarTear() {
  var ultimo = _tearesEditaveis[_tearesEditaveis.length-1];
  var novoNum = ultimo ? (ultimo.tear + 1) : 1;
  _tearesEditaveis.push({ tear: novoNum, modelo: '', rpm: 28, setup: 1800000, realizado: null });
  // Adiciona o novo card sem re-renderizar tudo
  var wrap = document.getElementById('teares-rows');
  if (wrap) {
    var newIdx = _tearesEditaveis.length - 1;
    var tmp = document.createElement('div');
    tmp.innerHTML = renderTearRow(_tearesEditaveis[newIdx], newIdx);
    var newCard = tmp.firstChild;
    wrap.appendChild(newCard);
    // Preenche valores via JS (evita problema com aspas)
    var prefix = 'tr-' + newIdx + '-';
    var nt = _tearesEditaveis[newIdx];
    var el;
    el = document.getElementById(prefix+'modelo');   if(el) el.value = nt.modelo || '';
    el = document.getElementById(prefix+'num');      if(el) el.value = nt.tear != null ? nt.tear : '';
    el = document.getElementById(prefix+'rpm');      if(el) el.value = nt.rpm != null ? nt.rpm : '';
    el = document.getElementById(prefix+'setup');    if(el) el.value = nt.setup != null ? nt.setup : '';
    el = document.getElementById(prefix+'realizado');if(el) el.value = '';
    newCard.scrollIntoView({behavior:'smooth'});
  }
  // Atualiza contador
  var toolbar = document.querySelector('.teares-toolbar span');
  if (toolbar) toolbar.textContent = _tearesEditaveis.length + ' tear(es) cadastrado(s)';
}

function removerTear(i) {
  if (!confirm('Remover Tear ' + _tearesEditaveis[i].tear + '?')) return;
  _tearesEditaveis.splice(i, 1);
  renderTearesEditor(); // Re-renderiza com indices corrigidos
}

async function salvarTeares() {
  if (!db || !currentUser) { showToast('Sem conexao.'); return; }
  var btnSave = document.querySelector('.btn-save-teares');
  if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Salvando...'; }

  // Valida campos obrigatorios
  var invalidos = _tearesEditaveis.filter(function(t){ return !t.modelo || !t.modelo.trim(); });
  if (invalidos.length) {
    showToast('Preencha o modelo de todos os teares!');
    if (btnSave) { btnSave.disabled = false; btnSave.textContent = '✓ Salvar Alteracoes'; }
    return;
  }

  // Ordena por numero de tear
  _tearesEditaveis.sort(function(a,b){ return a.tear - b.tear; });

  try {
    await configCol().doc('teares').set({
      lista:       _tearesEditaveis,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      atualizadoPor: currentUser.displayName || currentUser.email
    });
    // Atualiza BASE_TEARES em memoria e reconstroi tabela
    BASE_TEARES.length = 0;
    _tearesEditaveis.forEach(function(t){ BASE_TEARES.push(t); });
    buildTable();
    showToast('Teares salvos! Tabela atualizada.');
    fecharGerenciarTeares();
  } catch(e) {
    showToast('Erro ao salvar: ' + e.message);
    if (btnSave) { btnSave.disabled = false; btnSave.textContent = '✓ Salvar Alteracoes'; }
  }
}

// Carrega teares do Firestore ao iniciar (substitui BASE_TEARES se houver config salva)
async function carregarTearesFirestore() {
  if (!db) return;
  try {
    var doc = await configCol().doc('teares').get();
    if (doc.exists && doc.data().lista && doc.data().lista.length) {
      BASE_TEARES.length = 0;
      doc.data().lista.forEach(function(t){ BASE_TEARES.push(t); });
      console.log('[Teares] Carregados do Firestore:', BASE_TEARES.length, 'teares');
    }
  } catch(e) { console.warn('[Teares]', e.message); }
}

// =============================================================================
//  DASHBOARD — GRAFICOS (manutencoes por mes + tempo medio)
// =============================================================================
async function renderGraficos() {
  var container = document.getElementById('dash-graficos');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';
  if (!db || !currentUser) { container.innerHTML = '<div class="empty-state"><p>Login necessario.</p></div>'; return; }

  try {
    var snap;
    try { snap = await histCol().orderBy('inicio','desc').limit(500).get(); }
    catch(e) { snap = await histCol().limit(500).get(); }

    if (snap.empty) { container.innerHTML = '<div class="empty-state"><p>Nenhuma manutencao registrada ainda.</p></div>'; return; }

    var registros = [];
    snap.forEach(function(d){ registros.push(d.data()); });
    registros.sort(function(a,b){ return (a.inicio||'').localeCompare(b.inicio||''); });

    // Agrupa por mes (ultimos 12)
    var porMes = {};
    registros.forEach(function(r) {
      var d = new Date(r.inicio);
      var key = d.getFullYear()+'-'+pad(d.getMonth()+1);
      if (!porMes[key]) porMes[key] = { count:0, durTotal:0 };
      porMes[key].count++;
      porMes[key].durTotal += (r.duracaoSeg||0);
    });

    // Ultimos 12 meses
    var meses = [];
    for (var m=11; m>=0; m--) {
      var d = new Date(today); d.setMonth(d.getMonth()-m);
      var key = d.getFullYear()+'-'+pad(d.getMonth()+1);
      var nomeMes = d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'});
      meses.push({ key:key, label:nomeMes, count:(porMes[key]||{}).count||0, durTotal:(porMes[key]||{}).durTotal||0 });
    }

    var maxCount = Math.max.apply(null, meses.map(function(m){ return m.count; })) || 1;
    var totalManut = registros.length;
    var durMedia   = totalManut > 0 ? Math.round(registros.reduce(function(s,r){ return s+(r.duracaoSeg||0); },0)/totalManut) : 0;
    var mesAtual   = meses[meses.length-1].count;

    // Tempo medio por tear
    var porTear = {};
    registros.forEach(function(r) {
      var k = r.tear;
      if (!porTear[k]) porTear[k] = { count:0, dur:0 };
      porTear[k].count++; porTear[k].dur += (r.duracaoSeg||0);
    });
    var tearMedias = Object.keys(porTear).map(function(t){
      return { tear:t, media: Math.round(porTear[t].dur/porTear[t].count), count: porTear[t].count };
    }).sort(function(a,b){ return b.media-a.media; }).slice(0,8);

    var h = durMedia > 0 ? Math.floor(durMedia/3600) : 0;
    var mi = Math.floor((durMedia%3600)/60);
    var durStr = h>0 ? h+'h '+pad(mi)+'min' : mi+'min';

    var html = '<div class="chart-stats-row">'+
      '<div class="chart-stat"><div class="chart-stat-val">'+totalManut+'</div><div class="chart-stat-lbl">Total manutencoes</div></div>'+
      '<div class="chart-stat"><div class="chart-stat-val">'+mesAtual+'</div><div class="chart-stat-lbl">Este mes</div></div>'+
      '<div class="chart-stat"><div class="chart-stat-val">'+durStr+'</div><div class="chart-stat-lbl">Duracao media</div></div>'+
    '</div>';

    // Grafico de barras por mes
    html += '<div class="chart-wrap"><div class="chart-title">Manutencoes por mes (ultimos 12 meses)</div>';
    html += '<div class="chart-bars">';
    meses.forEach(function(m) {
      var pct = Math.round((m.count/maxCount)*100);
      var col = m.count===0?'rgba(42,53,80,.5)':'var(--accent)';
      html += '<div class="chart-bar-col">'+
        '<div class="chart-bar-val">'+(m.count||'')+'</div>'+
        '<div class="chart-bar" style="height:'+Math.max(pct,2)+'%;background:'+col+'">'+
          (m.count>0?'<div class="chart-tooltip">'+m.label+': '+m.count+' manut.</div>':'')+
        '</div>'+
        '<div class="chart-bar-lbl">'+m.label+'</div>'+
      '</div>';
    });
    html += '</div></div>';

    // Tempo medio por tear
    if (tearMedias.length) {
      var maxMedia = tearMedias[0].media || 1;
      html += '<div class="chart-wrap"><div class="chart-title">Tempo medio de manutencao por tear (top 8)</div>';
      html += tearMedias.map(function(t) {
        var hh=Math.floor(t.media/3600), mm=Math.floor((t.media%3600)/60);
        var tStr = hh>0?hh+'h '+pad(mm)+'min':pad(mm)+'min';
        var pct = Math.round((t.media/maxMedia)*100);
        return '<div style="margin-bottom:10px">'+
          '<div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:4px">'+
            '<span style="color:var(--text)">Tear <strong>'+t.tear+'</strong> <span style="color:var(--muted)">('+t.count+'x)</span></span>'+
            '<span style="color:var(--accent);font-family:\'Barlow Condensed\',sans-serif;font-weight:700">'+tStr+'</span>'+
          '</div>'+
          '<div class="tec-bar-wrap"><div class="tec-bar" style="width:'+pct+'%;background:var(--info)"></div></div>'+
        '</div>';
      }).join('');
      html += '</div>';
    }

    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<div class="empty-state"><p>Erro: '+e.message+'</p></div>'; }
}

// =============================================================================
//  DASHBOARD — TECNICOS (ranking + comparativo)
// =============================================================================
async function renderTecnicos() {
  var container = document.getElementById('dash-tecnicos');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';
  if (!db || !currentUser) { container.innerHTML = '<div class="empty-state"><p>Login necessario.</p></div>'; return; }

  try {
    var snap;
    try { snap = await histCol().orderBy('inicio','desc').limit(500).get(); }
    catch(e) { snap = await histCol().limit(500).get(); }

    if (snap.empty) { container.innerHTML = '<div class="empty-state"><p>Nenhuma manutencao registrada.</p></div>'; return; }

    var porTec = {};
    snap.forEach(function(doc) {
      var r   = doc.data();
      var tec = r.tecnico || 'Desconhecido';
      if (!porTec[tec]) porTec[tec] = { count:0, durTotal:0, teares:new Set(), ultimaData:'' };
      porTec[tec].count++;
      porTec[tec].durTotal += (r.duracaoSeg||0);
      if (r.tear) porTec[tec].teares.add(r.tear);
      if ((r.inicio||'') > porTec[tec].ultimaData) porTec[tec].ultimaData = r.inicio||'';
    });

    var ranking = Object.keys(porTec).map(function(nome) {
      var t = porTec[nome];
      var media = t.count>0 ? Math.round(t.durTotal/t.count) : 0;
      return { nome:nome, count:t.count, media:media, teares:t.teares.size, ultimaData:t.ultimaData };
    }).sort(function(a,b){ return b.count-a.count; });

    var maxCount = ranking[0].count || 1;
    var cores = ['var(--accent)','var(--warn)','var(--info)'];

    var html = '<div class="pecas-header"><span>Ranking de tecnicos &mdash; '+ranking.length+' tecnico(s) cadastrado(s)</span></div>';
    html += ranking.map(function(t, pos) {
      var cor  = cores[pos] || 'var(--ok)';
      var pct  = Math.round((t.count/maxCount)*100);
      var hh=Math.floor(t.media/3600), mm=Math.floor((t.media%3600)/60);
      var mediaStr = hh>0?hh+'h '+pad(mm)+'min':mm+'min';
      var ultDt = t.ultimaData ? new Date(t.ultimaData).toLocaleDateString('pt-BR') : '-';
      return '<div class="tec-row">'+
        '<div class="tec-rank" style="color:'+cor+'">'+(pos+1)+'</div>'+
        '<div class="tec-info">'+
          '<div class="tec-nome">'+t.nome+'</div>'+
          '<div class="tec-bar-wrap"><div class="tec-bar" style="width:'+pct+'%;background:'+cor+'"></div></div>'+
          '<div class="tec-meta">'+
            '<span>&#128295; <strong>'+t.count+'</strong> manutencoes</span>'+
            '<span>&#9201; media <strong>'+mediaStr+'</strong></span>'+
            '<span>Teares: <strong>'+t.teares+'</strong></span>'+
            '<span>Ultima: <strong>'+ultDt+'</strong></span>'+
          '</div>'+
        '</div>'+
        '<div><div class="tec-total" style="color:'+cor+'">'+t.count+'</div><div class="tec-total-lbl">manut.</div></div>'+
      '</div>';
    }).join('');

    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<div class="empty-state"><p>Erro: '+e.message+'</p></div>'; }
}

// =============================================================================
//  QR CODES
// =============================================================================
function abrirQRCodes() {
  var modal = document.getElementById('modal-qr');
  if (modal) modal.classList.add('open');
  var body = document.getElementById('qr-body');
  if (body) body.innerHTML = '<div class="empty-state"><p>Gerando QR Codes...</p></div>';
  setTimeout(function() { _renderQRGrid(body); }, 100);
}

// Gera QR Code via Google Charts API (sem biblioteca externa)
function _qrImgErr(img) {
  img.style.display = 'none';
  var fb = img.nextSibling;
  if (fb) fb.style.display = 'block';
}
function _qrUrl(text) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=4&data=' + encodeURIComponent(text);
}

function _renderQRGrid(body) {
  var baseUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '');
  var html = '<div class="qr-grid">';
  BASE_TEARES.forEach(function(d, i) {
    var url = baseUrl + '?tear=' + d.tear;
    html += '<div class="qr-card" id="qr-card-' + i + '">' +
      '<img src="' + _qrUrl(url) + '" class="qr-canvas" width="130" height="130" ' +
        'alt="QR Tear ' + d.tear + '" ' +
        'onerror="_qrImgErr(this)">' +
      '<div style="display:none;background:#fff;padding:6px;border-radius:4px;font-size:.5rem;word-break:break-all;color:#000;width:120px">' + url + '</div>' +
      '<div class="qr-tear-num">Tear ' + d.tear + '</div>' +
      '<div class="qr-modelo">' + d.modelo + '</div>' +
      '<button onclick="imprimirQRIndividual(' + i + ')" ' +
        'style="margin-top:4px;background:none;border:1px solid var(--border);color:var(--muted);font-size:.65rem;padding:3px 10px;border-radius:6px;cursor:pointer">' +
        '&#128438; Imprimir' +
      '</button>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}
function fecharQRCodes() {
  var modal = document.getElementById('modal-qr');
  if (modal) modal.classList.remove('open');
}

function imprimirQRIndividual(i) {
  var d   = BASE_TEARES[i];
  if (!d) return;
  var url = window.location.origin + window.location.pathname.replace(/\/+$/, '') + '?tear=' + d.tear;
  var qrSrc = _qrUrl(url);
  var win = window.open('', '_blank', 'width=360,height=460');
  win.document.write('<!DOCTYPE html><html><head><title>QR Tear '+d.tear+'</title>'+
    '<style>'+
    'body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}'+
    '.et{border:2px solid #000;border-radius:8px;padding:14px;text-align:center;width:190px}'+
    'img{width:160px;height:160px;display:block;margin:0 auto 8px}'+
    '.num{font-size:1.4rem;font-weight:900}'+
    '.mod{font-size:.68rem;color:#555;margin-top:4px;line-height:1.4}'+
    '</style></head><body>'+
    '<div class="et">'+
    '<img src="'+qrSrc+'" onload="window.print()">'+
    '<div class="num">TEAR '+d.tear+'</div>'+
    '<div class="mod">'+d.modelo+'</div>'+
    '</div></body></html>');
  win.document.close();
}

function imprimirQRCodes() {
  var baseUrl = window.location.origin + window.location.pathname.replace(/[/]+$/, '');
  var cards = '';
  BASE_TEARES.forEach(function(d) {
    var url   = baseUrl + '?tear=' + d.tear;
    var qrSrc = _qrUrl(url);
    cards += '<div class="card">' +
      '<img src="' + qrSrc + '">' +
      '<div class="num">TEAR ' + d.tear + '</div>' +
      '<div class="mod">' + d.modelo + '</div>' +
    '</div>';
  });

  var html = '<!DOCTYPE html><html><head><title>QR Codes Teares</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;margin:16px;background:#fff;color:#000}' +
    'h2{font-size:1rem;margin-bottom:12px}' +
    '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}' +
    '.card{border:1px solid #bbb;border-radius:6px;padding:10px;text-align:center;break-inside:avoid}' +
    'img{width:120px;height:120px;display:block;margin:0 auto 6px}' +
    '.num{font-weight:900;font-size:1rem}' +
    '.mod{font-size:.62rem;color:#555;margin-top:2px;line-height:1.3}' +
    '@media print{.no-print{display:none!important}}' +
    '</style></head><body>' +
    '<div class="no-print" style="margin-bottom:12px">' +
      '<strong>QR Codes — Manutencao Preventiva</strong> &nbsp;' +
      '<button onclick="window.print()" style="padding:5px 14px;cursor:pointer">Imprimir / PDF</button>' +
    '</div>' +
    '<div class="grid">' + cards + '</div>' +
    '</body></html>';

  // Abre em iframe overlay (sem popup bloqueado)
  var old = document.getElementById('qr-print-frame');
  if (old) old.remove();
  var frame = document.createElement('iframe');
  frame.id = 'qr-print-frame';
  frame.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:#fff';
  document.body.appendChild(frame);
  frame.contentDocument.open();
  frame.contentDocument.write(html);
  frame.contentDocument.close();
  // Botao fechar
  var btn = frame.contentDocument.createElement('button');
  btn.textContent = 'X Fechar';
  btn.style.cssText = 'position:fixed;top:12px;right:12px;padding:6px 14px;cursor:pointer;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:.85rem;z-index:999';
  btn.onclick = function(){ document.getElementById('qr-print-frame').remove(); };
  frame.contentDocument.body.appendChild(btn);
}

// Verifica se URL tem ?tear=N ao carregar (QR scan)
function verificarQRScan() {
  var params = new URLSearchParams(window.location.search);
  var tearNum = params.get('tear');
  if (!tearNum) return;
  // Guarda para abrir checklist apos login
  window._qrTear = parseInt(tearNum);
}

// Chamado apos login se vier de QR scan
function processarQRScan() {
  if (!window._qrTear) return;
  var tearNum = window._qrTear;
  window._qrTear = null;
  var idx = BASE_TEARES.findIndex(function(d){ return d.tear === tearNum; });
  if (idx < 0) { showToast('Tear ' + tearNum + ' nao encontrado.'); return; }
  if (currentRole === 'operador') { showToast('Sem permissao para iniciar manutencao.'); return; }
  showToast('QR - Tear ' + tearNum + '. Abrindo checklist...');
  setTimeout(function() {
    if (manutsAtivas[idx]) { abrirChecklist(idx); }
    else { iniciarManutencao(idx); }
    window.history.replaceState({}, document.title, window.location.pathname);
  }, 1000);
}

// =============================================================================
//  RELATORIO PDF MENSAL
// =============================================================================
// =============================================================================
//  RELATORIO PDF — intervalo de datas + KPIs globais
// =============================================================================
function abrirRelatorioPDF() {
  var modal = document.getElementById('modal-pdf');
  if (modal) modal.classList.add('open');
  // Define período padrão: início do mês até hoje
  var hoje = new Date();
  var ini  = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  var iniStr = dateBR(ini);
  var fimStr = dateBR(hoje);
  var inEl = document.getElementById('pdf-data-ini');
  var fmEl = document.getElementById('pdf-data-fim');
  if (inEl) inEl.value = iniStr;
  if (fmEl) fmEl.value = fimStr;
  document.getElementById('pdf-preview').innerHTML =
    '<div class="empty-state"><p>Selecione o periodo e clique em "Gerar Relatorio".</p></div>';
}

function fecharPDF() {
  var modal = document.getElementById('modal-pdf');
  if (modal) modal.classList.remove('open');
}

async function gerarPDF() {
  var iniEl = document.getElementById('pdf-data-ini');
  var fimEl = document.getElementById('pdf-data-fim');
  if (!iniEl || !iniEl.value || !fimEl || !fimEl.value) { showToast('Selecione o periodo.'); return; }
  var dataIni = new Date(iniEl.value + 'T00:00:00');
  var dataFim = new Date(fimEl.value + 'T23:59:59');
  if (dataIni > dataFim) { showToast('Data inicial maior que a final.'); return; }
  var preview = document.getElementById('pdf-preview');
  preview.innerHTML = '<div class="empty-state"><p>Carregando dados...</p></div>';
  if (!db || !currentUser) { preview.innerHTML = '<div class="empty-state"><p>Login necessario.</p></div>'; return; }

  try {
    var snap;
    try { snap = await histCol().orderBy('inicio','desc').limit(1000).get(); }
    catch(e) { snap = await histCol().limit(1000).get(); }

    // Filtra pelo intervalo
    var registros = [];
    snap.forEach(function(doc) {
      var r = doc.data();
      var d = new Date(r.inicio);
      if (d >= dataIni && d <= dataFim) registros.push(r);
    });

    var periodoStr = dataIni.toLocaleDateString('pt-BR') + ' a ' + dataFim.toLocaleDateString('pt-BR');

    // ── KPIs ──
    var totalManut  = registros.length;
    var durTotal    = registros.reduce(function(s,r){ return s+(r.duracaoSeg||0); }, 0);
    var durMedia    = totalManut > 0 ? Math.round(durTotal/totalManut) : 0;
    var hm=Math.floor(durMedia/3600), mm=Math.floor((durMedia%3600)/60);
    var durStr      = hm>0 ? hm+'h '+pad(mm)+'min' : mm+'min';

    // Peças trocadas
    var pecasContador = {};
    var totalPecasUnid = 0;
    registros.forEach(function(r) {
      if (!r.checklist) return;
      Object.keys(r.checklist).forEach(function(idx) {
        var item = r.checklist[idx];
        if (!item || !item.troca) return;
        var nome = CHECKLIST_ITENS[parseInt(idx)] || 'Item '+idx;
        var qtde = parseFloat(item.qtde)||1;
        pecasContador[nome] = (pecasContador[nome]||0) + qtde;
        totalPecasUnid += qtde;
      });
    });
    var topPecas = Object.keys(pecasContador)
      .map(function(n){ return {nome:n, qtde:pecasContador[n]}; })
      .sort(function(a,b){ return b.qtde-a.qtde; })
      .slice(0,10);

    // Kg por carga de agulhas / platinas por tear
    var cargasPorTear = {};
    registros.forEach(function(r) {
      var k = r.tear;
      if (!cargasPorTear[k]) cargasPorTear[k] = { tear:k, modelo:r.modelo, agulhas:[], platinas:[] };
      if (r.cargaAgulha  && r.cargaAgulha.trocada  && r.cargaAgulha.kg  > 0) cargasPorTear[k].agulhas.push(r.cargaAgulha.kg);
      if (r.cargaPlatina && r.cargaPlatina.trocada && r.cargaPlatina.kg > 0) cargasPorTear[k].platinas.push(r.cargaPlatina.kg);
    });
    var tearesComCarga = Object.values(cargasPorTear)
      .filter(function(t){ return t.agulhas.length||t.platinas.length; })
      .sort(function(a,b){ return a.tear-b.tear; });

    var mediaGlobalAg = 0, mediaGlobalPl = 0, nAg=0, nPl=0;
    Object.values(cargasPorTear).forEach(function(t){
      t.agulhas.forEach(function(v){ mediaGlobalAg+=v; nAg++; });
      t.platinas.forEach(function(v){ mediaGlobalPl+=v; nPl++; });
    });
    mediaGlobalAg = nAg ? Math.round(mediaGlobalAg/nAg) : 0;
    mediaGlobalPl = nPl ? Math.round(mediaGlobalPl/nPl) : 0;

    // Status atual
    var venc=0, atenc=0, emdia=0;
    BASE_TEARES.forEach(function(d,i){
      var t=((document.getElementById('st-'+i)||{}).textContent||'').trim();
      if(t.indexOf('Vencido')>=0) venc++;
      else if(t.indexOf('Atencao')>=0||t.indexOf('Aten')>=0) atenc++;
      else if(t.indexOf('Em dia')>=0) emdia++;
    });

    // ── MONTA HTML ──
    var html = '<div style="padding:16px" id="pdf-conteudo">';

    // Cabeçalho
    html += '<div style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid var(--accent)">'+
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.4rem;color:var(--text)">MANUTENCAO PREVENTIVA</div>'+
      '<div style="color:var(--accent);font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.95rem;text-transform:uppercase">Relatorio do Periodo: '+periodoStr+'</div>'+
      '<div style="font-size:.7rem;color:var(--muted);margin-top:4px">Gerado em '+new Date().toLocaleDateString('pt-BR')+' por '+(currentUser.displayName||currentUser.email)+'</div>'+
    '</div>';

    // KPIs principais
    html += '<div class="pdf-section"><div class="pdf-section-title">KPIs do Periodo</div>'+
    '<div class="pdf-kpi-row-4">'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val">'+totalManut+'</div><div class="pdf-kpi-lbl">Manutencoes realizadas</div></div>'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val">'+durStr+'</div><div class="pdf-kpi-lbl">Duracao media</div></div>'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val">'+totalPecasUnid.toLocaleString('pt-BR')+'</div><div class="pdf-kpi-lbl">Pecas trocadas</div></div>'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val" style="color:var(--'+(venc>0?'danger':'ok')+')">'+(venc>0?venc+' venc.':emdia+' OK')+'</div><div class="pdf-kpi-lbl">Status atual</div></div>'+
    '</div>'+
    '<div class="pdf-kpi-row-2">'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val">'+(mediaGlobalAg>0?mediaGlobalAg.toLocaleString('pt-BR')+' kg':'-')+'</div><div class="pdf-kpi-lbl">Media kg / carga de agulhas ('+nAg+' registros)</div></div>'+
      '<div class="pdf-kpi"><div class="pdf-kpi-val">'+(mediaGlobalPl>0?mediaGlobalPl.toLocaleString('pt-BR')+' kg':'-')+'</div><div class="pdf-kpi-lbl">Media kg / carga de platinas ('+nPl+' registros)</div></div>'+
    '</div></div>';

    // Status geral dos teares
    html += '<div class="pdf-section"><div class="pdf-section-title">Status Atual dos Teares</div>'+
    '<div style="display:flex;gap:20px;font-size:.82rem;padding:8px 0">'+
      '<span style="color:var(--danger)">&#9632; Vencidos: <strong>'+venc+'</strong></span>'+
      '<span style="color:var(--warn)">&#9632; Atencao: <strong>'+atenc+'</strong></span>'+
      '<span style="color:var(--ok)">&#9632; Em dia: <strong>'+emdia+'</strong></span>'+
      '<span style="color:var(--muted)">Total: <strong>'+BASE_TEARES.length+'</strong></span>'+
    '</div></div>';

    // Manutencoes do período
    if (registros.length) {
      html += '<div class="pdf-section"><div class="pdf-section-title">Manutencoes Realizadas no Periodo ('+registros.length+')</div>';
      html += '<table class="pdf-table"><thead><tr><th>Tear</th><th>Modelo</th><th>Data</th><th>Duracao</th><th>Tecnico</th><th>Obs</th></tr></thead><tbody>';
      registros.slice().sort(function(a,b){ return (a.inicio||'').localeCompare(b.inicio||''); }).forEach(function(r) {
        var dt=new Date(r.inicio), dur=r.duracaoSeg||0;
        var hh=Math.floor(dur/3600),mm2=Math.floor((dur%3600)/60);
        html += '<tr><td><strong>'+r.tear+'</strong></td><td>'+r.modelo+'</td>'+
          '<td>'+dt.toLocaleDateString('pt-BR')+'</td>'+
          '<td>'+(hh>0?hh+'h'+pad(mm2)+'min':mm2+'min')+'</td>'+
          '<td>'+(r.tecnico||'-')+'</td>'+
          '<td style="font-size:.68rem;color:var(--muted)">'+(r.obs||'-')+'</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    // Kg por carga — tabela
    if (tearesComCarga.length) {
      html += '<div class="pdf-section"><div class="pdf-section-title">Producao por Carga — Agulhas e Platinas</div>';
      html += '<table class="pdf-table"><thead><tr><th>Tear</th><th>Modelo</th><th>Cargas Ag.</th><th>Media Ag. (kg)</th><th>Cargas Pl.</th><th>Media Pl. (kg)</th></tr></thead><tbody>';
      tearesComCarga.forEach(function(t) {
        var mAg = t.agulhas.length ? Math.round(t.agulhas.reduce(function(a,b){return a+b;},0)/t.agulhas.length) : '-';
        var mPl = t.platinas.length ? Math.round(t.platinas.reduce(function(a,b){return a+b;},0)/t.platinas.length) : '-';
        html += '<tr><td><strong>'+t.tear+'</strong></td><td>'+t.modelo+'</td>'+
          '<td>'+t.agulhas.length+'</td>'+
          '<td>'+(mAg!=='-'?mAg.toLocaleString('pt-BR')+' kg':'-')+'</td>'+
          '<td>'+t.platinas.length+'</td>'+
          '<td>'+(mPl!=='-'?mPl.toLocaleString('pt-BR')+' kg':'-')+'</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    // Top 10 peças
    if (topPecas.length) {
      html += '<div class="pdf-section"><div class="pdf-section-title">Top 10 Pecas Mais Trocadas no Periodo</div>';
      html += '<table class="pdf-table"><thead><tr><th>#</th><th>Peca</th><th>Qtde Trocada</th></tr></thead><tbody>';
      topPecas.forEach(function(p,i){
        html += '<tr><td>'+(i+1)+'</td><td>'+p.nome+'</td><td><strong>'+p.qtde.toLocaleString('pt-BR')+'</strong></td></tr>';
      });
      html += '</tbody></table></div>';
    }

    html += '</div>';
    html += '<div style="padding:0 16px 16px;display:flex;gap:10px">'+
      '<button class="btn-save-teares" onclick="imprimirRelatorio()" style="padding:9px 20px;font-size:.82rem">&#128438; Imprimir / Salvar PDF</button>'+
      '<span style="font-size:.72rem;color:var(--muted);align-self:center">Use Ctrl+P → Salvar como PDF</span>'+
    '</div>';

    preview.innerHTML = html;
  } catch(e) {
    preview.innerHTML = '<div class="empty-state"><p>Erro: '+e.message+'</p></div>';
  }
}

function imprimirRelatorio() {
  var conteudo = document.getElementById('pdf-conteudo');
  if (!conteudo) { window.print(); return; }

  // Captura estilos relevantes do app
  var estilos = '';
  Array.from(document.styleSheets).forEach(function(ss) {
    try {
      Array.from(ss.cssRules).forEach(function(rule) { estilos += rule.cssText + '\n'; });
    } catch(e) {}
  });

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio Manutencao Preventiva</title>' +
    '<style>' + estilos +
    'body{background:#fff!important;color:#000!important;font-family:Arial,sans-serif;margin:0;padding:16px}' +
    ':root{--text:#111;--muted:#555;--border:#ccc;--s2:#f5f5f5;--s3:#eee;--accent:#f97316;--ok:#16a34a;--warn:#ca8a04;--danger:#dc2626;--info:#0284c7;--surface:#fff}' +
    '.pdf-kpi-row-4,.pdf-kpi-row-2{display:grid;gap:10px;margin-bottom:14px}' +
    '.pdf-kpi-row-4{grid-template-columns:repeat(4,1fr)}' +
    '.pdf-kpi-row-2{grid-template-columns:repeat(2,1fr)}' +
    '.pdf-kpi{background:#f5f5f5;border:1px solid #ddd;border-radius:8px;padding:10px;text-align:center}' +
    '.pdf-kpi-val{font-weight:800;font-size:1.5rem;color:#f97316}' +
    '.pdf-kpi-lbl{font-size:.65rem;color:#555;margin-top:2px}' +
    '.pdf-section{margin-bottom:18px}' +
    '.pdf-section-title{font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.06em;color:#f97316;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px}' +
    '.pdf-table{width:100%;border-collapse:collapse;font-size:.75rem}' +
    '.pdf-table th{background:#eee;padding:6px 10px;text-align:left;color:#555;font-weight:700;text-transform:uppercase;font-size:.65rem;letter-spacing:.05em}' +
    '.pdf-table td{padding:6px 10px;border-bottom:1px solid #eee}' +
    'button{display:none!important}' +
    '@media print{@page{margin:12mm}}' +
    '</style></head><body>' +
    conteudo.innerHTML +
    '</body></html>';

  // Remove botao de imprimir do conteudo capturado
  html = html.replace(/<div[^>]*>.*?Imprimir.*?Salvar PDF.*?<\/div>/gs, '');

  var old = document.getElementById('rel-print-frame');
  if (old) old.remove();
  var frame = document.createElement('iframe');
  frame.id = 'rel-print-frame';
  frame.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:#fff';
  document.body.appendChild(frame);
  frame.contentDocument.open();
  frame.contentDocument.write(html);
  frame.contentDocument.close();

  // Botao fechar
  var closeBtn = frame.contentDocument.createElement('button');
  closeBtn.innerHTML = '&#10005; Fechar';
  closeBtn.style.cssText = 'display:block!important;position:fixed;top:12px;right:12px;padding:7px 16px;cursor:pointer;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:.85rem;z-index:9999;font-family:Arial,sans-serif';
  closeBtn.onclick = function(){ document.getElementById('rel-print-frame').remove(); };
  frame.contentDocument.body.appendChild(closeBtn);

  // Botao imprimir
  var printBtn = frame.contentDocument.createElement('button');
  printBtn.innerHTML = '&#128438; Imprimir / PDF';
  printBtn.style.cssText = 'display:block!important;position:fixed;top:12px;right:130px;padding:7px 16px;cursor:pointer;background:#f97316;color:#fff;border:none;border-radius:6px;font-size:.85rem;z-index:9999;font-family:Arial,sans-serif;font-weight:700';
  printBtn.onclick = function(){ frame.contentWindow.print(); };
  frame.contentDocument.body.appendChild(printBtn);
}

// =============================================================================
//  EXPORTAR CSV / XLS — com KPIs e cargas por carga
// =============================================================================
function abrirExportar() {
  var modal = document.getElementById('modal-exportar');
  if (modal) modal.classList.add('open');
  var hoje = new Date();
  var ini  = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  var inEl = document.getElementById('exp-data-ini');
  var fmEl = document.getElementById('exp-data-fim');
  if (inEl) inEl.value = dateBR(ini);
  if (fmEl) fmEl.value = dateBR(hoje);
}

function fecharExportar() {
  var modal = document.getElementById('modal-exportar');
  if (modal) modal.classList.remove('open');
}

async function exportarDados(formato) {
  var iniEl = document.getElementById('exp-data-ini');
  var fimEl = document.getElementById('exp-data-fim');
  if (!iniEl||!iniEl.value||!fimEl||!fimEl.value) { showToast('Selecione o periodo.'); return; }
  var dataIni = new Date(iniEl.value+'T00:00:00');
  var dataFim = new Date(fimEl.value+'T23:59:59');
  if (dataIni > dataFim) { showToast('Data inicial maior que a final.'); return; }

  var comKpis   = document.getElementById('exp-kpis')   && document.getElementById('exp-kpis').checked;
  var comCargas = document.getElementById('exp-cargas') && document.getElementById('exp-cargas').checked;

  showToast('Carregando dados...');

  if (!db||!currentUser) { showToast('Login necessario.'); return; }
  var snap;
  try { snap = await histCol().orderBy('inicio','desc').limit(1000).get(); }
  catch(e) { snap = await histCol().limit(1000).get(); }

  var registros = [];
  snap.forEach(function(doc) {
    var r = doc.data();
    var d = new Date(r.inicio);
    if (d >= dataIni && d <= dataFim) registros.push(r);
  });
  registros.sort(function(a,b){ return (a.inicio||'').localeCompare(b.inicio||''); });

  var periodoStr = iniEl.value + '_a_' + fimEl.value;

  if (formato === 'csv') {
    _exportarCSV(registros, comKpis, comCargas, periodoStr);
  } else {
    _exportarXLS(registros, comKpis, comCargas, periodoStr);
  }
}

function _montarKpiRows(registros) {
  // Calcula todos os KPIs
  var totalManut = registros.length;
  var durTotal   = registros.reduce(function(s,r){ return s+(r.duracaoSeg||0); }, 0);
  var durMedia   = totalManut>0 ? Math.round(durTotal/totalManut) : 0;

  var pecasContador = {};
  registros.forEach(function(r) {
    if (!r.checklist) return;
    Object.keys(r.checklist).forEach(function(idx) {
      var item = r.checklist[idx];
      if (!item||!item.troca) return;
      var nome = CHECKLIST_ITENS[parseInt(idx)]||'Item '+idx;
      pecasContador[nome] = (pecasContador[nome]||0) + (parseFloat(item.qtde)||1);
    });
  });
  var topPecas = Object.keys(pecasContador)
    .map(function(n){ return [n, pecasContador[n]]; })
    .sort(function(a,b){ return b[1]-a[1]; }).slice(0,10);

  var cargasPorTear = {};
  registros.forEach(function(r) {
    var k = r.tear;
    if (!cargasPorTear[k]) cargasPorTear[k] = { tear:k, modelo:r.modelo, agulhas:[], platinas:[] };
    if (r.cargaAgulha&&r.cargaAgulha.trocada&&r.cargaAgulha.kg>0)   cargasPorTear[k].agulhas.push(r.cargaAgulha.kg);
    if (r.cargaPlatina&&r.cargaPlatina.trocada&&r.cargaPlatina.kg>0) cargasPorTear[k].platinas.push(r.cargaPlatina.kg);
  });

  var kpiRows = [
    ['KPI', 'Valor'],
    ['Manutencoes realizadas', totalManut],
    ['Duracao media (seg)', durMedia],
    [''],
    ['Top 10 Pecas Mais Trocadas', ''],
    ['Peca', 'Qtde']
  ];
  topPecas.forEach(function(p){ kpiRows.push([p[0], p[1]]); });
  kpiRows.push(['']);
  kpiRows.push(['Media kg / carga de agulhas', '']);
  kpiRows.push(['Tear', 'Modelo', 'N Cargas', 'Media kg']);
  Object.values(cargasPorTear).filter(function(t){ return t.agulhas.length; }).forEach(function(t){
    var m = Math.round(t.agulhas.reduce(function(a,b){return a+b;},0)/t.agulhas.length);
    kpiRows.push([t.tear, t.modelo, t.agulhas.length, m]);
  });
  kpiRows.push(['']);
  kpiRows.push(['Media kg / carga de platinas', '']);
  kpiRows.push(['Tear', 'Modelo', 'N Cargas', 'Media kg']);
  Object.values(cargasPorTear).filter(function(t){ return t.platinas.length; }).forEach(function(t){
    var m = Math.round(t.platinas.reduce(function(a,b){return a+b;},0)/t.platinas.length);
    kpiRows.push([t.tear, t.modelo, t.platinas.length, m]);
  });

  return kpiRows;
}

function _montarCargaRows(registros) {
  var rows = [['Data', 'Tear', 'Modelo', 'Tecnico', 'Tipo Carga', 'kg Produzidos']];
  registros.forEach(function(r) {
    var dt = new Date(r.inicio).toLocaleDateString('pt-BR');
    if (r.cargaAgulha&&r.cargaAgulha.trocada&&r.cargaAgulha.kg>0)
      rows.push([dt, r.tear, r.modelo, r.tecnico||'', 'Agulhas', r.cargaAgulha.kg]);
    if (r.cargaPlatina&&r.cargaPlatina.trocada&&r.cargaPlatina.kg>0)
      rows.push([dt, r.tear, r.modelo, r.tecnico||'', 'Platinas', r.cargaPlatina.kg]);
  });
  return rows;
}

function _rowsToCsv(rows) {
  return rows.map(function(r){
    return r.map(function(v){ return '"'+(v===undefined||v===null?'':String(v).replace(/"/g,'""'))+'"'; }).join(',');
  }).join('\n');
}

function _exportarCSV(registros, comKpis, comCargas, periodoStr) {
  var partes = [];
  if (comKpis)   partes.push('=== KPIs GLOBAIS ===\n' + _rowsToCsv(_montarKpiRows(registros)));
  if (comCargas) partes.push('\n=== KG POR CARGA ===\n' + _rowsToCsv(_montarCargaRows(registros)));
  if (!partes.length) { showToast('Selecione ao menos uma opcao.'); return; }
  var csv = '\uFEFF' + partes.join('\n\n');
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url; a.download = 'manutencao_'+periodoStr+'.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado!');
}

function _exportarXLS(registros, comKpis, comCargas, periodoStr) {
  // Gera XLS via XML SpreadsheetML (abre no Excel sem lib externa)
  var sheets = '';

  function rowsToXml(rows) {
    return rows.map(function(r) {
      return '<Row>' + r.map(function(v) {
        var t = (typeof v === 'number') ? 'Number' : 'String';
        return '<Cell><Data ss:Type="'+t+'">'+(v===undefined||v===null?'':String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))+'</Data></Cell>';
      }).join('') + '</Row>';
    }).join('\n');
  }

  if (comKpis) {
    sheets += '<Worksheet ss:Name="KPIs"><Table>'+rowsToXml(_montarKpiRows(registros))+'</Table></Worksheet>';
  }
  if (comCargas) {
    sheets += '<Worksheet ss:Name="Kg por Carga"><Table>'+rowsToXml(_montarCargaRows(registros))+'</Table></Worksheet>';
  }
  if (!sheets) { showToast('Selecione ao menos uma opcao.'); return; }

  var xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>'+
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" '+
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+sheets+'</Workbook>';

  var blob = new Blob(['\uFEFF'+xml], {type:'application/vnd.ms-excel;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url; a.download = 'manutencao_'+periodoStr+'.xls'; a.click();
  URL.revokeObjectURL(url);
  showToast('XLS exportado!');
}

// =============================================================================
//  PATCH: switchDashTab atualizado com novos paineis
// =============================================================================
function switchDashTab(tab, btn) {
  document.querySelectorAll('.dash-tab').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var paineis = ['timeline','graficos','tecnicos','pecas','producao'];
  paineis.forEach(function(p){
    var el = document.getElementById('dash-'+p);
    if (el) el.style.display = (p===tab)?'':'none';
  });
  // Carrega dados lazy
  if (tab==='graficos')  renderGraficos();
  else if (tab==='tecnicos')  renderTecnicos();
  else if (tab==='pecas')     renderPecasUsadas();
  else if (tab==='producao')  renderProducao();
}

// =============================================================================
//  PATCH: abrirDashboard — reseta para aba timeline
// =============================================================================
var _dashAberto = false;
var _origAbrirDashboard = abrirDashboard;
abrirDashboard = async function() {
  var modal = document.getElementById('modal-dashboard');
  if (modal) modal.classList.add('open');
  // Ativa tab timeline
  document.querySelectorAll('.dash-tab').forEach(function(b,i){ b.classList.toggle('active',i===0); });
  ['graficos','tecnicos','pecas','producao'].forEach(function(p){
    var el=document.getElementById('dash-'+p); if(el) el.style.display='none';
  });
  var tl=document.getElementById('dash-timeline'); if(tl) tl.style.display='';
  renderTimeline();
};

// =============================================================================
//  SYNC MANUTENÇÕES ATIVAS — Firestore realtime
//  Coleção: /empresa/mpdoptex/manutencoes_ativas/{tearIndex}
//  Documento: { tearIndex, tear, modelo, startTime (ISO), tecnico, deviceId }
// =============================================================================
function manuAtivCol() {
  return db.collection('empresa').doc(EMPRESA_ID).collection('manutencoes_ativas');
}

// ID único deste dispositivo/sessão (para não reagir às próprias mudanças)
var _deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);

// Salva manutenção ativa no Firestore para outros dispositivos verem
async function syncIniciarManut(i) {
  if (!db || !currentUser) return;
  var d = BASE_TEARES[i];
  try {
    await manuAtivCol().doc(String(i)).set({
      tearIndex:  i,
      tear:       d.tear,
      modelo:     d.modelo,
      startTime:  new Date(manutsAtivas[i].startTime).toISOString(),
      tecnico:    currentUser.displayName || currentUser.email,
      deviceId:   _deviceId,
      ativo:      true
    });
  } catch(e) { console.warn('[SyncManut] iniciar:', e.message); }
}

// Remove manutenção ativa do Firestore ao finalizar/cancelar
async function syncFinalizarManut(i) {
  if (!db || !currentUser) return;
  try {
    await manuAtivCol().doc(String(i)).delete();
  } catch(e) { console.warn('[SyncManut] finalizar:', e.message); }
}

// Escuta manutenções ativas de outros dispositivos em tempo real
var _unsubManutsAtivas = null;

function listenManutsAtivas() {
  if (!db || !currentUser) return;
  if (_unsubManutsAtivas) { _unsubManutsAtivas(); _unsubManutsAtivas = null; }
  _unsubManutsAtivas = manuAtivCol().onSnapshot(function(snap) {
    snap.docChanges().forEach(function(ch) {
      var idx  = parseInt(ch.doc.id);
      var data = ch.doc.data();

      if (ch.type === 'removed') {
        // Outro dispositivo finalizou — remove indicador visual se não é local
        if (!manutsAtivas[idx] || manutsAtivas[idx]._remote) {
          _limparManutRemota(idx);
        }
        return;
      }

      // Ignora mudanças do próprio dispositivo
      if (data.deviceId === _deviceId) return;

      if ((ch.type === 'added' || ch.type === 'modified') && data.ativo) {
        // Outro dispositivo iniciou — mostra indicador visual
        if (!manutsAtivas[idx]) {
          var startMs = new Date(data.startTime).getTime();
          _mostrarManutRemota(idx, startMs, data.tecnico);
        }
      }
    });
  }, function(err) { console.warn('[SyncManut] listen:', err.message); });
}

// Mostra indicador visual de manutenção iniciada em outro dispositivo
function _mostrarManutRemota(i, startMs, tecnico) {
  var d = BASE_TEARES[i];
  if (!d) return;

  // Cria entrada em manutsAtivas marcada como remota
  manutsAtivas[i] = {
    tearIndex:     i,
    startTime:     startMs,
    timerInterval: null,
    checklist:     {},
    obs:           '',
    _remote:       true,
    _tecnico:      tecnico
  };

  var btnW = document.getElementById('btn-wrench-'+i);
  var rt   = document.getElementById('rt-'+i);
  var tr   = document.getElementById('tr-'+i);
  if (btnW) btnW.classList.add('active');
  if (rt)   rt.style.display = 'inline';
  if (tr)   tr.style.background = 'rgba(249,115,22,0.06)';

  // Timer local sincronizado com o startTime remoto
  manutsAtivas[i].timerInterval = setInterval(function() {
    var manut = manutsAtivas[i]; if (!manut) return;
    var elapsed = Math.floor((Date.now() - manut.startTime) / 1000);
    var h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60), s = elapsed%60;
    var rtEl = document.getElementById('rt-'+i);
    if (rtEl) rtEl.textContent = (h>0?pad(h)+':':'')+pad(m)+':'+pad(s);
  }, 1000);

  // Toast informativo
  showToast('Tear '+d.tear+' em manutencao por '+tecnico+' (outro dispositivo)');
}

function _limparManutRemota(i) {
  var manut = manutsAtivas[i];
  if (!manut) return;
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
  showToast('Manutencao do Tear '+(BASE_TEARES[i]?BASE_TEARES[i].tear:i)+' finalizada em outro dispositivo.');
}

// Ao carregar, busca manutenções já em andamento (iniciadas antes deste login)
async function carregarManutsAtivas() {
  if (!db || !currentUser) return;
  try {
    var snap = await manuAtivCol().get();
    snap.forEach(function(doc) {
      var data = doc.data();
      var idx  = parseInt(doc.id);
      if (!data.ativo) return;
      if (data.deviceId === _deviceId) return; // propria sessao
      if (manutsAtivas[idx]) return; // ja iniciada localmente
      var startMs = new Date(data.startTime).getTime();
      _mostrarManutRemota(idx, startMs, data.tecnico);
    });
  } catch(e) { console.warn('[SyncManut] carregar:', e.message); }
}

// =============================================================================
//  TOGGLE CARGA KG (mostra/esconde campo de kg)
// =============================================================================
function toggleCargaKg(tipo) {
  var wrap = document.getElementById('carga-' + tipo + '-kg-wrap');
  var chk  = document.getElementById('cl-' + tipo + '-trocada');
  if (wrap && chk) wrap.style.display = chk.checked ? 'flex' : 'none';
}

// =============================================================================
//  DASHBOARD — PRODUCAO POR CARGA DE AGULHAS/PLATINAS
// =============================================================================
async function renderProducao() {
  var container = document.getElementById('dash-producao');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';
  if (!db || !currentUser) { container.innerHTML = '<div class="empty-state"><p>Login necessario.</p></div>'; return; }

  try {
    var snap;
    try { snap = await histCol().orderBy('inicio','desc').limit(500).get(); }
    catch(e) { snap = await histCol().limit(500).get(); }

    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><p>Nenhuma manutencao registrada ainda.</p></div>';
      return;
    }

    // Coleta registros com carga de agulha ou platina
    var porTear = {}; // tearNum -> { agulhas: [{kg, data}], platinas: [{kg, data}] }
    var totalRegistros = 0;

    snap.forEach(function(doc) {
      var r = doc.data();
      var tNum = r.tear;
      if (!porTear[tNum]) porTear[tNum] = { tear: tNum, modelo: r.modelo, agulhas: [], platinas: [] };

      if (r.cargaAgulha && r.cargaAgulha.trocada && r.cargaAgulha.kg > 0) {
        porTear[tNum].agulhas.push({ kg: r.cargaAgulha.kg, data: r.fim || r.inicio });
        totalRegistros++;
      }
      if (r.cargaPlatina && r.cargaPlatina.trocada && r.cargaPlatina.kg > 0) {
        porTear[tNum].platinas.push({ kg: r.cargaPlatina.kg, data: r.fim || r.inicio });
        totalRegistros++;
      }
    });

    if (totalRegistros === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:32px">' +
        '<p style="margin-bottom:8px">Nenhum registro de producao por carga ainda.</p>' +
        '<p style="font-size:.75rem;color:var(--muted)">Ao finalizar uma manutencao com troca completa de agulhas ou platinas,<br>informe os kg produzidos com a carga anterior para ver este relatorio.</p>' +
        '</div>';
      return;
    }

    // Calcula medias por tear
    var teares = Object.values(porTear).filter(function(t){ return t.agulhas.length > 0 || t.platinas.length > 0; });

    // Ordena por media de agulhas desc
    teares.sort(function(a, b) {
      var ma = a.agulhas.length ? a.agulhas.reduce(function(s,x){return s+x.kg;},0)/a.agulhas.length : 0;
      var mb = b.agulhas.length ? b.agulhas.reduce(function(s,x){return s+x.kg;},0)/b.agulhas.length : 0;
      return mb - ma;
    });

    var maxMediaAgulha = 0, maxMediaPlatina = 0;
    teares.forEach(function(t) {
      if (t.agulhas.length) {
        var m = t.agulhas.reduce(function(s,x){return s+x.kg;},0)/t.agulhas.length;
        if (m > maxMediaAgulha) maxMediaAgulha = m;
      }
      if (t.platinas.length) {
        var m = t.platinas.reduce(function(s,x){return s+x.kg;},0)/t.platinas.length;
        if (m > maxMediaPlatina) maxMediaPlatina = m;
      }
    });

    // KPIs globais
    var allAgKg  = [], allPlKg = [];
    teares.forEach(function(t){
      t.agulhas.forEach(function(x){allAgKg.push(x.kg);});
      t.platinas.forEach(function(x){allPlKg.push(x.kg);});
    });
    var mediaGlobalAg = allAgKg.length ? Math.round(allAgKg.reduce(function(a,b){return a+b;},0)/allAgKg.length) : 0;
    var mediaGlobalPl = allPlKg.length ? Math.round(allPlKg.reduce(function(a,b){return a+b;},0)/allPlKg.length) : 0;

    var html = '';

    // KPI summary
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)">' +
      '<div class="chart-stat"><div class="chart-stat-val">' + allAgKg.length + '</div><div class="chart-stat-lbl">Registros de agulhas</div></div>' +
      '<div class="chart-stat"><div class="chart-stat-val">' + (mediaGlobalAg>0?mediaGlobalAg.toLocaleString('pt-BR')+' kg':'-') + '</div><div class="chart-stat-lbl">Media global / carga agulha</div></div>' +
      '<div class="chart-stat"><div class="chart-stat-val">' + (mediaGlobalPl>0?mediaGlobalPl.toLocaleString('pt-BR')+' kg':'-') + '</div><div class="chart-stat-lbl">Media global / carga platina</div></div>' +
    '</div>';

    // Abas agulhas / platinas
    html += '<div style="display:flex;border-bottom:1px solid var(--border)">' +
      '<button class="dash-tab active" id="prod-tab-ag" onclick="switchProdTab(\'ag\')" style="font-size:.78rem;padding:10px">&#128295; Agulhas</button>' +
      '<button class="dash-tab" id="prod-tab-pl" onclick="switchProdTab(\'pl\')" style="font-size:.78rem;padding:10px">&#9632; Platinas</button>' +
    '</div>';

    // Ranking agulhas
    html += '<div id="prod-ag">';
    var tearesComAg = teares.filter(function(t){ return t.agulhas.length > 0; });
    if (!tearesComAg.length) {
      html += '<div class="empty-state"><p>Nenhum registro de agulhas ainda.</p></div>';
    } else {
      html += '<div class="prod-header"><span>Ranking por media de kg / carga completa de agulhas</span><span>' + allAgKg.length + ' registro(s)</span></div>';
      tearesComAg.forEach(function(t, pos) {
        var media    = Math.round(t.agulhas.reduce(function(s,x){return s+x.kg;},0)/t.agulhas.length);
        var pct      = maxMediaAgulha > 0 ? Math.round((media/maxMediaAgulha)*100) : 0;
        var cor      = pos===0?'var(--accent)':pos<=2?'var(--warn)':'var(--ok)';
        var ultima   = t.agulhas[0] ? new Date(t.agulhas[0].data).toLocaleDateString('pt-BR') : '-';
        html += '<div class="prod-row">' +
          '<div class="prod-pos" style="color:'+cor+'">'+(pos+1)+'</div>' +
          '<div class="prod-info">' +
            '<div class="prod-tear">Tear <strong>'+t.tear+'</strong> &mdash; <span style="color:var(--muted);font-size:.75rem">'+t.modelo+'</span></div>' +
            '<div class="prod-bar-wrap"><div class="prod-bar" style="width:'+pct+'%;background:'+cor+'"></div></div>' +
            '<div class="prod-meta">' +
              '<span>&#128202; <strong>'+t.agulhas.length+'</strong> carga(s) registrada(s)</span>' +
              '<span>Ultima: <strong>'+ultima+'</strong></span>' +
            '</div>' +
          '</div>' +
          '<div><div class="prod-kg" style="color:'+cor+'">'+media.toLocaleString('pt-BR')+'</div><div class="prod-kg-lbl">kg / carga</div></div>' +
        '</div>';
      });
      // Evolucao historica (todos os registros em ordem cronologica)
      html += _renderEvolucaoChart(teares, 'agulha');
    }
    html += '</div>';

    // Ranking platinas
    html += '<div id="prod-pl" style="display:none">';
    var tearesComPl = teares.filter(function(t){ return t.platinas.length > 0; });
    if (!tearesComPl.length) {
      html += '<div class="empty-state"><p>Nenhum registro de platinas ainda.</p></div>';
    } else {
      var maxPl = tearesComPl.reduce(function(mx,t){
        var m = t.platinas.reduce(function(s,x){return s+x.kg;},0)/t.platinas.length;
        return m>mx?m:mx;
      },0);
      // Ordena por media platinas
      var tearesOrdPl = tearesComPl.slice().sort(function(a,b){
        var ma = a.platinas.reduce(function(s,x){return s+x.kg;},0)/a.platinas.length;
        var mb = b.platinas.reduce(function(s,x){return s+x.kg;},0)/b.platinas.length;
        return mb-ma;
      });
      html += '<div class="prod-header"><span>Ranking por media de kg / carga completa de platinas</span><span>' + allPlKg.length + ' registro(s)</span></div>';
      tearesOrdPl.forEach(function(t, pos) {
        var media  = Math.round(t.platinas.reduce(function(s,x){return s+x.kg;},0)/t.platinas.length);
        var pct    = maxPl > 0 ? Math.round((media/maxPl)*100) : 0;
        var cor    = pos===0?'var(--accent)':pos<=2?'var(--warn)':'var(--ok)';
        var ultima = t.platinas[0] ? new Date(t.platinas[0].data).toLocaleDateString('pt-BR') : '-';
        html += '<div class="prod-row">' +
          '<div class="prod-pos" style="color:'+cor+'">'+(pos+1)+'</div>' +
          '<div class="prod-info">' +
            '<div class="prod-tear">Tear <strong>'+t.tear+'</strong> &mdash; <span style="color:var(--muted);font-size:.75rem">'+t.modelo+'</span></div>' +
            '<div class="prod-bar-wrap"><div class="prod-bar" style="width:'+pct+'%;background:'+cor+'"></div></div>' +
            '<div class="prod-meta">' +
              '<span>&#128202; <strong>'+t.platinas.length+'</strong> carga(s) registrada(s)</span>' +
              '<span>Ultima: <strong>'+ultima+'</strong></span>' +
            '</div>' +
          '</div>' +
          '<div><div class="prod-kg" style="color:'+cor+'">'+media.toLocaleString('pt-BR')+'</div><div class="prod-kg-lbl">kg / carga</div></div>' +
        '</div>';
      });
      html += _renderEvolucaoChart(teares, 'platina');
    }
    html += '</div>';

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><p>Erro: '+e.message+'</p></div>';
  }
}

function _renderEvolucaoChart(teares, tipo) {
  // Coleta todos os pontos cronologicamente
  var pontos = [];
  teares.forEach(function(t) {
    var lista = tipo === 'agulha' ? t.agulhas : t.platinas;
    lista.forEach(function(x) {
      pontos.push({ tear: t.tear, kg: x.kg, data: x.data });
    });
  });
  if (pontos.length < 2) return '';
  pontos.sort(function(a,b){ return (a.data||'').localeCompare(b.data||''); });

  var maxKg = Math.max.apply(null, pontos.map(function(p){ return p.kg; })) || 1;
  var html = '<div class="prod-chart-wrap"><div class="prod-chart-title">Evolucao historica — kg por carga de ' + tipo + 's</div>';
  html += '<div class="prod-points">';
  pontos.forEach(function(p, idx) {
    var x   = Math.round((idx / (pontos.length-1||1)) * 100);
    var y   = Math.round((p.kg / maxKg) * 100);
    var cor = p.kg > (maxKg * 0.8) ? 'var(--ok)' : p.kg > (maxKg * 0.5) ? 'var(--warn)' : 'var(--danger)';
    var dt  = new Date(p.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    html += '<div class="prod-point" style="left:'+x+'%;bottom:'+y+'%;background:'+cor+'" title="Tear '+p.tear+' — '+p.kg.toLocaleString('pt-BR')+'kg ('+dt+')"></div>';
    if (idx===0 || idx===pontos.length-1 || pontos.length <= 8) {
      html += '<span class="prod-point-lbl" style="left:'+x+'%;bottom:calc('+y+'% + 14px);position:absolute;font-size:.52rem;color:var(--muted)">T'+p.tear+'</span>';
    }
  });
  html += '</div>';
  // Eixo Y labels
  html += '<div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:4px">';
  html += '<span>'+pontos[0]?new Date(pontos[0].data).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}):'';
  html += '</span><span>'+Math.round(maxKg).toLocaleString('pt-BR')+' kg max</span>';
  html += '</div>';
  html += '</div>';
  return html;
}

function switchProdTab(tab) {
  document.getElementById('prod-ag').style.display = tab==='ag' ? '' : 'none';
  document.getElementById('prod-pl').style.display = tab==='pl' ? '' : 'none';
  document.getElementById('prod-tab-ag').classList.toggle('active', tab==='ag');
  document.getElementById('prod-tab-pl').classList.toggle('active', tab==='pl');
}


// =============================================================================
//  EDITAR MANUTENÇÃO REALIZADA (Admin only)
// =============================================================================
var _editDocId = null;
var _editRegistro = null;

async function abrirEditarManutencao(docId) {
  if (currentRole !== 'admin') { showToast('Sem permissao.'); return; }
  if (!db || !currentUser) return;

  _editDocId = docId;

  // Busca o documento
  try {
    var snap = await histCol().doc(docId).get();
    if (!snap.exists) { showToast('Registro nao encontrado.'); return; }
    _editRegistro = snap.data();
    _editRegistro._docId = docId;
  } catch(e) {
    showToast('Erro ao buscar: ' + e.message);
    return;
  }

  var r = _editRegistro;
  var modal = document.getElementById('modal-edit-manut');
  if (!modal) return;

  // Preenche campos do modal
  document.getElementById('edit-tear-num').textContent = 'Tear ' + r.tear + ' — ' + r.modelo;

  // Data/hora início
  var dtIni = r.inicio ? r.inicio.slice(0,16) : '';
  document.getElementById('edit-inicio').value = dtIni;

  // Data/hora fim
  var dtFim = r.fim ? r.fim.slice(0,16) : '';
  document.getElementById('edit-fim').value = dtFim;

  // Técnico
  document.getElementById('edit-tecnico').value = r.tecnico || '';

  // Observações
  document.getElementById('edit-obs').value = r.obs || '';

  // Carga agulhas
  var agTrocada = r.cargaAgulha && r.cargaAgulha.trocada;
  document.getElementById('edit-agulha-trocada').checked = !!agTrocada;
  document.getElementById('edit-agulha-kg').value = agTrocada ? (r.cargaAgulha.kg || '') : '';
  document.getElementById('edit-agulha-kg-wrap').style.display = agTrocada ? 'flex' : 'none';

  // Carga platinas
  var plTrocada = r.cargaPlatina && r.cargaPlatina.trocada;
  document.getElementById('edit-platina-trocada').checked = !!plTrocada;
  document.getElementById('edit-platina-kg').value = plTrocada ? (r.cargaPlatina.kg || '') : '';
  document.getElementById('edit-platina-kg-wrap').style.display = plTrocada ? 'flex' : 'none';

  // Checklist
  _renderEditChecklist(r.checklist || {});

  modal.classList.add('open');
}

function _renderEditChecklist(checklist) {
  var body = document.getElementById('edit-cl-body');
  if (!body) return;
  body.innerHTML = '';
  CHECKLIST_ITENS.forEach(function(item, idx) {
    var saved = checklist[idx] || {};
    var row = document.createElement('div');
    row.className = 'cl-row';
    row.innerHTML =
      '<div class="cl-item-name">' + item + '</div>' +
      '<div class="cl-check"><input type="checkbox" id="ecl-verif-'+idx+'"   ' + (saved.verif   ? 'checked' : '') + '></div>' +
      '<div class="cl-check"><input type="checkbox" id="ecl-ajuste-'+idx+'"  ' + (saved.ajuste  ? 'checked' : '') + '></div>' +
      '<div class="cl-check"><input type="checkbox" id="ecl-limpeza-'+idx+'" ' + (saved.limpeza ? 'checked' : '') + '></div>' +
      '<div class="cl-check"><input type="checkbox" id="ecl-lubrif-'+idx+'"  ' + (saved.lubrif  ? 'checked' : '') + '></div>' +
      '<div class="cl-check"><input type="checkbox" id="ecl-troca-'+idx+'"   ' + (saved.troca   ? 'checked' : '') + '></div>' +
      '<div><input class="cl-qty" type="number" id="ecl-qty-'+idx+'" value="' + (saved.qtde || '') + '" placeholder="-" min="0"></div>';
    body.appendChild(row);
  });
}

function toggleEditCargaKg(tipo) {
  var wrap = document.getElementById('edit-' + tipo + '-kg-wrap');
  var chk  = document.getElementById('edit-' + tipo + '-trocada');
  if (wrap && chk) wrap.style.display = chk.checked ? 'flex' : 'none';
}

function fecharEditarManutencao() {
  var modal = document.getElementById('modal-edit-manut');
  if (modal) modal.classList.remove('open');
  _editDocId = null;
  _editRegistro = null;
}

async function salvarEdicaoManutencao() {
  if (!_editDocId || !db || !currentUser) return;
  if (currentRole !== 'admin') { showToast('Sem permissao.'); return; }

  var btnSalvar = document.getElementById('edit-btn-salvar');
  if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando...'; }

  try {
    // Coleta checklist
    var checklist = {};
    CHECKLIST_ITENS.forEach(function(_, idx) {
      checklist[idx] = {
        verif:   !!(document.getElementById('ecl-verif-'+idx)||{}).checked,
        ajuste:  !!(document.getElementById('ecl-ajuste-'+idx)||{}).checked,
        limpeza: !!(document.getElementById('ecl-limpeza-'+idx)||{}).checked,
        lubrif:  !!(document.getElementById('ecl-lubrif-'+idx)||{}).checked,
        troca:   !!(document.getElementById('ecl-troca-'+idx)||{}).checked,
        qtde:    ((document.getElementById('ecl-qty-'+idx)||{}).value || '')
      };
    });

    // Coleta cargas
    var agTrocada = document.getElementById('edit-agulha-trocada').checked;
    var plTrocada = document.getElementById('edit-platina-trocada').checked;
    var cargaAgulha  = agTrocada ? { trocada: true, kg: parseFloat(document.getElementById('edit-agulha-kg').value) || 0 } : null;
    var cargaPlatina = plTrocada ? { trocada: true, kg: parseFloat(document.getElementById('edit-platina-kg').value) || 0 } : null;

    // Calcula duração a partir do início/fim editados
    var inicioVal = document.getElementById('edit-inicio').value;
    var fimVal    = document.getElementById('edit-fim').value;
    var duracaoSeg = _editRegistro.duracaoSeg || 0;
    if (inicioVal && fimVal) {
      var tsIni = new Date(inicioVal).getTime();
      var tsFim = new Date(fimVal).getTime();
      if (tsFim > tsIni) duracaoSeg = Math.round((tsFim - tsIni) / 1000);
    }

    var atualizacao = {
      tecnico:      document.getElementById('edit-tecnico').value.trim() || _editRegistro.tecnico,
      obs:          document.getElementById('edit-obs').value.trim(),
      inicio:       inicioVal ? inicioVal + ':00' : _editRegistro.inicio,
      fim:          fimVal    ? fimVal    + ':00' : _editRegistro.fim,
      duracaoSeg:   duracaoSeg,
      checklist:    checklist,
      cargaAgulha:  cargaAgulha,
      cargaPlatina: cargaPlatina,
      // Auditoria
      _editadoEm:   isoLocalBR(new Date()),
      _editadoPor:  currentUser.displayName || currentUser.email,
      _editadoUid:  currentUser.uid
    };

    await histCol().doc(_editDocId).update(atualizacao);

    showToast('Manutenção atualizada com sucesso!');
    fecharEditarManutencao();

    // Recarrega histórico para refletir edição
    await abrirHistorico();

  } catch(e) {
    showToast('Erro ao salvar: ' + e.message);
    if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = '✓ Salvar Alterações'; }
  }
}

// =============================================================================
//  EXCLUIR MANUTENÇÃO (Admin only)
// =============================================================================
function confirmarExcluirManutencao(docId, tearNum) {
  if (currentRole !== 'admin') { showToast('Sem permissao.'); return; }
  var modal = document.getElementById('modal-confirmar-excluir');
  if (!modal) return;
  document.getElementById('excluir-tear-info').textContent = 'Tear ' + tearNum;
  document.getElementById('btn-confirmar-excluir').onclick = function() {
    _executarExcluirManutencao(docId, tearNum);
  };
  modal.classList.add('open');
}

function fecharConfirmarExcluir() {
  var modal = document.getElementById('modal-confirmar-excluir');
  if (modal) modal.classList.remove('open');
}

async function _executarExcluirManutencao(docId, tearNum) {
  if (!db || !currentUser) return;
  var btn = document.getElementById('btn-confirmar-excluir');
  if (btn) { btn.disabled = true; btn.textContent = 'Excluindo...'; }
  try {
    await histCol().doc(docId).delete();
    fecharConfirmarExcluir();
    showToast('Manutenção do Tear ' + tearNum + ' excluída.');
    // Remove da lista local e re-renderiza sem recarregar do Firestore
    _historicoTodos = _historicoTodos.filter(function(r){ return r._docId !== docId; });
    _aplicarFiltrosHistorico();
  } catch(e) {
    showToast('Erro ao excluir: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Sim, excluir'; }
  }
}

// =============================================================================
//  FOTOS NA MANUTENÇÃO
//  Armazena base64 comprimido (JPEG 60%, max 1200px) no Firestore
//  Limite prático: 3-5 fotos por manutenção (~50-80kb cada)
// =============================================================================
function abrirCamera() {
  document.getElementById('input-foto-camera').click();
}

function abrirGaleria() {
  document.getElementById('input-foto-galeria').click();
}

async function capturarFoto(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  input.value = ''; // reset para permitir mesma foto novamente

  if (clTearIndex === null || !manutsAtivas[clTearIndex]) {
    showToast('Inicie uma manutenção antes de tirar fotos.');
    return;
  }

  try {
    var base64 = await _comprimirImagem(file, 1200, 0.60);
    manutsAtivas[clTearIndex].fotos.push({
      data:     base64,
      nome:     file.name,
      tamanho:  file.size,
      hora:     isoLocalBR(new Date())
    });
    _renderFotosPreview(clTearIndex);
    showToast('Foto adicionada (' + manutsAtivas[clTearIndex].fotos.length + ')');
  } catch(e) {
    showToast('Erro ao processar foto: ' + e.message);
  }
}

function _comprimirImagem(file, maxPx, qualidade) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else       { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function _renderFotosPreview(tearIdx) {
  var container = document.getElementById('fotos-preview');
  if (!container) return;
  var fotos = (manutsAtivas[tearIdx] && manutsAtivas[tearIdx].fotos) || [];
  if (!fotos.length) {
    container.innerHTML = '<span style="color:var(--muted);font-size:.75rem">Nenhuma foto adicionada</span>';
    return;
  }
  container.innerHTML = fotos.map(function(f, idx) {
    return '<div class="foto-thumb-wrap">'+
      '<img src="'+f.data+'" class="foto-thumb" onclick="verFotoAmpliada('+tearIdx+','+idx+')">'+
      '<button class="foto-del-btn" onclick="removerFoto('+tearIdx+','+idx+')" title="Remover">&#10005;</button>'+
    '</div>';
  }).join('');
}

function removerFoto(tearIdx, idx) {
  if (!manutsAtivas[tearIdx]) return;
  manutsAtivas[tearIdx].fotos.splice(idx, 1);
  _renderFotosPreview(tearIdx);
}

function verFotoAmpliada(tearIdx, idx) {
  var fotos = (manutsAtivas[tearIdx] && manutsAtivas[tearIdx].fotos) || [];
  var f = fotos[idx]; if (!f) return;
  var overlay = document.getElementById('foto-ampliada-overlay');
  var img     = document.getElementById('foto-ampliada-img');
  if (overlay && img) { img.src = f.data; overlay.style.display = 'flex'; }
}

function fecharFotoAmpliada() {
  var overlay = document.getElementById('foto-ampliada-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Exibe fotos no histórico (renderHistorico já mostra o thumbnail)
function verFotosHistorico(docId) {
  var r = _historicoTodos.find(function(x){ return x._docId === docId; });
  if (!r || !r.fotos || !r.fotos.length) { showToast('Sem fotos neste registro.'); return; }
  var overlay = document.getElementById('foto-ampliada-overlay');
  var img     = document.getElementById('foto-ampliada-img');
  // Mostra primeira; navegação via botões
  window._fotoViewList  = r.fotos;
  window._fotoViewIndex = 0;
  if (overlay && img) {
    img.src = r.fotos[0].data;
    document.getElementById('foto-nav-info').textContent = '1 / ' + r.fotos.length;
    document.getElementById('foto-nav').style.display = r.fotos.length > 1 ? 'flex' : 'none';
    overlay.style.display = 'flex';
  }
}

function navFoto(dir) {
  if (!window._fotoViewList) return;
  window._fotoViewIndex = (window._fotoViewIndex + dir + window._fotoViewList.length) % window._fotoViewList.length;
  document.getElementById('foto-ampliada-img').src = window._fotoViewList[window._fotoViewIndex].data;
  document.getElementById('foto-nav-info').textContent = (window._fotoViewIndex+1) + ' / ' + window._fotoViewList.length;
}


// Popula o <select> de teares no histórico com os teares que têm registros
function _popularSelectTeares() {
  var sel = document.getElementById('hist-tear-sel');
  if (!sel) return;
  var tearsComRegistro = [];
  _historicoTodos.forEach(function(r) {
    if (r.tear && tearsComRegistro.indexOf(r.tear) === -1) tearsComRegistro.push(r.tear);
  });
  tearsComRegistro.sort(function(a,b){ return a - b; });
  // Preserva valor selecionado
  var valorAtual = sel.value;
  sel.innerHTML = '<option value="">Todos os teares</option>';
  tearsComRegistro.forEach(function(t) {
    var opt = document.createElement('option');
    opt.value = t;
    opt.textContent = 'Tear ' + t;
    if (String(t) === valorAtual) opt.selected = true;
    sel.appendChild(opt);
  });
}
