// =============================================================================
//  MANUTENCAO PREVENTIVA - app.js v3.1
//  Fix: API key, recuperacao de senha, sincronizacao em tempo real
// =============================================================================

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAXTpEVEkwT6mcN40wyox0mii7SARFNOsw",
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

var db = null, auth = null, currentUser = null;
var firestoreData = {}, usingFirebase = false;
var today = new Date(); today.setHours(0,0,0,0);
var STORAGE_KEY = 'mp_preventiva_v4';
var EMPRESA_ID  = 'mpdoptex';

// =============================================================================
//  FIREBASE
// =============================================================================
function initFirebase() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db   = firebase.firestore();
    usingFirebase = true;
    auth.onAuthStateChanged(function(user) {
      if (user) { currentUser = user; onLogin(user); }
      else      { currentUser = null; showScreen('screen-login'); }
    });
  } catch(e) {
    usingFirebase = false;
    showScreen('screen-app');
    buildTable();
  }
}

function tearRef(i)    { return db.collection('empresa').doc(EMPRESA_ID).collection('teares').doc(String(i)); }
function tearCol()     { return db.collection('empresa').doc(EMPRESA_ID).collection('teares'); }

// =============================================================================
//  AUTH
// =============================================================================
var _tela = 'login'; // 'login' | 'registro' | 'reset'

function mostrarLogin() {
  _tela = 'login';
  document.getElementById('reg-fields').style.display   = 'none';
  document.getElementById('reset-fields').style.display = 'none';
  document.getElementById('campo-senha').style.display  = 'block';
  document.getElementById('login-title').textContent    = 'Entrar';
  document.getElementById('btn-submit').textContent     = 'Entrar';
  document.getElementById('btn-toggle-reg').textContent = 'Nao tem conta? Cadastre-se';
  document.getElementById('btn-forgot').style.display   = 'block';
  document.getElementById('btn-back').style.display     = 'none';
  document.getElementById('login-err').textContent      = '';
  document.getElementById('login-err').style.color      = '#ef4444';
}

function mostrarRegistro() {
  _tela = 'registro';
  document.getElementById('reg-fields').style.display   = 'flex';
  document.getElementById('reset-fields').style.display = 'none';
  document.getElementById('campo-senha').style.display  = 'block';
  document.getElementById('login-title').textContent    = 'Criar Conta';
  document.getElementById('btn-submit').textContent     = 'Criar conta';
  document.getElementById('btn-toggle-reg').textContent = 'Ja tem conta? Entrar';
  document.getElementById('btn-forgot').style.display   = 'none';
  document.getElementById('btn-back').style.display     = 'none';
  document.getElementById('login-err').textContent      = '';
}

function mostrarReset() {
  _tela = 'reset';
  document.getElementById('reg-fields').style.display   = 'none';
  document.getElementById('reset-fields').style.display = 'flex';
  document.getElementById('campo-senha').style.display  = 'none';
  document.getElementById('login-title').textContent    = 'Recuperar Senha';
  document.getElementById('btn-submit').textContent     = 'Enviar e-mail';
  document.getElementById('btn-toggle-reg').style.display = 'none';
  document.getElementById('btn-forgot').style.display     = 'none';
  document.getElementById('btn-back').style.display       = 'block';
  document.getElementById('login-err').textContent        = '';
}

function toggleTela() {
  if (_tela === 'login') mostrarRegistro();
  else mostrarLogin();
}

function submitForm() {
  if (_tela === 'login')    doLogin();
  else if (_tela === 'registro') doRegistro();
  else if (_tela === 'reset')    doReset();
}

async function doLogin() {
  var email = document.getElementById('inp-email').value.trim();
  var pass  = document.getElementById('inp-pass').value;
  var err   = document.getElementById('login-err');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'Preencha e-mail e senha.'; return; }
  setBtnLoading(true);
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch(e) { err.textContent = traduzErro(e.code); setBtnLoading(false); }
}

async function doRegistro() {
  var email = document.getElementById('inp-email').value.trim();
  var pass  = document.getElementById('inp-pass').value;
  var name  = document.getElementById('inp-name') ? document.getElementById('inp-name').value.trim() : '';
  var err   = document.getElementById('login-err');
  err.textContent = '';
  if (!email) { err.textContent = 'Informe o e-mail.'; return; }
  if (pass.length < 6) { err.textContent = 'A senha precisa ter ao menos 6 caracteres.'; return; }
  setBtnLoading(true);
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    if (name) await cred.user.updateProfile({ displayName: name });
  } catch(e) { err.textContent = traduzErro(e.code); setBtnLoading(false); }
}

async function doReset() {
  var email = document.getElementById('inp-reset-email').value.trim();
  var err   = document.getElementById('login-err');
  err.textContent = '';
  if (!email) { err.textContent = 'Informe o e-mail cadastrado.'; return; }
  setBtnLoading(true);
  try {
    await auth.sendPasswordResetEmail(email);
    err.style.color = '#22c55e';
    err.textContent = 'E-mail enviado! Verifique sua caixa de entrada (e o spam).';
    setBtnLoading(false);
  } catch(e) {
    err.style.color = '#ef4444';
    err.textContent = traduzErro(e.code);
    setBtnLoading(false);
  }
}

async function doLogout() {
  if (auth) await auth.signOut();
  else showScreen('screen-login');
}

function traduzErro(code) {
  var m = {
    'auth/user-not-found':         'E-mail nao encontrado.',
    'auth/wrong-password':         'Senha incorreta.',
    'auth/invalid-email':          'E-mail invalido.',
    'auth/email-already-in-use':   'Este e-mail ja esta cadastrado.',
    'auth/weak-password':          'Senha muito fraca. Use ao menos 6 caracteres.',
    'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential':     'E-mail ou senha incorretos.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Erro de configuracao. Veja instrucoes abaixo.',
    'auth/network-request-failed': 'Sem conexao com a internet.'
  };
  return m[code] || ('Erro: ' + code);
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
  var s   = firestoreData[String(i)]; if (!s) return;
  var rEl = document.getElementById('r-' + i);
  var vEl = document.getElementById('v-' + i);
  var dEl = document.getElementById('d-' + i);
  if (rEl && document.activeElement !== rEl) rEl.value = s.realizado || '';
  if (vEl && document.activeElement !== vEl) vEl.value = s.real      || '';
  if (dEl && document.activeElement !== dEl) dEl.value = s.dataManut || '';
  calcRow(i);
}

async function salvarLinha(i) {
  if (!db || !currentUser) { salvarLocal(); return; }
  var row = {
    realizado: (document.getElementById('r-' + i)||{}).value || '',
    real:      (document.getElementById('v-' + i)||{}).value || '',
    dataManut: (document.getElementById('d-' + i)||{}).value || '',
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
  try { var r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function salvarLocal() {
  var s = {};
  BASE_TEARES.forEach(function(_, i) {
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
  tbody.innerHTML = '';
  BASE_TEARES.forEach(function(d, i) {
    var s     = getDados(i);
    var initR = (s.realizado !== undefined && s.realizado !== '') ? s.realizado : (d.realizado != null ? d.realizado : '');
    var initV = s.real      || '';
    var initD = s.dataManut || '';
    var tr    = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="tear-num">' + d.tear + '</span></td>' +
      '<td><span class="model-name">' + d.modelo + '</span></td>' +
      '<td class="hide-mobile">' + d.rpm + '</td>' +
      '<td class="hide-mobile" style="color:var(--muted);text-align:right">' + fmt(d.setup) + '</td>' +
      '<td><input class="cell-input input-date inp-info" type="date" id="d-' + i + '" value="' + initD + '" onchange="onChange(' + i + ')"></td>' +
      '<td><input class="cell-input input-num inp-accent" type="number" id="r-' + i + '" value="' + initR + '" placeholder="0" oninput="calcRow(' + i + ')" onblur="onChange(' + i + ')"></td>' +
      '<td><input class="cell-input input-num inp-accent" type="number" id="v-' + i + '" value="' + initV + '" placeholder="Leitura atual" oninput="calcRow(' + i + ')" onblur="onChange(' + i + ')"></td>' +
      '<td id="saldo-' + i + '" class="hide-mobile" style="text-align:right;font-weight:500">-</td>' +
      '<td id="bar-' + i + '" class="hide-mobile">-</td>' +
      '<td id="fc-' + i + '">-</td>' +
      '<td id="st-' + i + '">-</td>';
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
  var d        = BASE_TEARES[i];
  var rVal     = (document.getElementById('r-'+i)||{}).value;
  var vVal     = (document.getElementById('v-'+i)||{}).value;
  var dataMnt  = (document.getElementById('d-'+i)||{}).value;
  var realizado = (rVal !== '' && rVal != null) ? parseFloat(rVal) : null;
  var real      = (vVal !== '' && vVal != null) ? parseFloat(vVal) : null;
  var proximo   = realizado != null ? realizado + d.setup : null;
  var saldo     = (real != null && proximo != null) ? proximo - real : null;
  var fcDate    = (saldo != null && d.rpm > 0) ? new Date(today.getTime() + (saldo/d.rpm/60/24)*86400000) : null;

  var sc = document.getElementById('saldo-'+i);
  if (sc) { sc.textContent = saldo != null ? fmt(Math.round(saldo)) : '-'; sc.style.color = saldo==null?'var(--muted)':saldo<0?'var(--danger)':saldo<500000?'var(--warn)':'var(--ok)'; }

  var bc = document.getElementById('bar-'+i);
  if (bc) {
    if (real!=null && proximo!=null && proximo>0) {
      var pct = Math.max(0,Math.min(100,(real/proximo)*100));
      var col = saldo<0?'var(--danger)':saldo<500000?'var(--warn)':'var(--ok)';
      bc.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><div class="bar-wrap"><div class="bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div><span style="font-size:.68rem;color:var(--muted)">'+pct.toFixed(0)+'%</span></div>';
    } else bc.innerHTML = '-';
  }

  var fc = document.getElementById('fc-'+i);
  if (fc) {
    if (fcDate) {
      var days = Math.round((fcDate-today)/86400000);
      var fcCol = days<0?'var(--danger)':days<=30?'var(--warn)':'var(--ok)';
      var lbl   = days===0?'Hoje':days>0?'em '+days+'d':Math.abs(days)+'d atras';
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
      var d2 = Math.round((fcDate-today)/86400000);
      st.innerHTML = d2<0 ? '<span class="chip chip-danger">Vencido</span>' : d2<=30 ? '<span class="chip chip-warn">Atencao</span>' : '<span class="chip chip-ok">Em dia</span>';
    }
  }
  updateStats();
}

function updateStats() {
  var v=0,a=0,e=0;
  BASE_TEARES.forEach(function(_,i) {
    var t = ((document.getElementById('st-'+i)||{}).textContent||'').trim();
    if (t.indexOf('Vencido')>=0) v++;
    else if (t.indexOf('Atencao')>=0||t.indexOf('nção')>=0) a++;
    else if (t.indexOf('Em dia')>=0) e++;
  });
  var sv=document.getElementById('s-vencido'); if(sv)sv.textContent=v;
  var sa=document.getElementById('s-atencao'); if(sa)sa.textContent=a;
  var so=document.getElementById('s-ok');      if(so)so.textContent=e;
  var st=document.getElementById('s-total');   if(st)st.textContent=BASE_TEARES.length;
}

// =============================================================================
//  NOTIFICACOES
// =============================================================================
async function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Dispositivo nao suporta notificacoes.'); return; }
  var perm = await Notification.requestPermission();
  var btn  = document.getElementById('btn-notif');
  if (perm === 'granted') {
    if (btn) btn.textContent = '🔔 Notificacoes ativas';
    showToast('Notificacoes ativadas!');
    scheduleNotifications();
  } else {
    showToast('Permissao negada pelo navegador.');
  }
}
function scheduleNotifications() {
  if (typeof Notification==='undefined'||Notification.permission!=='granted') return;
  checkNotify();
  setInterval(checkNotify, 24*60*60*1000);
}
function checkNotify() {
  var alerts=[];
  BASE_TEARES.forEach(function(d,i) {
    var s=getDados(i), realizado=s.realizado?parseFloat(s.realizado):d.realizado, real=s.real?parseFloat(s.real):null;
    if (realizado==null||real==null||d.rpm===0) return;
    var days=Math.round(((realizado+d.setup)-real)/d.rpm/60/24);
    if (days<=7&&!s.dataManut) alerts.push({tear:d.tear,days:days});
  });
  if (!alerts.length) return;
  var v=alerts.filter(function(a){return a.days<0;}), p=alerts.filter(function(a){return a.days>=0;});
  var body='';
  if (v.length) body+=v.length+' tear(es) com manutencao vencida. ';
  if (p.length) body+=p.length+' tear(es) nos proximos 7 dias.';
  new Notification('Manutencao Preventiva',{body:body,icon:'/icons/icon-192.png',tag:'mp-daily'});
}

// =============================================================================
//  EXPORT
// =============================================================================
function exportCSV() {
  var rows=[['Tear','Modelo','RPM','Setup','Data Manutencao','Realizado','Real (Voltas)','Saldo','Proxima','Status']];
  BASE_TEARES.forEach(function(d,i) {
    var s=getDados(i), realizado=(s.realizado!==undefined&&s.realizado!=='')?parseFloat(s.realizado):(d.realizado||'');
    var real=s.real?parseFloat(s.real):'', dataMnt=s.dataManut||'';
    var proximo=realizado!==''?realizado+d.setup:'', saldo=real!==''&&proximo!==''?proximo-real:'';
    var fc='',status='';
    if (saldo!==''&&d.rpm>0) {
      var fcDate=new Date(today.getTime()+(saldo/d.rpm/60/24)*86400000);
      fc=fcDate.toLocaleDateString('pt-BR');
      var days=Math.round((fcDate-today)/86400000);
      status=dataMnt?'Realizada':days<0?'Vencido':days<=30?'Atencao':'Em dia';
    }
    rows.push([d.tear,d.modelo,d.rpm,d.setup,dataMnt,realizado,real,saldo,fc,status]);
  });
  var csv=rows.map(function(r){return r.map(function(v){return '"'+v+'"';}).join(',');}).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download='manutencao_'+today.toISOString().slice(0,10)+'.csv'; a.click();
  URL.revokeObjectURL(url); showToast('CSV exportado!');
}

// =============================================================================
//  UI
// =============================================================================
function showScreen(id) {
  ['screen-login','screen-app'].forEach(function(s) {
    var el=document.getElementById(s); if(!el)return;
    el.style.display=(s===id)?(id==='screen-login'?'flex':'block'):'none';
  });
}
function showSync(state, extra) {
  var el=document.getElementById('sync-indicator'); if(!el)return;
  var m={sync:['Sincronizando...','#7a8aaa'],ok:['Salvo na nuvem','#22c55e'],err:['Erro ao salvar','#ef4444'],realtime:['Atualizado por','#38bdf8']};
  var p=m[state]||m.ok;
  el.textContent=extra?p[0]+' '+extra:p[0]; el.style.color=p[1]; el.style.opacity='1';
  if (state!=='sync') setTimeout(function(){el.style.opacity='0';},4000);
}
function showToast(msg) {
  var t=document.getElementById('toast'); if(!t)return;
  t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000);
}
function toggleMenu() { var m=document.getElementById('menu-dropdown'); if(m)m.classList.toggle('open'); }
document.addEventListener('click',function(e){
  var menu=document.getElementById('menu-dropdown'), btn=document.getElementById('btn-menu');
  if(menu&&!menu.contains(e.target)&&btn&&!btn.contains(e.target)) menu.classList.remove('open');
});
function fmt(n){ return (n!=null&&n!=='') ? Number(n).toLocaleString('pt-BR') : '-'; }
function fmtDate(str){ if(!str)return '-'; var p=str.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

// =============================================================================
//  PWA
// =============================================================================
var deferredPrompt=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault(); deferredPrompt=e;
  var btn=document.getElementById('btn-install'); if(btn)btn.style.display='flex';
});
async function installPWA(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  var r=await deferredPrompt.userChoice;
  if(r.outcome==='accepted'){var btn=document.getElementById('btn-install');if(btn)btn.style.display='none';showToast('App instalado!');}
  deferredPrompt=null;
}
window.addEventListener('appinstalled',function(){var btn=document.getElementById('btn-install');if(btn)btn.style.display='none';});
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('[SW]',e);}); }

// =============================================================================
//  INIT
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  // Botoes da tela de login
  var btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit) btnSubmit.onclick = submitForm;

  var btnToggle = document.getElementById('btn-toggle-reg');
  if (btnToggle) btnToggle.onclick = toggleTela;

  var btnForgot = document.getElementById('btn-forgot');
  if (btnForgot) btnForgot.onclick = mostrarReset;

  var btnBack = document.getElementById('btn-back');
  if (btnBack) btnBack.onclick = mostrarLogin;

  // Enter no campo de senha faz login
  var inputPass = document.getElementById('inp-pass');
  if (inputPass) inputPass.addEventListener('keydown', function(e){ if(e.key==='Enter') submitForm(); });

  initFirebase();
});
