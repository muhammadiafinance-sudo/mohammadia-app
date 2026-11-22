/* ============================================================
   MOHAMMADIA HISAB — glue for the two-login app.
   Bank login  → the Bank portal (copied from the shop app, unchanged)
   Shop login  → the shop Daily Hisab sheet only
   Uses its OWN Firebase project (config.js). No sales, stock or
   POS data exists here, so nothing reads the shop app's data.
   ============================================================ */
var CFG = window.HISAB_FIREBASE_CONFIG || {};
var ROLE_EMAILS = window.HISAB_ROLE_EMAILS || {};
var CONFIG_OK = !!CFG.apiKey && !/PASTE/.test(JSON.stringify(CFG));
// The shop app is served from this address. Device storage is shared per address,
// so this app must live on its own address to keep the two apps' data apart.
var SHOP_APP_HOSTS = ['muhammadiafinance-sudo.github.io'];
var SAME_ORIGIN_AS_SHOP = SHOP_APP_HOSTS.indexOf(location.hostname) >= 0;

var fsdb = null, fbAuth = null, CLOUD_DOC = null;
if (CONFIG_OK && !SAME_ORIGIN_AS_SHOP) {
  firebase.initializeApp(CFG);
  fsdb = firebase.firestore();
  try { fsdb.settings({ experimentalAutoDetectLongPolling: true }); } catch (e) {}
  try { fsdb.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
  fbAuth = firebase.auth();
  // Same layout as the shop app, so the copied hisab code works unchanged.
  CLOUD_DOC = fsdb.collection('mohammadia_library').doc('main_db');
}

var currentRole = null;          // 'admin' (Shop) | 'employee' (Bank) | null
var loginRoleChoice = 'employee';

function $(id) { return document.getElementById(id); }
function roleOfUser(u) { var e = String((u && u.email) || '').toLowerCase(); return ROLE_EMAILS[e] || null; }
function emailForRole(r) { return Object.keys(ROLE_EMAILS).find(function (k) { return ROLE_EMAILS[k] === r; }); }
function hideBootOverlay() {
  var o = $('bootOverlay'); if (!o) return;
  o.classList.add('hide');
  setTimeout(function () { o.style.display = 'none'; }, 280);
}
// The Daily Hisab "back" button asks the host to close its page; here it is the whole app.
function closeActionModal() {}

function authErrorText(e) {
  var c = (e && e.code) || '';
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password' || c === 'auth/user-not-found' || c === 'auth/invalid-login-credentials') return 'Incorrect password. Please try again.';
  if (c === 'auth/too-many-requests') return 'Too many wrong attempts. Please wait a few minutes and try again.';
  if (c === 'auth/network-request-failed') return 'No internet connection. Please check your network and try again.';
  if (c === 'auth/user-disabled') return 'This account has been disabled in Firebase.';
  if (c === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled in Firebase Authentication.';
  if (c === 'app/no-role') return 'This account is not allowed to use this app.';
  if (c === 'app/no-account') return 'This login is not set up yet (see config.js).';
  return 'Login failed' + (c ? ' (' + c + ')' : '') + '. Please try again.';
}

function selectLoginRole(role) {
  loginRoleChoice = role;
  var a = $('roleBtnAdmin'), b = $('roleBtnEmployee');
  a.classList.toggle('active', role === 'admin'); b.classList.toggle('active', role === 'employee');
  a.setAttribute('aria-selected', role === 'admin' ? 'true' : 'false');
  b.setAttribute('aria-selected', role === 'employee' ? 'true' : 'false');
  var rd = $('bkRoleDesc'); if (rd) rd.textContent = role === 'admin' ? 'Daily Hisab.' : 'DBBL daily hisab & bank dashboard.';
  $('loginError').classList.remove('show');
}

function showLoginError(msg) {
  var le = $('loginError');
  le.textContent = msg; le.classList.remove('show'); void le.offsetWidth; le.classList.add('show');
}

async function forgotPassword() {
  var btn = $('forgotBtn'), msg = $('forgotMsg');
  var email = emailForRole(loginRoleChoice);
  if (!fbAuth || !email) return;
  var show = function (txt, ok) { msg.style.display = 'block'; msg.textContent = txt; msg.style.background = ok ? '#e6f4ea' : '#fce8e6'; msg.style.color = ok ? '#188038' : '#b42318'; };
  var label = loginRoleChoice === 'admin' ? 'Shop' : 'Bank';
  if (!confirm('Send a password reset link for the ' + label + ' account to its email inbox?')) return;
  btn.disabled = true;
  try {
    await fbAuth.sendPasswordResetEmail(email);
    show('Link sent. Open the email (check Spam too), tap the link and set a new password.', true);
    var n = 60, iv = setInterval(function () { n--; btn.textContent = n > 0 ? 'Resend in ' + n + 's' : 'Forgot password?'; if (n <= 0) { clearInterval(iv); btn.disabled = false; } }, 1000);
  } catch (e) {
    var c = (e && e.code) || '';
    show(c === 'auth/too-many-requests' ? 'Too many requests. Please wait a few minutes.' : c === 'auth/network-request-failed' ? 'No internet connection.' : 'Could not send the email' + (c ? ' (' + c + ')' : '') + '.', false);
    btn.disabled = false;
  }
}

function toggleLoginPw() {
  var inp = $('loginPassword');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  $('pwToggleBtn').textContent = inp.type === 'password' ? '👁️' : '🙈';
}

async function doLogin() {
  var pwEl = $('loginPassword'), pw = pwEl.value;
  if (!pw) { showLoginError('Please enter a password.'); return; }
  if (!fbAuth) return;
  $('loginBtnText').textContent = 'Signing in...';
  $('loginSpinner').classList.add('show');
  $('loginBtn').disabled = true;
  try {
    var email = emailForRole(loginRoleChoice);
    if (!email) throw { code: 'app/no-account' };
    var cred = await fbAuth.signInWithEmailAndPassword(email, pw);
    var role = roleOfUser(cred.user);
    if (!role) { await fbAuth.signOut(); throw { code: 'app/no-role' }; }
    pwEl.value = '';
    $('loginError').classList.remove('show');
    enterApp(role, true);
  } catch (e) {
    console.error('Login failed:', e);
    showLoginError(authErrorText(e));
    pwEl.value = ''; pwEl.focus();
  }
  $('loginBtnText').textContent = 'Sign In';
  $('loginSpinner').classList.remove('show');
  $('loginBtn').disabled = false;
}

function showShopHisab() {
  document.body.classList.remove('booting');
  $('shopApp').classList.add('show');
  hideBootOverlay();
  if (window.initHisabFrame) window.initHisabFrame('daily');   // starts the hisab_daily cloud store
}

function enterApp(role, animate) {
  currentRole = role;
  document.body.classList.toggle('role-employee', role === 'employee');
  document.body.classList.toggle('role-admin', role === 'admin');
  var ls = $('loginScreen');
  var go = function () {
    ls.style.display = 'none';
    if (role === 'employee') window.showBankApp(); else showShopHisab();
  };
  if (animate) { ls.classList.add('leaving'); setTimeout(go, 320); } else go();
}

function doLogout() {
  if (!confirm('Log out of the current session?')) return;
  var done = function () { location.reload(); };
  if (fbAuth) fbAuth.signOut().then(done, done); else done();
}

function setupNotice(title, html) {
  var n = $('setupNotice');
  n.innerHTML = '<div class="box"><h2></h2><div class="t"></div></div>';
  n.querySelector('h2').textContent = title;
  n.querySelector('.t').innerHTML = html;
  n.classList.add('show');
  document.body.classList.remove('booting');
  hideBootOverlay();
}

async function startHisabApp() {
  selectLoginRole('employee');
  if (SAME_ORIGIN_AS_SHOP) {
    setupNotice('Open this app from its own address',
      'This page is on the same web address as the shop app, so the two apps would mix data saved on this device. ' +
      'Open Mohammadia Hisab from its own address instead (see <b>hisab-app/README.md</b>).');
    return;
  }
  if (!CONFIG_OK) {
    setupNotice('Firebase is not set up yet',
      'Put the new Firebase project\'s config into <b>config.js</b> (next to this page), then reload. ' +
      'Steps are in <b>hisab-app/README.md</b>.');
    return;
  }
  var user = null;
  try { user = await new Promise(function (res) { var un = fbAuth.onAuthStateChanged(function (u) { un(); res(u); }); }); } catch (e) {}
  var role = user ? roleOfUser(user) : null;
  if (user && !role) { try { await fbAuth.signOut(); } catch (e) {} user = null; }
  if (user && role) { enterApp(role, false); return; }
  document.body.classList.remove('booting');
  hideBootOverlay();
  $('loginPassword').focus();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
