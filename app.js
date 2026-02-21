// =============================================================================
//  MANUTENCAO PREVENTIVA - app.js v4.1
//  Fix: logout/login, checklist mobile, multiplas manutencoes simultaneas
// =============================================================================

var firebaseConfig = {
  apiKey: "AIzaSyAXTpEVEkwT6mcN40wyox0mii7SARFN0sw",
  authDomain: "mpdoptex-c5654.firebaseapp.com",
  projectId: "mpdoptex-c5654",
  storageBucket: "mpdoptex-c5654.firebasestorage.app",
  messagingSenderId: "697477319756",
  appId: "1:697477319756:web:661ce11fe22714d431f8e9"
};

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
//  ESTADO GLOBAL
// =============================================================================
var db = null, auth = null, currentUser = null;
var firestoreData = {}, usingFirebase = false;
var today = new Date(); today.setHours(0,0,0,0);
var STORAGE_KEY = 'mp_preventiva_v4';
var EMPRESA_ID  = 'mpdoptex';
var _firebaseInitialized = false;

// MULTIPLAS MANUTENCOES: mapa de tearIndex -> objeto de manutencao
var manutsAtivas = {}; // { tearIndex: { startTime, timerInterval, checklist, obs } }
var clTearIndex  = null; // qual tear esta aberto no modal agora

// =============================================================================
//  FIREBASE
// =============================================================================
function initFirebase() {
  if (_firebaseInitialized) return;
  _firebaseInitialized = true;
  try {
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
        // Para todos os cronometros ativos ao deslogar
        Object.keys(manutsAtivas).forEach(function(k) {
          clearInterval(manutsAtivas[k].timerInterval);
        });
        manutsAtivas = {};
        showScreen('screen-login');
        // Reseta botao de login
        setBtnLoading(false);
        mostrarLogin();
      }
    });
  } catch(e) {
    console.warn('[Firebase] erro:', e.message);
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
  }
}

function tearRef(i)  { return db.collection('empresa').doc(EMPRESA_ID).collection('teares').doc(String(i)); }
function tearCol()   { return db.collection('empresa').doc(EMPRESA_ID).collection('teares'); }
function histCol()   { return db.collection('empresa').doc(EMPRESA_ID).collection('historico'); }

// =============================================================================
//  AUTH
// =============================================================================
var _tela = 'login';

function mostrarLogin() {
  _tela = 'login';
  var regF = document.getElementById('reg-fields');
  var resF = document.getElementById('reset-fields');
  var senhaF = document.getElementById('campo-senha');
  var title = document.getElementById('login-title');
  var btnSub = document.getElementById('btn-submit');
  var btnTog = document.getElementById('btn-toggle-reg');
  var btnFor = document.getElementById('btn-forgot');
  var btnBk  = document.getElementById('btn-back');
  var err    = document.getElementById('login-err');
  if (regF)  regF.style.display   = 'none';
  if (resF)  resF.style.display   = 'none';
  if (senhaF) senhaF.style.display = 'block';
  if (title) title.textContent    = 'Entrar';
  if (btnSub) { btnSub.textContent = 'Entrar'; btnSub.disabled = false; }
  if (btnTog) { btnTog.style.display = 'block'; btnTog.textContent = 'Nao tem conta? Cadastre-se'; }
  if (btnFor) btnFor.style.display = 'block';
  if (btnBk)  btnBk.style.display  = 'none';
  if (err)    { err.textContent = ''; err.style.color = '#ef4444'; }
}

function mostrarRegistro() {
  _tela = 'registro';
  var regF = document.getElementById('reg-fields');
  var resF = document.getElementById('reset-fields');
  var senhaF = document.getElementById('campo-senha');
  var title = document.getElementById('login-title');
  var btnSub = document.getElementById('btn-submit');
  var btnTog = document.getElementById('btn-toggle-reg');
  var btnFor = document.getElementById('btn-forgot');
  var err    = document.getElementById('login-err');
  if (regF)  regF.style.display   = 'flex';
  if (resF)  resF.style.display   = 'none';
  if (senhaF) senhaF.style.display = 'block';
  if (title) title.textContent    = 'Criar Conta';
  if (btnSub) { btnSub.textContent = 'Criar conta'; btnSub.disabled = false; }
  if (btnTog) { btnTog.style.display = 'block'; btnTog.textContent = 'Ja tem conta? Entrar'; }
  if (btnFor) btnFor.style.display = 'none';
  if (err)    err.textContent = '';
}

function mostrarReset() {
  _tela = 'reset';
  var regF = document.getElementById('reg-fields');
  var resF = document.getElementById('reset-fields');
  var senhaF = document.getElementById('campo-senha');
  var title  = document.getElementById('login-title');
  var btnSub = document.getElementById('btn-submit');
  var btnTog = document.getElementById('btn-toggle-reg');
  var btnFor = document.getElementById('btn-forgot');
  var btnBk  = document.getElementById('btn-back');
  var err    = document.getElementById('login-err');
  if (regF)  regF.style.display   = 'none';
  if (resF)  resF.style.display   = 'flex';
  if (senhaF) senhaF.style.display = 'none';
  if (title) title.textContent    = 'Recuperar Senha';
  if (btnSub) { btnSub.textContent = 'Enviar e-mail'; btnSub.disabled = false; }
  if (btnTog) btnTog.style.display = 'none';
  if (btnFor) btnFor.style.display = 'none';
  if (btnBk)  btnBk.style.display  = 'block';
  if (err)    err.textContent = '';
}

function toggleTela() { if (_tela === 'login') mostrarRegistro(); else mostrarLogin(); }

function submitForm() {
  if (_tela === 'login')         doLogin();
  else if (_tela === 'registro') doRegistro();
  else if (_tela === 'reset')    doReset();
}

async function doLogin() {
  var email = (document.getElementById('inp-email')||{}).value;
  var pass  = (document.getElementById('inp-pass')||{}).value;
  if (email) email = email.trim();
  var err = document.getElementById('login-err');
  if (err) err.textContent = '';
  if (!email || !pass) { if (err) err.textContent = 'Preencha e-mail e senha.'; return; }
  setBtnLoading(true);
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch(e) { if (err) err.textContent = traduzErro(e.code); setBtnLoading(false); }
}

async function doRegistro() {
  var email = (document.getElementById('inp-email')||{}).value;
  var pass  = (document.getElementById('inp-pass')||{}).value;
  var nameEl = document.getElementById('inp-name');
  var name  = nameEl ? nameEl.value.trim() : '';
  if (email) email = email.trim();
  var err = document.getElementById('login-err');
  if (err) err.textContent = '';
  if (!email) { if (err) err.textContent = 'Informe o e-mail.'; return; }
  if (!pass || pass.length < 6) { if (err) err.textContent = 'Senha precisa ter ao menos 6 caracteres.'; return; }
  setBtnLoading(true);
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    if (name) await cred.user.updateProfile({ displayName: name });
  } catch(e) { if (err) err.textContent = traduzErro(e.code); setBtnLoading(false); }
}

async function doReset() {
  var email = (document.getElementById('inp-reset-email')||{}).value;
  if (email) email = email.trim();
  var err = document.getElementById('login-err');
  if (err) { err.textContent = ''; err.style.color = '#ef4444'; }
  if (!email) { if (err) err.textContent = 'Informe o e-mail cadastrado.'; return; }
  setBtnLoading(true);
  try {
    await auth.sendPasswordResetEmail(email);
    if (err) { err.style.color = '#22c55e'; err.textContent = 'E-mail enviado! Verifique sua caixa de entrada.'; }
    setBtnLoading(false);
  } catch(e) { if (err) err.textContent = traduzErro(e.code); setBtnLoading(false); }
}

async function doLogout() {
  // Para todos os cronometros antes de deslogar
  Object.keys(manutsAtivas).forEach(function(k) { clearInterval(manutsAtivas[k].timerInterval); });
  manutsAtivas = {};
  if (auth) await auth.signOut();
  else { currentUser = null; showScreen('screen-login'); mostrarLogin(); }
}

function traduzErro(code) {
  var m = {
    'auth/user-not-found':'E-mail nao encontrado.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/invalid-email':'E-mail invalido.',
    'auth/email-already-in-use':'Este e-mail ja esta cadastrado.',
    'auth/weak-password':'Senha muito fraca.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/network-request-failed':'Sem conexao com a internet.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':'Erro de configuracao do Firebase.'
  };
  return m[code] || 'Erro: ' + (code || 'desconhecido');
}

function setBtnLoading(on) {
  var btn = document.getElementById('btn-submit');
  if (!btn) return;
  btn.disabled = on;
  if (on) btn.textContent = 'Aguarde...';
}

async function onLogin(user) {
  var el = document.getElementById('user-name');
  if (el) el.textContent = user.displayName || user.email;
  showScreen('screen-app');
  await loadFirestore();
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
        var i    = parseInt(ch.doc.id);
        var data = ch.doc.data();
        firestoreData[ch.doc.id] = data;
        atualizarLinhaNuvem(i);
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
    await tearRef(i).set(row, { merge:true });
    firestoreData[String(i)] = row;
    showSync('ok');
  } catch(e) { showSync('err'); salvarLocal(); }
}

function loadLocal() { try { var r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):{}; } catch(e){return{};} }
function salvarLocal() {
  var s = {};
  BASE_TEARES.forEach(function(_,i){
    s[i] = { realizado:(document.getElementById('r-'+i)||{}).value||'', real:(document.getElementById('v-'+i)||{}).value||'', dataManut:(document.getElementById('d-'+i)||{}).value||'' };
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
  tbody.innerHTML = '';
  BASE_TEARES.forEach(function(d,i) {
    var s     = getDados(i);
    var initR = (s.realizado!==undefined&&s.realizado!=='') ? s.realizado : (d.realizado!=null?d.realizado:'');
    var initV = s.real||'';
    var initD = s.dataManut||'';
    var emManut = !!manutsAtivas[i];

    var tr = document.createElement('tr');
    if (emManut) tr.style.background = 'rgba(249,115,22,0.06)';
    tr.id = 'tr-'+i;
    tr.innerHTML =
      '<td><span class="tear-num">'+d.tear+'</span></td>'+
      '<td><span class="model-name">'+d.modelo+'</span></td>'+
      '<td class="hide-mobile">'+d.rpm+'</td>'+
      '<td class="hide-mobile" style="color:var(--muted);text-align:right">'+fmt(d.setup)+'</td>'+
      '<td style="white-space:nowrap;padding:4px 6px">'+
        '<button class="btn-action btn-wrench'+(emManut?' active':'')+'" id="btn-wrench-'+i+'" onclick="clicarChave('+i+')" title="'+(emManut?'Abrir checklist':'Iniciar manutencao')+'">'+
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
      '<td style="padding:4px 6px">'+
        '<button class="btn-action btn-finish" id="btn-finish-'+i+'" onclick="abrirChecklist('+i+')" title="Finalizar manutencao" style="display:'+(emManut?'inline-flex':'none')+'">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'+
        '</button>'+
      '</td>';
    tbody.appendChild(tr);
    calcRow(i);
  });
  updateStats();
  var lbl = document.getElementById('lbl-today');
  if (lbl) lbl.textContent = today.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
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
  var realizado = (rVal!==''&&rVal!=null) ? parseFloat(rVal) : null;
  var real      = (vVal!==''&&vVal!=null) ? parseFloat(vVal) : null;
  var proximo   = realizado!=null ? realizado+d.setup : null;
  var saldo     = (real!=null&&proximo!=null) ? proximo-real : null;
  var fcDate    = (saldo!=null&&d.rpm>0) ? new Date(today.getTime()+(saldo/d.rpm/60/24)*86400000) : null;

  var sc = document.getElementById('saldo-'+i);
  if (sc) { sc.textContent=saldo!=null?fmt(Math.round(saldo)):'-'; sc.style.color=saldo==null?'var(--muted)':saldo<0?'var(--danger)':saldo<500000?'var(--warn)':'var(--ok)'; }

  var bc = document.getElementById('bar-'+i);
  if (bc) {
    if (real!=null&&proximo!=null&&proximo>0) {
      var pct=Math.max(0,Math.min(100,(real/proximo)*100));
      var col=saldo<0?'var(--danger)':saldo<500000?'var(--warn)':'var(--ok)';
      bc.innerHTML='<div style="display:flex;align-items:center;gap:6px"><div class="bar-wrap"><div class="bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div><span style="font-size:.68rem;color:var(--muted)">'+pct.toFixed(0)+'%</span></div>';
    } else bc.innerHTML='-';
  }

  var fc = document.getElementById('fc-'+i);
  if (fc) {
    if (fcDate) {
      var days=Math.round((fcDate-today)/86400000);
      var fcCol=days<0?'var(--danger)':days<=30?'var(--warn)':'var(--ok)';
      var lbl=days===0?'Hoje':days>0?'em '+days+'d':Math.abs(days)+'d atras';
      fc.innerHTML='<div class="fc-date" style="color:'+fcCol+'">'+fcDate.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+'</div><div class="fc-days">'+lbl+'</div>';
    } else fc.innerHTML='<span style="color:var(--muted)">-</span>';
  }

  var st = document.getElementById('st-'+i);
  if (st) {
    if (dataMnt) {
      st.innerHTML='<span class="chip chip-done">&#10003; '+fmtDate(dataMnt)+'</span>';
    } else if (!fcDate) {
      st.innerHTML='<span class="chip chip-na">-</span>';
    } else {
      var d2=Math.round((fcDate-today)/86400000);
      st.innerHTML=d2<0?'<span class="chip chip-danger">Vencido</span>':d2<=30?'<span class="chip chip-warn">Atencao</span>':'<span class="chip chip-ok">Em dia</span>';
    }
  }
  updateStats();
}

function updateStats() {
  var v=0,a=0,e=0;
  BASE_TEARES.forEach(function(_,i){
    var t=((document.getElementById('st-'+i)||{}).textContent||'').trim();
    if(t.indexOf('Vencido')>=0)v++;
    else if(t.indexOf('Atencao')>=0||t.indexOf('nção')>=0)a++;
    else if(t.indexOf('Em dia')>=0)e++;
  });
  var sv=document.getElementById('s-vencido');if(sv)sv.textContent=v;
  var sa=document.getElementById('s-atencao');if(sa)sa.textContent=a;
  var so=document.getElementById('s-ok');     if(so)so.textContent=e;
  var st=document.getElementById('s-total');  if(st)st.textContent=BASE_TEARES.length;
}

// =============================================================================
//  MANUTENCAO MULTIPLA — cada tear tem seu proprio cronometro
// =============================================================================
function clicarChave(i) {
  if (manutsAtivas[i]) {
    // Ja em manutencao — abre o checklist
    abrirChecklist(i);
  } else {
    // Inicia nova manutencao nesse tear (sem afetar outros)
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
    var manut = manutsAtivas[i];
    if (!manut) return;
    var elapsed = Math.floor((Date.now() - manut.startTime) / 1000);
    var h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60), s = elapsed%60;
    var rtEl = document.getElementById('rt-'+i);
    if (rtEl) rtEl.textContent = (h>0?pad(h)+':':'')+pad(m)+':'+pad(s);
    // Atualiza timer do modal se estiver aberto nesse tear
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

  document.getElementById('cl-title').textContent  = 'Checklist — Tear '+d.tear;
  document.getElementById('cl-modelo').textContent = d.modelo;

  // Timer
  if (manut) {
    var elapsed = Math.floor((Date.now()-manut.startTime)/1000);
    var h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
    document.getElementById('modal-timer').textContent = pad(h)+':'+pad(m)+':'+pad(s);
  }

  // Constroi itens do checklist
  var body = document.getElementById('cl-body');
  body.innerHTML = '';
  CHECKLIST_ITENS.forEach(function(item, idx) {
    var saved = (manut && manut.checklist[idx]) || {};
    var row = document.createElement('div');
    row.className = 'cl-row';
    row.innerHTML =
      '<div class="cl-item-name">'+item+'</div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-verif-'+idx+'" '+(saved.verif?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-ajuste-'+idx+'" '+(saved.ajuste?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-limpeza-'+idx+'" '+(saved.limpeza?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-lubrif-'+idx+'" '+(saved.lubrif?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div class="cl-check"><input type="checkbox" id="cl-troca-'+idx+'" '+(saved.troca?'checked':'')+' onchange="clUpdate('+i+','+idx+')"></div>'+
      '<div><input class="cl-qty" type="number" id="cl-qty-'+idx+'" value="'+(saved.qtde||'')+'" placeholder="-" onchange="clUpdate('+i+','+idx+')" min="0"></div>';
    body.appendChild(row);
  });

  var obsEl = document.getElementById('cl-obs');
  if (obsEl) obsEl.value = (manut && manut.obs) || '';

  atualizarProgressoCL(i);
  document.getElementById('modal-checklist').classList.add('open');
}

function clUpdate(tearIdx, itemIdx) {
  var manut = manutsAtivas[tearIdx];
  if (!manut) return;
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
  var elapsed = Math.floor((Date.now()-manut.startTime)/1000);
  var obsEl   = document.getElementById('cl-obs');
  var obs     = obsEl ? obsEl.value.trim() : '';

  // Salva estado final do checklist
  CHECKLIST_ITENS.forEach(function(_,idx) { clUpdate(i, idx); });

  var registro = {
    tearIndex:  i,
    tear:       d.tear,
    modelo:     d.modelo,
    inicio:     new Date(manut.startTime).toISOString(),
    fim:        new Date().toISOString(),
    duracaoSeg: elapsed,
    tecnico:    currentUser ? (currentUser.displayName||currentUser.email) : 'desconhecido',
    obs:        obs,
    checklist:  JSON.parse(JSON.stringify(manut.checklist)),
    createdAt:  usingFirebase ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
  };

  if (usingFirebase && db && currentUser) {
    try { await histCol().add(registro); showSync('ok'); }
    catch(e) { console.error('Erro historico:', e); showSync('err'); }
  }

  // Atualiza data na linha
  var dEl  = document.getElementById('d-'+i);
  var hoje = new Date().toISOString().slice(0,10);
  if (dEl) { dEl.value = hoje; onChange(i); }

  // Limpa manutencao
  fecharChecklist();
  clearInterval(manut.timerInterval);
  delete manutsAtivas[i];

  var btnW = document.getElementById('btn-wrench-'+i);
  var rt   = document.getElementById('rt-'+i);
  var btnF = document.getElementById('btn-finish-'+i);
  var tr   = document.getElementById('tr-'+i);
  if (btnW) btnW.classList.remove('active');
  if (rt)   { rt.style.display='none'; rt.textContent='00:00'; }
  if (btnF) btnF.style.display='none';
  if (tr)   tr.style.background='';

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
  if (!usingFirebase || !db) {
    document.getElementById('hist-body').innerHTML = '<div class="empty-state"><p>Historico disponivel apenas com Firebase conectado.</p></div>';
    return;
  }
  try {
    var snap = await histCol().orderBy('inicio','desc').limit(100).get();
    _historicoTodos = [];
    snap.forEach(function(doc) { _historicoTodos.push(doc.data()); });
    renderHistorico(_historicoTodos);
  } catch(e) {
    document.getElementById('hist-body').innerHTML = '<div class="empty-state"><p>Erro ao carregar. Verifique regras do Firestore.</p></div>';
  }
}

function fecharHistorico() { document.getElementById('modal-historico').classList.remove('open'); }

function filtrarHistorico(filtro, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  if (btn) btn.classList.add('active');
  var agora = new Date();
  var dados = _historicoTodos;
  if (filtro === 'mes') {
    dados = _historicoTodos.filter(function(r){var d=new Date(r.inicio);return d.getMonth()===agora.getMonth()&&d.getFullYear()===agora.getFullYear();});
  } else if (filtro === 'semana') {
    var ini=new Date(agora);ini.setDate(agora.getDate()-agora.getDay());ini.setHours(0,0,0,0);
    dados = _historicoTodos.filter(function(r){return new Date(r.inicio)>=ini;});
  }
  renderHistorico(dados);
}

function renderHistorico(lista) {
  var body = document.getElementById('hist-body');
  if (!lista||lista.length===0) {
    body.innerHTML='<div class="empty-state"><p>Nenhuma manutencao registrada neste periodo.</p></div>';
    return;
  }
  body.innerHTML = lista.map(function(r) {
    var dt=new Date(r.inicio);
    var dtFmt=dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    var dur=r.duracaoSeg||0,h=Math.floor(dur/3600),m=Math.floor((dur%3600)/60),s=dur%60;
    var durStr=h>0?pad(h)+'h '+pad(m)+'min':pad(m)+'min '+pad(s)+'s';
    var itens=0;
    if(r.checklist)Object.values(r.checklist).forEach(function(item){if(item&&(item.verif||item.ajuste||item.limpeza||item.lubrif||item.troca))itens++;});
    return '<div class="hist-item">'+
      '<div class="hist-head"><span class="hist-tear">Tear '+r.tear+'</span><span class="hist-modelo">'+r.modelo+'</span><span class="hist-date">'+dtFmt+'</span></div>'+
      '<div class="hist-meta">'+
        '<span>&#9201; <strong>'+durStr+'</strong></span>'+
        '<span>&#128295; <strong>'+itens+'/'+CHECKLIST_ITENS.length+' itens</strong></span>'+
        '<span>&#128100; <strong>'+(r.tecnico||'-')+'</strong></span>'+
      '</div>'+
      (r.obs?'<div class="hist-obs">'+r.obs+'</div>':'')+
    '</div>';
  }).join('');
}

// =============================================================================
//  NOTIFICACOES
// =============================================================================
async function requestNotificationPermission() {
  if(!('Notification' in window)){showToast('Dispositivo nao suporta notificacoes.');return;}
  var perm=await Notification.requestPermission();
  if(perm==='granted'){var btn=document.getElementById('btn-notif');if(btn)btn.textContent='&#128276; Notificacoes ativas';showToast('Notificacoes ativadas!');scheduleNotifications();}
}
function scheduleNotifications(){if(typeof Notification==='undefined'||Notification.permission!=='granted')return;checkNotify();setInterval(checkNotify,24*60*60*1000);}
function checkNotify(){
  var alerts=[];
  BASE_TEARES.forEach(function(d,i){var s=getDados(i),realizado=s.realizado?parseFloat(s.realizado):d.realizado,real=s.real?parseFloat(s.real):null;if(realizado==null||real==null||d.rpm===0)return;var days=Math.round(((realizado+d.setup)-real)/d.rpm/60/24);if(days<=7&&!s.dataManut)alerts.push({tear:d.tear,days:days});});
  if(!alerts.length)return;
  var v=alerts.filter(function(a){return a.days<0;}),p=alerts.filter(function(a){return a.days>=0;});
  var body='';if(v.length)body+=v.length+' tear(es) com manutencao vencida. ';if(p.length)body+=p.length+' tear(es) nos proximos 7 dias.';
  new Notification('Manutencao Preventiva',{body:body,icon:'/icons/icon-192.png',tag:'mp-daily'});
}

// =============================================================================
//  EXPORT
// =============================================================================
function exportCSV(){
  var rows=[['Tear','Modelo','RPM','Setup','Data Manutencao','Realizado','Real (Voltas)','Saldo','Proxima','Status']];
  BASE_TEARES.forEach(function(d,i){var s=getDados(i),realizado=(s.realizado!==undefined&&s.realizado!=='')?parseFloat(s.realizado):(d.realizado||'');var real=s.real?parseFloat(s.real):'',dataMnt=s.dataManut||'';var proximo=realizado!==''?realizado+d.setup:'',saldo=real!==''&&proximo!==''?proximo-real:'';var fc='',status='';if(saldo!==''&&d.rpm>0){var fcDate=new Date(today.getTime()+(saldo/d.rpm/60/24)*86400000);fc=fcDate.toLocaleDateString('pt-BR');var days=Math.round((fcDate-today)/86400000);status=dataMnt?'Realizada':days<0?'Vencido':days<=30?'Atencao':'Em dia';}rows.push([d.tear,d.modelo,d.rpm,d.setup,dataMnt,realizado,real,saldo,fc,status]);});
  var csv=rows.map(function(r){return r.map(function(v){return '"'+v+'"';}).join(',');}).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='manutencao_'+today.toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url);showToast('CSV exportado!');
}

// =============================================================================
//  UI
// =============================================================================
function showScreen(id){
  ['screen-login','screen-app'].forEach(function(s){var el=document.getElementById(s);if(!el)return;el.style.display=(s===id)?(id==='screen-login'?'flex':'block'):'none';});
}
function showSync(state,extra){
  var el=document.getElementById('sync-indicator');if(!el)return;
  var m={sync:['Sincronizando...','#7a8aaa'],ok:['Salvo na nuvem','#22c55e'],err:['Erro ao salvar','#ef4444'],realtime:['Atualizado por','#38bdf8']};
  var p=m[state]||m.ok;el.textContent=extra?p[0]+' '+extra:p[0];el.style.color=p[1];el.style.opacity='1';
  if(state!=='sync')setTimeout(function(){el.style.opacity='0';},4000);
}
function showToast(msg){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3000);}
function toggleMenu(){var m=document.getElementById('menu-dropdown');if(m)m.classList.toggle('open');}
document.addEventListener('click',function(e){var menu=document.getElementById('menu-dropdown'),btn=document.getElementById('btn-menu');if(menu&&!menu.contains(e.target)&&btn&&!btn.contains(e.target))menu.classList.remove('open');});
function fmt(n){return(n!=null&&n!=='')? Number(n).toLocaleString('pt-BR'):'-';}
function fmtDate(str){if(!str)return'-';var p=str.split('-');return p[2]+'/'+p[1]+'/'+p[0];}

// =============================================================================
//  PWA
// =============================================================================
var deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;var btn=document.getElementById('btn-install');if(btn)btn.style.display='flex';});
async function installPWA(){if(!deferredPrompt)return;deferredPrompt.prompt();var r=await deferredPrompt.userChoice;if(r.outcome==='accepted'){var btn=document.getElementById('btn-install');if(btn)btn.style.display='none';showToast('App instalado!');}deferredPrompt=null;}
window.addEventListener('appinstalled',function(){var btn=document.getElementById('btn-install');if(btn)btn.style.display='none';});
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('[SW]',e);});}

// =============================================================================
//  INIT
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  var btnSubmit=document.getElementById('btn-submit');      if(btnSubmit)btnSubmit.onclick=submitForm;
  var btnToggle=document.getElementById('btn-toggle-reg');  if(btnToggle)btnToggle.onclick=toggleTela;
  var btnForgot=document.getElementById('btn-forgot');      if(btnForgot)btnForgot.onclick=mostrarReset;
  var btnBack  =document.getElementById('btn-back');        if(btnBack)btnBack.onclick=mostrarLogin;
  var inputPass=document.getElementById('inp-pass');        if(inputPass)inputPass.addEventListener('keydown',function(e){if(e.key==='Enter')submitForm();});
  initFirebase();
});
