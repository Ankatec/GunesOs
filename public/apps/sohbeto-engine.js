// ===== CACHE BUST: Force reload if stale version detected =====
(function(){
    var VER = 'v2026_05_16_call_bridge_sync_1';
    try {
        var stored = sessionStorage.getItem('_sp_ver');
        if (stored && stored !== VER) {
            sessionStorage.setItem('_sp_ver', VER);
            location.reload(true);
            return;
        }
        sessionStorage.setItem('_sp_ver', VER);
    } catch(e){}
})();
/* ====================================================================
   SOHBET PRO - Full Update
   ==================================================================== */

const CONFIG = {
    chatHost: "wss://web29.topsportlivers.com/imws",
    countHost: "wss://web.topsportlivers.com/ws/realtime?K-Access-Token=eyJhbGciOiJSUzI1NiJ9.eyJLLUFjY2Vzcy1Ub2tlbiI6IntcImFnZW50XCI6XCJQQ1wiLFwiZGV2aWNlSWRcIjpcIlwiLFwiZ3Vlc3RcIjpmYWxzZSxcImlkXCI6XCIxOTYxMTE2MjA0NjI2MDg3OTM2XCIsXCJtb2JpbGVcIjpcIlwiLFwibW9iaWxlVXNlclwiOmZhbHNlLFwicGxhdGZvcm1cIjpcIlBDXCIsXCJ1c2VyVHlwZVwiOjEsXCJ1c2VybmFtZVwiOlwidmlzaXRvclwifSIsImp0aSI6IjUzYmE0MmZkLTNmN2ItNDJhYy04NTM2LTMwMzllZWExM2RmZSIsImV4cCI6MTc3NzY2OTIwMH0.aP-GObNZEMMlXwFXSqbQKBEDmCPbryo3C45cRRz4L1_zEpjkINdwpX6xPRIrGQcK74nFtX3a1vqLqrrYLf2g2FQvVmu7-i9f8arQhfOOaCY7hE8fapQxpWdK9L7YM5wR3JSC4Z_v978i8FpgKZchtn4f63d57ZauqvhusfVzP3zdXNBdA722_ukcOr3q_GJ0gBVwQgypOvvmj9YWFVsXJyuB_Rda3PjNua74wjQog7td_CYHw5olxCCV-NE2GOeT7mV-q88ixZIOwv7oPqVBYzlPpNR5dNmG5FSOre0ZdBBQDpPKryH38US0B_BTXVyPkESaE0WvWVvMJ-lk4qQbYw",
    uid: "19de8146902528c0007220f",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOiIxOWRlODE0NjkwMjUyOGMwMDA3MjIwZiIsIlBsYXRmb3JtSUQiOjUsImV4cCI6MTc4NTQ5MTE1NywiaWF0IjoxNzc3NzE1MTUyfQ.rN18KyaHTnOBS8yFmCXEYASKva85qHOIJb-iZ-m0X-s",
    roomId: "14454688",
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    virtualNo: "", seed: "", connectionId: ""
};

const SOHBETO_TAB_ID = (() => {
    try {
        let id = sessionStorage.getItem('sohbeto_tab_id_v1');
        if (!id) {
            const rand = Math.random().toString(36).slice(2, 8);
            id = 'tab_' + Date.now().toString(36) + '_' + rand;
            sessionStorage.setItem('sohbeto_tab_id_v1', id);
        }
        window.__SOHBETO_TAB_ID__ = id;
        return id;
    } catch (e) {
        window.__SOHBETO_TAB_ID__ = 'shared';
        return 'shared';
    }
})();
// Kimlik/rehber/mesaj verisi sekmeye bağlı olamaz. PWA veya tarayıcı tamamen
// kapanıp açıldığında sessionStorage değişir; DB sekme adına bağlı kalırsa kişi
// yeniden çevrimiçi algılanmaz. Bu yüzden ana Sohbeto kasası daima sabittir.
const SOHBETO_DB_NAME = 'EgaNetwork';
function tabScopedKey(key) { return key; }

let wsChat = null, wsCount = null, ozelSayac = 0;
const state = {
    target: "HERKES", users: new Map(), currentConvTab: "genel", currentView: "sohbetler",
    chatMode: "list", activeChat: null, outboundQueue: new Map(), sentMsgs: new Map(),
    nick: "", bio: "", profileEmoji: "👤", profileImage: null,
    conversations: new Map(), memories: [], peerProfiles: {}, incomingCallFrom: null, incomingCallType: "audio"
};
const peers = {};
let localAudioStream = null;
let touchStartX = 0, touchStartY = 0, isSwiping = false;

const AVATAR_EMOJIS = ['😎','🤖','🐱','🦊','🐶','🦁','🐸','🦄','🐼','🦋','🌟','🔥','💎','🎮','🎵','⚡','🌙','🍀','🎯','🚀','🛡️','👑','🎭','🧩'];

// ==================== SHA-256 ====================
async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== ROTATING PASSWORD ====================
async function computeRotatingPassword(seed, timeMs) {
    const timeBlock = Math.floor((timeMs || Date.now()) / 300000);
    const hash = await sha256(seed + '::' + timeBlock);
    const chars = 'abcdefghijkmnopqrstuvwxyz0123456789';
    let pw = '';
    for (let i = 0; i < 7; i++) { const byte = parseInt(hash.substring(i * 2, i * 2 + 2), 16); pw += chars[byte % chars.length]; }
    return pw;
}
function getTimeUntilNextRotation() { const now = Date.now(); return ((Math.floor(now / 300000) + 1) * 300000) - now; }
function formatCountdown(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }

// ==================== VIRTUAL NUMBER ====================
function generateVirtualNumber() {
    const prefix = Math.random() < 0.5 ? '90606' : '90619';
    return '+' + prefix + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}
async function generateSeed(nick, virtualNo) { return sha256('SohbetPro::' + nick + '::' + virtualNo + '::' + Date.now()); }

// ==================== DOUBLE LOCK GENERATOR ====================
function generateDoubleLock() {
    const len = parseInt(document.getElementById('lockLength').value) || 16;
    const clampedLen = Math.max(4, Math.min(64, len));
    const layer1 = generateRandomString(clampedLen, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    const layer2 = generateRandomString(clampedLen, '!@#$%^&*()_+-=[]{}|;:,.<>?');
    const combined = [];
    for (let i = 0; i < clampedLen; i++) {
        combined.push(layer1[i]);
        if (i % 2 === 0 && i < layer2.length) combined.push(layer2[i]);
    }
    const result = shuffleArray(combined).join('').substring(0, clampedLen);
    document.getElementById('lockOutput').innerText = result;
}
function generateRandomString(len, chars) {
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, v => chars[v % chars.length]).join('');
}
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function copyLock() {
    const text = document.getElementById('lockOutput').innerText;
    if (text && text !== '—') navigator.clipboard.writeText(text).then(() => log("Şifre kopyalandı", "#22c55e")).catch(() => {});
}

// ==================== IDENTITY (IndexedDB) ====================
function openNamedDB(dbName) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 3);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("identity")) db.createObjectStore("identity");
            if (!db.objectStoreNames.contains("messages")) {
                const store = db.createObjectStore("messages", { keyPath: "id", autoIncrement: true });
                store.createIndex("chatId", "chatId", { unique: false });
                store.createIndex("ts", "ts", { unique: false });
            }
            if (!db.objectStoreNames.contains("conversations")) {
                db.createObjectStore("conversations", { keyPath: "connId" });
            }
            if (!db.objectStoreNames.contains("contacts")) {
                // key = number (string). value = {number,name,connId,addedAt,lastSeen}
                db.createObjectStore("contacts", { keyPath: "number" });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e);
    });
}
const LEGACY_SOHBETO_DB_NAME = SOHBETO_TAB_ID === 'shared' ? '' : `EgaNetwork_${SOHBETO_TAB_ID}`;
let legacyMigrationPromise = null;
async function migrateLegacyTabDB(stableDb) {
    if (!LEGACY_SOHBETO_DB_NAME || LEGACY_SOHBETO_DB_NAME === SOHBETO_DB_NAME) return;
    const migrationKey = 'sohbeto_legacy_db_migrated_v1__' + LEGACY_SOHBETO_DB_NAME;
    try { if (localStorage.getItem(migrationKey)) return; } catch(e) {}
    try {
        const legacyDb = await openNamedDB(LEGACY_SOHBETO_DB_NAME);
        const copyIdentity = () => new Promise(r => {
            const tx = legacyDb.transaction('identity', 'readonly');
            const src = tx.objectStore('identity');
            const keysReq = src.getAllKeys(); const valsReq = src.getAll();
            tx.oncomplete = () => {
                const keys = keysReq.result || [], vals = valsReq.result || [];
                if (!keys.length) return r();
                const out = stableDb.transaction('identity', 'readwrite').objectStore('identity');
                keys.forEach((key, i) => { try { out.put(vals[i], key); } catch(e) {} });
                out.transaction.oncomplete = () => r();
                out.transaction.onerror = () => r();
            };
            tx.onerror = () => r();
        });
        const copyKeyedStore = (storeName) => new Promise(r => {
            if (!legacyDb.objectStoreNames.contains(storeName) || !stableDb.objectStoreNames.contains(storeName)) return r();
            const tx = legacyDb.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => {
                const rows = req.result || [];
                if (!rows.length) return r();
                const out = stableDb.transaction(storeName, 'readwrite').objectStore(storeName);
                rows.forEach(row => { try { out.put(row); } catch(e) {} });
                out.transaction.oncomplete = () => r();
                out.transaction.onerror = () => r();
            };
            req.onerror = () => r();
        });
        await copyIdentity();
        await copyKeyedStore('contacts');
        await copyKeyedStore('conversations');
        try { localStorage.setItem(migrationKey, '1'); } catch(e) {}
    } catch(e) {}
}
async function openDB() {
    const db = await openNamedDB(SOHBETO_DB_NAME);
    if (!legacyMigrationPromise) legacyMigrationPromise = migrateLegacyTabDB(db);
    await legacyMigrationPromise;
    return db;
}
async function dbGet(key) { const db = await openDB(); return new Promise(r => { const req = db.transaction("identity","readonly").objectStore("identity").get(key); req.onsuccess=()=>r(req.result||null); req.onerror=()=>r(null); }); }
async function dbPut(key, val) { const db = await openDB(); return new Promise(r => { const tx = db.transaction("identity","readwrite"); tx.objectStore("identity").put(val,key); tx.oncomplete=()=>r(); }); }

// Message persistence with hash-based IDs
async function hashMsg(data) { return sha256(data + '::' + Date.now()); }
async function dbSaveMessage(chatId, msgData) {
    try {
        const db = await openDB();
        const msgHash = await sha256(chatId + '::' + msgData.text + '::' + msgData.ts + '::' + (msgData.msgId||''));
        const record = { chatId, hash: msgHash, ts: msgData.ts, sender: msgData.sender, text: msgData.text, isOwn: msgData.isOwn, isP2P: msgData.isP2P, isPrivate: msgData.isPrivate, msgId: msgData.msgId || null, status: msgData.status || 'sent' };
        return new Promise(r => {
            const tx = db.transaction("messages", "readwrite");
            tx.objectStore("messages").add(record);
            tx.oncomplete = () => r();
            tx.onerror = () => r();
        });
    } catch (e) { return; }
}
async function dbLoadMessages(chatId, limit = 200) {
    try {
        const db = await openDB();
        return new Promise(r => {
            const tx = db.transaction("messages", "readonly");
            const idx = tx.objectStore("messages").index("chatId");
            const req = idx.getAll(chatId);
            req.onsuccess = () => { const arr = req.result || []; arr.sort((a,b)=>a.ts-b.ts); r(arr.slice(-limit)); };
            req.onerror = () => r([]);
        });
    } catch (e) { return []; }
}
async function dbSaveConversation(connId, conv) {
    try {
        const db = await openDB();
        return new Promise(r => {
            const tx = db.transaction("conversations", "readwrite");
            tx.objectStore("conversations").put({ connId, ...conv });
            tx.oncomplete = () => r();
            tx.onerror = () => r();
        });
    } catch (e) { return; }
}
async function dbLoadConversations() {
    try {
        const db = await openDB();
        return new Promise(r => {
            const tx = db.transaction("conversations", "readonly");
            const req = tx.objectStore("conversations").getAll();
            req.onsuccess = () => r(req.result || []);
            req.onerror = () => r([]);
        });
    } catch (e) { return []; }
}
async function dbClearMessages(chatId) {
    try {
        const db = await openDB();
        return new Promise(r => {
            const tx = db.transaction("messages", "readwrite");
            const idx = tx.objectStore("messages").index("chatId");
            const req = idx.openCursor(IDBKeyRange.only(chatId));
            req.onsuccess = (e) => { const c = e.target.result; if (c) { c.delete(); c.continue(); } };
            tx.oncomplete = () => r();
        });
    } catch (e) { return; }
}

// ==================== CONTACTS (rehber) ====================
const contactsState = { byNumber: new Map() };
function normalizeNumber(n) {
    let s = String(n || '').trim().replace(/[\s\-()]/g, '');
    if (!s) return '';
    s = s.replace(/^00/, '+').replace(/[^+\d]/g, '');
    let digits = s.replace(/^\+/, '');
    if (digits.startsWith('0') && digits.length === 11) digits = '90' + digits.substring(1);
    else if (digits.length === 10 && digits.startsWith('5')) digits = '90' + digits;
    else if (digits.startsWith('0090')) digits = digits.substring(2);
    return '+' + digits;
}
async function dbSaveContact(c) {
    try { const db = await openDB(); return new Promise(r => { const tx = db.transaction("contacts","readwrite"); tx.objectStore("contacts").put(c); tx.oncomplete=()=>r(); tx.onerror=()=>r(); }); } catch(e){}
}
async function dbDeleteContact(number) {
    try { const db = await openDB(); return new Promise(r => { const tx = db.transaction("contacts","readwrite"); tx.objectStore("contacts").delete(number); tx.oncomplete=()=>r(); tx.onerror=()=>r(); }); } catch(e){}
}
async function dbLoadContacts() {
    try { const db = await openDB(); return new Promise(r => { const tx = db.transaction("contacts","readonly"); const req = tx.objectStore("contacts").getAll(); req.onsuccess=()=>r(req.result||[]); req.onerror=()=>r([]); }); } catch(e){ return []; }
}
function getContactByConnId(connId) { for (const c of contactsState.byNumber.values()) if (c.connId === connId) return c; return null; }
function getContactByNumber(num) { return contactsState.byNumber.get(normalizeNumber(num)) || null; }
async function loadContactsToState() {
    const list = await dbLoadContacts();
    contactsState.byNumber.clear();
    list.forEach(c => contactsState.byNumber.set(c.number, c));
}
async function loadIdentity() {
    const no = await dbGet("virtualNo"), seed = await dbGet("seed"), nick = await dbGet("nick"),
          bio = await dbGet("bio"), emoji = await dbGet("profileEmoji"), img = await dbGet("profileImage"),
          firstDone = await dbGet("firstSessionDone"), mems = await dbGet("memories"), profiles = await dbGet("peerProfiles");
    if (no) CONFIG.virtualNo = no; if (seed) CONFIG.seed = seed; if (nick) state.nick = nick;
    if (bio) state.bio = bio; if (emoji) state.profileEmoji = emoji; if (img) state.profileImage = img;
    if (mems) state.memories = mems; if (profiles && typeof profiles === 'object') state.peerProfiles = profiles;
    return { hasNo: !!no, hasSeed: !!seed, firstDone: !!firstDone };
}
async function saveVirtualNo(num, seed) { CONFIG.virtualNo = num; CONFIG.seed = seed; await dbPut("virtualNo", num); await dbPut("seed", seed); }

// ==================== ENCODING ====================
const alphabet = "abcçdefgğhıijklmnoöprsştuüvyzxwqABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZXWQ0123456789";
const CHAR_MAP = { ' ': 0 }; const REV_MAP = { 0: ' ' };
alphabet.split('').forEach((c, i) => { CHAR_MAP[c] = i + 1; REV_MAP[i + 1] = c; });
const encodeTxt = (t) => t.split('').map(c => CHAR_MAP[c] !== undefined ? CHAR_MAP[c] : c).join('-');
const decodeTxt = (e) => e.split('-').map(n => REV_MAP[parseInt(n)] !== undefined ? REV_MAP[parseInt(n)] : n).join('') || e;
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(String(s || '')).replace(/`/g, '&#96;'); }
function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
}
function base64ToUtf8(b64) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}
function utf8ToBase64(text) { return bytesToBase64(new TextEncoder().encode(text)); }
function sanitizeProfileImage(src) {
    const value = String(src || '');
    return value.startsWith('data:image/') ? value : '';
}
function cleanProfileName(name) { return String(name || '').replace(/###/g, ' ').replace(/[\r\n]+/g, ' ').trim().substring(0, 40); }
function getPeerProfile(connId) { return (state.peerProfiles && state.peerProfiles[connId]) || null; }
function getStoredNumberFromNick(nick) { const m = String(nick || '').match(/\[(.*?)\]/); return m ? m[1] : ''; }
function nameWithKnownNumber(connId, name) {
    const num = getStoredNumberFromNick(state.users.get(connId));
    return num ? `${name} [${num}]` : name;
}
function getDisplayName(connId, fallbackNick) {
    const profile = getPeerProfile(connId);
    if (profile?.name) return nameWithKnownNumber(connId, profile.name);
    const contact = getContactByConnId(connId);
    const fromState = state.users.get(connId) || '';
    const cleanFallback = String(fallbackNick || '').replace(/^P2P$/i, '').trim();
    const cleanState = String(fromState || '').replace(/^P2P$/i, '').trim();
    if (contact?.name) return nameWithKnownNumber(connId, contact.name);
    if (cleanFallback) return cleanFallback;
    if (cleanState) return cleanState;
    if (contact?.number) return contact.number;
    return connId.substring(0, 10);
}
function getAvatarContent(connId, fallbackNick) {
    const profile = getPeerProfile(connId);
    if (profile?.image) return `<img src="${escapeAttr(profile.image)}" alt="Profil fotoğrafı">`;
    if (profile?.emoji) return `<span>${escapeHtml(profile.emoji)}</span>`;
    return `<span>${escapeHtml(getInitials(fallbackNick || getDisplayName(connId)).substring(0, 2))}</span>`;
}
function renderProfileAvatar(el, connId, baseClass, fallbackNick, spanStyle) {
    const displayName = getDisplayName(connId, fallbackNick);
    el.className = `${baseClass} ${getAvatarColor(displayName)}`;
    const profile = getPeerProfile(connId);
    if (profile?.image) el.innerHTML = `<img src="${escapeAttr(profile.image)}" alt="Profil fotoğrafı">`;
    else if (profile?.emoji) el.innerHTML = `<span${spanStyle ? ` style="${spanStyle}"` : ''}>${escapeHtml(profile.emoji)}</span>`;
    else el.innerHTML = `<span${spanStyle ? ` style="${spanStyle}"` : ''}>${escapeHtml(getInitials(displayName).substring(0, 2))}</span>`;
}
async function persistPeerProfiles() { try { await dbPut('peerProfiles', state.peerProfiles || {}); } catch(e) {} }
function decodeProfileUpdatePacket(packet) {
    try {
        const raw = packet.substring('PROFILE_UPDATE###'.length);
        const parsed = JSON.parse(base64ToUtf8(raw));
        return { name: cleanProfileName(parsed.name), emoji: String(parsed.emoji || '👤').substring(0, 4), image: sanitizeProfileImage(parsed.image), bio: String(parsed.bio || '').substring(0, 120) };
    } catch (e) {
        const parts = packet.split('###');
        return { name: cleanProfileName(parts[1]), emoji: String(parts[2] || '👤').substring(0, 4), image: sanitizeProfileImage(parts[3]), bio: '' };
    }
}
function applyPeerProfileUpdate(connId, profile) {
    if (!connId || !profile) return;
    if (!state.peerProfiles) state.peerProfiles = {};
    const normalized = { name: cleanProfileName(profile.name), emoji: profile.emoji || '👤', image: sanitizeProfileImage(profile.image), bio: profile.bio || '' };
    state.peerProfiles[connId] = normalized;
    if (normalized.name) state.users.set(connId, nameWithKnownNumber(connId, normalized.name));
    persistPeerProfiles();
    updateUI();
    refreshLiveScreensForPeer(connId);
}

// Aktif/incoming call ekranlarındaki avatar+isim, sohbet topbar'ı, kişi kartı ve info modalı
function refreshLiveScreensForPeer(connId) {
    try {
        const nick = getDisplayName(connId);
        const cleanName = nick.replace(/\[.*?\]/g, '').trim() || nick;
        // Active audio/video call
        if (typeof activeCallConnId !== 'undefined' && activeCallConnId === connId) {
            const aAv = document.getElementById('activeCallAvatar');
            const aNm = document.getElementById('activeCallName');
            if (aAv) renderProfileAvatar(aAv, connId, 'active-call-avatar', nick, 'font-size:44px');
            if (aNm) aNm.innerText = cleanName;
        }
        // Incoming call
        if (state.incomingCallFrom === connId) {
            const cAv = document.getElementById('callAvatar');
            const cNm = document.getElementById('callName');
            if (cAv) renderProfileAvatar(cAv, connId, 'call-avatar', nick);
            if (cNm) cNm.innerText = cleanName;
        }
        // Open chat topbar
        if (state.chatMode === 'chat' && state.activeChat === connId) {
            const tb = document.getElementById('topbarTitle'); if (tb) tb.innerText = cleanName;
            const tbAv = document.getElementById('topbarAvatar');
            if (tbAv && !tbAv.classList.contains('hidden')) renderProfileAvatar(tbAv, connId, 'topbar-avatar', nick);
        }
        // Contact card overlay
        if (cardTargetConnId === connId) {
            const cardAv = document.getElementById('cardAvatar');
            if (cardAv) renderProfileAvatar(cardAv, connId, 'contact-card-avatar', nick);
            const cn = document.getElementById('cardName'); if (cn) cn.innerText = cleanName;
        }
    } catch(e) {}
}
function createProfileUpdatePacket(includeImage = true) {
    // Adapter notu: 'Kullanıcı' lekesi olmasın diye boş gönderiyoruz; alıcı tarafta resolveDisplayName numara/rehber adına düşer.
    var __rawNick = cleanProfileName(state.nick);
    if (__rawNick === 'Kullanıcı') __rawNick = '';
    const payload = { name: __rawNick, emoji: state.profileEmoji || '👤', image: includeImage ? sanitizeProfileImage(state.profileImage) : '', bio: state.bio || '' };
    return 'PROFILE_UPDATE###' + utf8ToBase64(JSON.stringify(payload));
}
function sendDataChannelText(targetConnId, text) {
    const peer = peers[targetConnId];
    if (peer?.dc?.readyState !== 'open') return false;
    try { peer.dc.send(text); return true; } catch(e) { return false; }
}
function sendWhenP2PReady(targetConnId, text, label, attempts = 24) {
    if (!targetConnId || targetConnId === 'HERKES' || targetConnId === CONFIG.connectionId) return false;
    if (sendDataChannelText(targetConnId, text)) { if (label) log(`[P2P →] ${label}`, '#22c55e'); return true; }
    try { initP2P(targetConnId); } catch(e) {}
    let left = attempts;
    const timer = setInterval(() => {
        if (sendDataChannelText(targetConnId, text)) { clearInterval(timer); if (label) log(`[P2P →] ${label}`, '#22c55e'); }
        else if (--left <= 0) { clearInterval(timer); if (label) log(`[P2P BEKLEME] ${label} gönderilmedi; WSS kullanılmadı`, '#fbbf24'); }
    }, 250);
    return false;
}
function sendProfileUpdate(targetConnId) {
    if (!targetConnId || targetConnId === 'HERKES' || targetConnId === CONFIG.connectionId) return false;
    // Profil/isim bilgisi WSS'ye asla gitmez; P2P hazır değilse önce P2P kurulur, sonra gönderilir.
    return sendWhenP2PReady(targetConnId, createProfileUpdatePacket(true), 'Profil gönderildi');
}
function broadcastProfileUpdate() {
    const targets = new Set([...state.users.keys(), ...Object.keys(peers)]);
    targets.forEach(connId => sendProfileUpdate(connId));
}
let profileBroadcastTimer = null;
function scheduleProfileBroadcast(delay = 300) {
    if (profileBroadcastTimer) clearTimeout(profileBroadcastTimer);
    profileBroadcastTimer = setTimeout(() => { profileBroadcastTimer = null; broadcastProfileUpdate(); }, delay);
}
function resizeProfileImage(file, maxSize = 256, quality = 0.72) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => { img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        }; img.onerror = reject; img.src = reader.result; };
        reader.onerror = reject; reader.readAsDataURL(file);
    });
}

function getMyB64() { return btoa(encodeURIComponent(`P2P###${CONFIG.connectionId}###${CONFIG.virtualNo || ''}`)); }
function getTargetB64(connId) { if (connId === "HERKES") return "HERKES"; return btoa(encodeURIComponent(`P2P###${connId}`)); }

// ==================== AES-GCM + GZIP ENCRYPTION ====================
// Flow: Data > Gzip > AES-256-GCM > Base64  (SEC###iv_b64###ct_b64)
const _aesKeyCache = new Map();

async function deriveSharedKey(peerConnId) {
    if (_aesKeyCache.has(peerConnId)) return _aesKeyCache.get(peerConnId);
    const ids = [CONFIG.connectionId, peerConnId].sort();
    const sharedSecret = ids.join('::SohbetPro::');
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(sharedSecret), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new TextEncoder().encode('SohbetProAES256v1'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
    _aesKeyCache.set(peerConnId, key);
    return key;
}

async function gzipCompress(text) {
    try {
        if (typeof CompressionStream === 'undefined') return new TextEncoder().encode(text);
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        const reader = cs.readable.getReader();
        writer.write(new TextEncoder().encode(text));
        writer.close();
        const chunks = [];
        while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
        const totalLen = chunks.reduce((a, c) => a + c.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
        return result;
    } catch (e) { return new TextEncoder().encode(text); }
}

async function gzipDecompress(data) {
    try {
        if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(data);
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        writer.write(data);
        writer.close();
        const chunks = [];
        while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
        const totalLen = chunks.reduce((a, c) => a + c.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
        return new TextDecoder().decode(result);
    } catch (e) { return new TextDecoder().decode(data); }
}

async function secureEncode(plaintext, peerConnId) {
    // Data > Gzip > AES-GCM > Base64
    const compressed = await gzipCompress(plaintext);
    const key = await deriveSharedKey(peerConnId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, compressed);
    const ivB64 = btoa(String.fromCharCode(...iv));
    const encB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    return `SEC###${ivB64}###${encB64}`;
}

async function secureDecode(encoded, peerConnId) {
    // Base64 > AES-GCM > Gzip > Data
    if (!encoded.startsWith('SEC###')) return encoded;
    const parts = encoded.split('###');
    if (parts.length < 3) return encoded;
    try {
        const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
        const encData = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
        const key = await deriveSharedKey(peerConnId);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encData);
        return await gzipDecompress(new Uint8Array(decrypted));
    } catch (e) {
        log("Şifre çözme hatası", "#ef4444");
        return null;
    }
}

async function sendSecureP2PWhenReady(targetConnId, payload, label, onSent, attempts = 24) {
    if (!targetConnId || targetConnId === 'HERKES' || targetConnId === CONFIG.connectionId) return false;
    let busy = false;
    const trySend = async () => {
        if (busy) return false; busy = true;
        try {
            const peer = peers[targetConnId];
            if (peer?.dc?.readyState !== 'open') return false;
            peer.dc.send(await secureEncode(payload, targetConnId));
            if (label) log(`[P2P →] ${label}`, '#22c55e');
            if (onSent) onSent(true);
            return true;
        } catch(e) { return false; }
        finally { busy = false; }
    };
    if (await trySend()) return true;
    try { initP2P(targetConnId); } catch(e) {}
    let left = attempts;
    const timer = setInterval(async () => {
        if (await trySend()) clearInterval(timer);
        else if (--left <= 0) { clearInterval(timer); if (label) log(`[P2P BEKLEME] ${label} gönderilmedi; WSS kullanılmadı`, '#fbbf24'); if (onSent) onSent(false); }
    }, 250);
    return false;
}

// ==================== PACKET BUILDER ====================
function createMsgPacket(text, targetConnId) {
    const rawBody = `[${getMyB64()}] [${getTargetB64(targetConnId)}] ${text}`;
    let encBody;
    if (text.startsWith("[P2P_") || text.startsWith("NUMARA_TALEBI") || text.startsWith("NUMARA_CEVAP") ||
        text.startsWith("MSG###") || text.startsWith("MSG_ACK###") || text.startsWith("LOG_ISTEGI") ||
        text.startsWith("LOG_CEVAP") || text.startsWith("ADMIN_ONLINE") || text.startsWith("CALL_") ||
        text.startsWith("SEC###") || text.startsWith("PROFILE_UPDATE###") ||
        text.startsWith("LOOKUP###") || text.startsWith("LOOKUP_REPLY###") ||
        text.startsWith("VOICE_PART###") || text.startsWith("VOICE_END###") ||
        text === "GIRIS_YAPILDI" || text === "BURADAYIM") {
        encBody = "P2PRAW:" + rawBody;
    } else { encBody = encodeTxt(rawBody); }
    const jsonB = new TextEncoder().encode(JSON.stringify({ content: encBody }));
    const encodeVarint = (val) => { let res = []; while (val >= 0x80) { res.push((val & 0x7f) | 0x80); val >>>= 7; } res.push(val); return res; };
    const lenField = encodeVarint(jsonB.length);
    const baseB64 = "ChcxOWMzNzk5ZmQwYTUyOGMwMDA3ZDI1ZBoIMTQzNjYwMTYiIDkzZWIzMDU0OTFlNzdhODA4MDU3MTJhMWM3ZGYxMWI4MAU6CDE5YzM3OTlmSANQZFhlYhR7ImNvbnRlbnQiOiJBTktBUkEifYABqbni9MMziAEBogE0Chd5b3UgaGF2ZSBhIG5ldyBtZXNzYWdlLhIXeW91IGhhdmUgYSBuZXcgbWVzc2FnZS4oAQ==";
    let bytes = Uint8Array.from(atob(baseB64), c => c.charCodeAt(0));
    bytes.set(new TextEncoder().encode(CONFIG.uid), 2);
    bytes.set(new TextEncoder().encode(CONFIG.roomId), 2 + CONFIG.uid.length + 2);
    const jsonStart = Array.from(bytes).indexOf(123);
    const finalP = new Uint8Array(jsonStart + lenField.length + jsonB.length + 500);
    let cur = 0;
    finalP.set(bytes.slice(0, jsonStart - 1), cur); cur = jsonStart - 1;
    finalP.set(lenField, cur); cur += lenField.length;
    finalP.set(jsonB, cur); cur += jsonB.length;
    const trailer = bytes.slice(jsonStart + bytes[jsonStart - 1]);
    finalP.set(trailer, cur);
    return btoa(String.fromCharCode(...finalP.slice(0, cur + trailer.length)));
}

function wsSend(text, targetConnId) {
    if (!wsChat || wsChat.readyState !== 1) return false;
    if (targetConnId && targetConnId !== "HERKES") {
        // WSS artık sadece P2P kurulumu için: WebRTC sinyalleşmesi + numara lookup cevabı.
        // Profil, isim, mesaj, okundu bilgisi ve arama sinyali hiçbir koşulda WSS'ye gönderilmez.
        const allowedForSetupOnly = text.startsWith("[P2P_") || text.startsWith("LOOKUP_REPLY###");
        if (!allowedForSetupOnly) {
            log(`[WSS BLOCK] Özel bilgi WSS'ye gönderilmedi → ${targetConnId.substring(0,10)}`, "#fbbf24");
            return false;
        }
    }
    try { wsChat.send(new TextEncoder().encode(JSON.stringify({ reqIdentifier: 1003, sendID: CONFIG.uid, data: createMsgPacket(text, targetConnId) }))); return true; } catch (e) { return false; }
}

// ==================== LOG ====================
function log(m, c = "#38bdf8") {
    const lc = document.getElementById('logContainer'); if (!lc) return;
    // Truncate long encrypted payloads in logs
    let displayMsg = m;
    if (m.length > 120) displayMsg = m.substring(0, 80) + '... [kısaltıldı, ' + m.length + ' karakter]';
    const d = document.createElement('div'); d.style.color = c; d.style.padding = '2px 0'; d.style.borderBottom = '1px solid #1e293b';
    d.innerText = `[${new Date().toLocaleTimeString()}] ${displayMsg}`; lc.appendChild(d); lc.scrollTop = lc.scrollHeight;
    while (lc.children.length > 300) lc.removeChild(lc.firstChild);
}

// ==================== LOCALSTORAGE ====================
const LS_OUTBOX = tabScopedKey('sohbet_outbox_v5');
function saveOutbox() { try { localStorage.setItem(LS_OUTBOX, JSON.stringify(Array.from(state.outboundQueue.values()))); } catch (e) { } }
function loadOutbox() { try { const a = JSON.parse(localStorage.getItem(LS_OUTBOX) || '[]'); a.forEach(m => state.outboundQueue.set(m.msgId, m)); } catch (e) { } }
function newMsgId() { return 'M_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8); }

// ==================== NOTIFICATION ====================
function showNotif(html, duration) {
    document.getElementById('notifText').innerHTML = html;
    document.getElementById('notifTime').innerText = new Date().toLocaleTimeString();
    document.getElementById('topNotif').classList.remove('hidden');
    if (duration) setTimeout(hideNotif, duration);
}
function hideNotif() { document.getElementById('topNotif').classList.add('hidden'); }

// ==================== AVATAR PICKER ====================
function initAvatarGrid() {
    const grid = document.getElementById('avatarGrid'); grid.innerHTML = '';
    AVATAR_EMOJIS.forEach(emoji => {
        const d = document.createElement('div');
        d.className = 'avatar-option' + (state.profileEmoji === emoji ? ' selected' : '');
        d.innerText = emoji;
        d.onclick = async (e) => { state.profileEmoji = emoji; state.profileImage = null; await dbPut("profileEmoji", state.profileEmoji); await dbPut("profileImage", null); document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected')); e.target.classList.add('selected'); updateProfilePics(); scheduleProfileBroadcast(); };
        grid.appendChild(d);
    });
}
function toggleAvatarPicker() { document.getElementById('avatarPicker').classList.toggle('show'); }
function updateProfilePics() {
    const c1 = document.getElementById('welcomePicCircle'), c2 = document.getElementById('settingsPicCircle');
    if (!c1 || !c2) return;
    if (state.profileImage) { c1.innerHTML = `<img src="${escapeAttr(state.profileImage)}" alt="Profil fotoğrafı">`; c2.innerHTML = `<img src="${escapeAttr(state.profileImage)}" alt="Profil fotoğrafı">`; }
    else { c1.innerText = state.profileEmoji; c2.innerText = state.profileEmoji; }
}
document.getElementById('fileInput').onchange = async function(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
        state.profileImage = await resizeProfileImage(file);
        await dbPut("profileImage", state.profileImage);
        updateProfilePics();
        scheduleProfileBroadcast();
        log("Profil fotoğrafı P2P için hazırlandı", "#22c55e");
    } catch (err) { log("Profil fotoğrafı okunamadı", "#ef4444"); }
    e.target.value = '';
};

// ==================== MIC ====================
document.getElementById('btnMic').onclick = async function () {
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(t => t.stop()); localAudioStream = null;
        this.innerText = '🎤'; this.classList.remove('active'); log("Mikrofon kapalı", "#ef4444");
        if (state.activeChat && state.activeChat !== 'genel') sendCallSignal(state.activeChat, "CALL_END");
    } else {
        try {
            localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.innerText = '🎙️'; this.classList.add('active'); log("Mikrofon aktif", "#22c55e");
            if (state.activeChat && state.activeChat !== 'genel') sendCallSignal(state.activeChat, "CALL_RING");
        } catch (e) { log("Mikrofon izni yok!", "#ef4444"); }
    }
};

function playBeep(isPrivate) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = isPrivate ? "triangle" : "sine";
        osc.frequency.setValueAtTime(isPrivate ? 880 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime); osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12); osc.stop(ctx.currentTime + 0.12);
    } catch (e) { }
}

// ==================== CALL SCREEN ====================
function showIncomingCall(senderConnId, type = "audio") {
    state.incomingCallFrom = senderConnId;
    state.incomingCallType = type;
    const nick = getDisplayName(senderConnId);
    document.getElementById('callName').innerText = nick.replace(/\[.*?\]/g, '').trim() || nick;
    document.getElementById('callStatus').innerText = type === "video" ? 'Görüntülü arıyor...' : 'Seni Arıyor...';
    renderProfileAvatar(document.getElementById('callAvatar'), senderConnId, 'call-avatar', nick);
    document.getElementById('callScreen').classList.remove('hidden');
    playBeep(true);
    // GünesOS köprüsü: başka uygulamadayken de "arıyor" bildirimi düşsün.
    try {
        if (window.parent && window.parent !== window) {
            const cleanName = nick.replace(/\[.*?\]/g, '').trim() || nick;
            window.parent.postMessage({
                type: 'sohbeto:incoming-call',
                from: senderConnId,
                name: cleanName,
                callType: type
            }, '*');
        }
    } catch (e) {}
    // Cevapsız çağrıyı otomatik kapatmıyoruz: özellikle görüntülü aramada P2P/izin
    // hazırlığı uzayabiliyor. Çağrı yalnızca arayan kapatırsa, alıcı reddederse veya
    // taraflardan biri gerçekten bağlantıyı sonlandırırsa düşmeli.
}

async function acceptCall() {
    const callerConnId = state.incomingCallFrom;
    const callType = state.incomingCallType || "audio";
    const connectedAt = Date.now();
    document.getElementById('callScreen').classList.add('hidden'); state.incomingCallFrom = null; state.incomingCallType = "audio";
    if (callerConnId) {
        if (callType === "video") await startVideoCall(callerConnId, true, connectedAt);
        else await startAudioCall(callerConnId, true, connectedAt);
        sendCallSignal(callerConnId, `CALL_ACCEPT###${connectedAt}`);
        notifyParentCallState('sohbeto:call-accepted', { from: callerConnId, connectedAt });
    }
}

function rejectCall() {
    if (state.incomingCallFrom) { sendCallSignal(state.incomingCallFrom, "CALL_REJECT"); }
    document.getElementById('callScreen').classList.add('hidden'); state.incomingCallFrom = null; state.incomingCallType = "audio";
}

async function quickReply(msg) {
    if (state.incomingCallFrom) {
        const target = state.incomingCallFrom;
        const mid = newMsgId();
        const payload = `MSG###${mid}###${msg}`;
        renderOwnMsg(target, msg, mid, true);
        sendSecureP2PWhenReady(target, payload, 'Hızlı yanıt');
        // Aramayı reddet (CALL_REJECT sadece P2P üzerinden gider)
        sendCallSignal(target, "CALL_REJECT");
    }
    document.getElementById('callScreen').classList.add('hidden'); state.incomingCallFrom = null; state.incomingCallType = "audio";
}

// GüneşOS köprüsü: parent overlay'den gelen kabul/red komutları
try {
    window.addEventListener('message', function(ev){
        const d = ev && ev.data;
        if (!d || typeof d !== 'object') return;
        if (d.type === 'sohbeto:remote-accept') {
            try {
                if (d.from && state.incomingCallFrom && d.from !== state.incomingCallFrom) return;
                if (typeof acceptCall === 'function') acceptCall();
            } catch(e){}
        } else if (d.type === 'sohbeto:remote-reject') {
            try {
                if (d.from && state.incomingCallFrom && d.from !== state.incomingCallFrom) return;
                if (typeof rejectCall === 'function') rejectCall();
            } catch(e){}
        }
    });
} catch(e) {}

// ==================== WEBRTC P2P ====================
function setupAudioEl(connId, stream) {
    let el = document.getElementById('audio_' + connId);
    if (!el) { el = document.createElement('audio'); el.id = 'audio_' + connId; el.autoplay = true; el.playsInline = true; document.getElementById('audioContainer').appendChild(el); }
    el.srcObject = stream;
    const playPromise = el.play?.();
    if (playPromise?.catch) playPromise.catch(() => {});
}

function showRemoteVideo(connId, stream) {
    const remoteEl = document.getElementById('videoRemote');
    if (!remoteEl) return;
    let videoEl = remoteEl.querySelector('video');
    if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        remoteEl.innerHTML = '';
        remoteEl.appendChild(videoEl);
    }
    videoEl.srcObject = stream;
    const playPromise = videoEl.play?.();
    if (playPromise?.catch) playPromise.catch(() => {});
}

function attachRemoteStream(connId, stream) {
    if (!stream) return;
    setupAudioEl(connId, stream);
    if (stream.getVideoTracks().length) showRemoteVideo(connId, stream);
}

function attachDataChannel(connId, channel, label) {
    if (!peers[connId]) peers[connId] = { iceQueue: [] };
    peers[connId].dc = channel;
    channel.onopen = () => { log(`P2P aktif${label ? ' (' + label + ')' : ''}`, "#22c55e"); sendProfileUpdate(connId); updateUI(); };
    channel.onmessage = (e) => handleP2PMsg(connId, e.data);
    channel.onclose = () => updateUI();
}

function configurePeerConnection(connId, pc) {
    pc.ontrack = (e) => {
        const stream = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
        attachRemoteStream(connId, stream);
    };
    pc.onicecandidate = (e) => { if (e.candidate) sendSignaling(connId, "ICE", JSON.stringify(e.candidate)); };
    pc.onconnectionstatechange = () => {
        if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) updateUI();
    };
}

function addStreamTracksToPeer(connId, stream) {
    const pc = peers[connId]?.pc;
    if (!pc || !stream) return false;
    let changed = false;
    const senders = pc.getSenders();
    stream.getTracks().forEach(track => {
        const sameTrack = senders.some(s => s.track && s.track.id === track.id);
        if (sameTrack) return;
        const reusable = senders.find(s => s.track && s.track.kind === track.kind && s.track.readyState !== 'ended');
        if (reusable) {
            if (reusable.track.id !== track.id) { reusable.replaceTrack(track); changed = true; }
        } else {
            pc.addTrack(track, stream); changed = true;
        }
    });
    return changed;
}

function addLocalMediaTracks(connId) {
    let changed = false;
    if (localAudioStream) changed = addStreamTracksToPeer(connId, localAudioStream) || changed;
    if (localVideoStream) changed = addStreamTracksToPeer(connId, localVideoStream) || changed;
    return changed;
}

async function renegotiatePeer(connId) {
    const pc = peers[connId]?.pc;
    if (!pc || pc.signalingState !== 'stable') return;
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignaling(connId, "OFFER", JSON.stringify(offer));
    } catch (e) { log("P2P yenileme hatası: " + e.message, "#ef4444"); }
}

async function initP2P(targetConnId) {
    const existing = peers[targetConnId];
    if (existing?.pc && existing.pc.signalingState !== 'closed') {
        const changed = addLocalMediaTracks(targetConnId);
        if (existing.dc?.readyState === 'open') sendProfileUpdate(targetConnId);
        if (changed) await renegotiatePeer(targetConnId);
        return existing;
    }
    const existingQueue = existing?.iceQueue || [];
    const pc = new RTCPeerConnection({ iceServers: CONFIG.iceServers });
    peers[targetConnId] = { pc, dc: null, iceQueue: existingQueue };
    configurePeerConnection(targetConnId, pc);
    const dc = pc.createDataChannel("chat");
    attachDataChannel(targetConnId, dc, 'out');
    addLocalMediaTracks(targetConnId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignaling(targetConnId, "OFFER", JSON.stringify(offer));
    return peers[targetConnId];
}

async function handleP2PMsg(senderConnId, data) {
    if (typeof data !== 'string') return;
    if (data.startsWith("SEC###")) {
        const decrypted = await secureDecode(data, senderConnId);
        if (!decrypted) return;
        return handleP2PMsg(senderConnId, decrypted);
    }
    if (data.startsWith("MSG###")) {
        const [, mid, ...rest] = data.split("###"); const text = rest.join("###");
        renderIncomingMsg(senderConnId, CONFIG.connectionId, text, true, mid);
        const peer = peers[senderConnId];
        if (peer?.dc?.readyState === 'open') {
            peer.dc.send(`MSG_ACK###${mid}###DELIVERED`);
            if (state.chatMode === 'chat' && state.activeChat === senderConnId) setTimeout(() => peer.dc.send(`MSG_ACK###${mid}###READ`), 300);
        }
    } else if (data.startsWith("MSG_ACK###")) { const parts = data.split("###"); handleAck(parts[1], parts[2]); }
    else if (data.startsWith("PROFILE_UPDATE###")) {
        applyPeerProfileUpdate(senderConnId, decodeProfileUpdatePacket(data));
        log(`[P2P] Profil güncellendi: ${senderConnId.substring(0,8)}`, "#22d3ee");
    }
    else if (data.startsWith("CALL_")) { handleCallSignal(senderConnId, data, true); }
    else if (data.startsWith("VOICE_PART###") || data.startsWith("VOICE_END###")) { handleVoicePacket(senderConnId, data); }
    else { renderIncomingMsg(senderConnId, CONFIG.connectionId, data, true, null); }
}

// ==================== CALL SIGNALING (P2P Öncelikli) ====================
function sendCallSignal(targetConnId, text) {
    // Arama sinyalleri de profil gibi WSS'ye gitmez; gerekirse önce P2P açılır.
    return sendWhenP2PReady(targetConnId, text, text);
}

function notifyParentCallState(type, payload) {
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(Object.assign({ type }, payload || {}), '*');
        }
    } catch (e) {}
}

function handleCallSignal(senderConnId, text, viaP2P) {
    const sNick = getDisplayName(senderConnId);
    const via = viaP2P ? "P2P" : "WSS";
    if (text === "CALL_RING" || text === "CALL_RING_VIDEO") {
        const type = text === "CALL_RING_VIDEO" ? "video" : "audio";
        showIncomingCall(senderConnId, type);
        log(`${type === 'video' ? '📹' : '📞'} [${via}] ${sNick} arıyor`, "#6366f1");
        return;
    }
    if (text === "CALL_ACCEPT" || text.startsWith("CALL_ACCEPT###")) {
        const acceptedAt = Number(text.split("###")[1]) || Date.now();
        log(`✅ [${via}] ${sNick} aramayı kabul etti`, "#22c55e");
        // Tek kaynak status: tema/adapter'ler #activeCallStatus'u izleyebilsin diye
        // sesli/görüntülü ayrımı olmadan "Bağlandı" yazıyoruz.
        const acsEl = document.getElementById('activeCallStatus');
        if (acsEl) acsEl.innerText = 'Bağlandı';
        // Köprülerin (themes) tutunabilmesi için global ipucu
        try { window.__SOHBETO_CALL_CONNECTED_AT = acceptedAt; } catch (e) {}
        notifyParentCallState('sohbeto:call-accepted', { from: senderConnId, connectedAt: acceptedAt });
        if (!document.getElementById('activeCallScreen').classList.contains('hidden')) {
            startCallTimer(acceptedAt);
            if (localAudioStream && peers[senderConnId]?.pc) {
                const changed = addStreamTracksToPeer(senderConnId, localAudioStream);
                if (changed) renegotiatePeer(senderConnId);
            }
        }
        if (document.getElementById('videoContainer').classList.contains('active')) {
            log(`📹 [${via}] Görüntülü arama bağlandı`, "#22c55e");
            startCallTimer(acceptedAt);
            addLocalMediaTracks(senderConnId);
            renegotiatePeer(senderConnId);
        }
        return;
    }
    if (text === "CALL_REJECT") {
        log(`❌ [${via}] ${sNick} aramayı reddetti`, "#ef4444");
        // Karşı taraf reddetti — bizde gelen arama overlay'i açıksa onu da temizle.
        if (state.incomingCallFrom) {
            document.getElementById('callScreen').classList.add('hidden');
            state.incomingCallFrom = null; state.incomingCallType = "audio";
            notifyParentCallState('sohbeto:incoming-call-cancelled', { from: senderConnId });
        }
        endActiveCall(true); endVideoCall(true);
        return;
    }
    if (text === "CALL_END") {
        log(`📵 [${via}] ${sNick} aramayı bitirdi`, "#fbbf24");
        // Karşı taraf bitirdi — bizdeki gelen arama overlay'i de düşmeli.
        if (state.incomingCallFrom) {
            document.getElementById('callScreen').classList.add('hidden');
            state.incomingCallFrom = null; state.incomingCallType = "audio";
            notifyParentCallState('sohbeto:incoming-call-cancelled', { from: senderConnId });
        }
        endActiveCall(true); endVideoCall(true);
        return;
    }
}

async function handleSignaling(senderConnId, type, data) {
    let json; try { json = JSON.parse(data); } catch (e) { return; }
    if (type === "OFFER") {
        const existing = peers[senderConnId];
        const pc = existing?.pc && existing.pc.signalingState !== 'closed' ? existing.pc : new RTCPeerConnection({ iceServers: CONFIG.iceServers });
        const existingQueue = existing?.iceQueue || [];
        peers[senderConnId] = { pc, dc: existing?.dc || null, iceQueue: existingQueue };
        configurePeerConnection(senderConnId, pc);
        pc.ondatachannel = (e) => attachDataChannel(senderConnId, e.channel, 'in');
        addLocalMediaTracks(senderConnId);
        await pc.setRemoteDescription(new RTCSessionDescription(json));
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
        sendSignaling(senderConnId, "ANSWER", JSON.stringify(answer));
        if (peers[senderConnId].iceQueue) { peers[senderConnId].iceQueue.forEach(ice => pc.addIceCandidate(new RTCIceCandidate(ice)).catch(() => {})); peers[senderConnId].iceQueue = []; }
        if (peers[senderConnId].dc?.readyState === 'open') sendProfileUpdate(senderConnId);
    } else if (type === "ANSWER") {
        const pc = peers[senderConnId]?.pc;
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(json));
            if (peers[senderConnId].iceQueue) { peers[senderConnId].iceQueue.forEach(ice => pc.addIceCandidate(new RTCIceCandidate(ice)).catch(() => {})); peers[senderConnId].iceQueue = []; }
            sendProfileUpdate(senderConnId);
        }
    } else if (type === "ICE") {
        if (!peers[senderConnId]) peers[senderConnId] = { iceQueue: [] };
        if (peers[senderConnId].pc?.remoteDescription) peers[senderConnId].pc.addIceCandidate(new RTCIceCandidate(json)).catch(() => {});
        else { if (!peers[senderConnId].iceQueue) peers[senderConnId].iceQueue = []; peers[senderConnId].iceQueue.push(json); }
    }
}
function sendSignaling(targetConnId, type, data) { wsSend(`[P2P_${type}]${btoa(encodeURIComponent(data))}`, targetConnId); }

// ==================== CONNECTION ====================
function connectCountServer(onReady) {
    let pingInt = null, statInt = null;
    function open() {
        wsCount = new WebSocket(CONFIG.countHost);
        wsCount.onopen = () => {
            if (pingInt) clearInterval(pingInt); if (statInt) clearInterval(statInt);
            pingInt = setInterval(() => { try { if (wsCount.readyState === 1) wsCount.send("ping"); } catch(e){} }, 15000);
            statInt = setInterval(() => { try { if (wsCount.readyState === 1) wsCount.send(JSON.stringify({ "sportId": 1, "matchId": 571632 })); } catch(e){} }, 10000);
        };
        wsCount.onmessage = (e) => {
            try { const j = JSON.parse(e.data);
                if (j.messageType === "connected") { CONFIG.connectionId = j.connectionId; log(`Ağ ID: ${CONFIG.connectionId}`, "#a855f7"); wsCount.send(JSON.stringify({ "sportId": 1, "matchId": 571632 })); if (onReady) { onReady(); onReady = null; } }
            } catch (ex) { }
        };
        wsCount.onclose = () => { setTimeout(open, 3000); };
        wsCount.onerror = () => { try { wsCount.close(); } catch(e){} };
    }
    open();
}

let chatPingInt = null;
let chatReconnectAttempts = 0;
function connectChat(onReady) {
    wsChat = new WebSocket(`${CONFIG.chatHost}?sendID=${CONFIG.uid}&token=${CONFIG.token}&platformID=5&operationID=${Date.now()}&sdkType=js`);
    wsChat.binaryType = "arraybuffer";
    wsChat.onopen = () => {
        log("Sunucuya bağlandı", "#22c55e"); updateTopbarStatus(true);
        chatReconnectAttempts = 0;
        wsChat.send(new TextEncoder().encode(JSON.stringify({ reqIdentifier: 1006, sendID: CONFIG.uid, data: btoa(String.fromCharCode(...[0x0A, CONFIG.uid.length, ...new TextEncoder().encode(CONFIG.uid)])) })));
        setTimeout(() => {
            // NOT: Genel duyuru (GIRIS_YAPILDI) artık gönderilmiyor.
            // WSS sadece P2P kurulumu (signaling + lookup) için kullanılıyor.
            document.getElementById('btnSend').disabled = false;
            if (chatPingInt) clearInterval(chatPingInt);
            chatPingInt = setInterval(() => { try { if (wsChat && wsChat.readyState === 1) wsChat.send('{"type":"ping"}'); } catch(e){} }, 9000);
            setTimeout(flushOutboundQueue, 1500);
            // Rehberdeki tüm kişiler için LOOKUP at (online olanları öğren)
            setTimeout(() => {
                contactsState.byNumber.forEach(c => { try { wsSend(`LOOKUP###${c.number}`, "HERKES"); } catch(e){} });
            }, 1200);
            if (onReady) onReady();
        }, 700);
    };
    wsChat.onclose = () => {
        updateTopbarStatus(false); log("Bağlantı kesildi - yeniden bağlanılıyor...", "#ef4444");
        if (chatPingInt) { clearInterval(chatPingInt); chatPingInt = null; }
        chatReconnectAttempts++;
        const delay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(chatReconnectAttempts, 8)));
        setTimeout(() => { try { connectChat(); } catch(e){} }, delay);
    };
    wsChat.onerror = () => updateTopbarStatus(false);
    wsChat.onmessage = async (e) => {
        if (typeof e.data === "string") return;
        try {
            const j = JSON.parse(new TextDecoder().decode(e.data));
            if (j.reqIdentifier !== 2001) return;
            const b = Uint8Array.from(atob(j.data), c => c.charCodeAt(0));
            const s = Array.from(b).indexOf(123);
            const rawJson = new TextDecoder().decode(b.slice(s, b.lastIndexOf(125) + 1));
            const msgJson = JSON.parse(rawJson);
            let dec = msgJson.content;
            if (dec.startsWith("P2PRAW:")) dec = dec.substring(7); else dec = decodeTxt(dec);
            const match = dec.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
            if (!match) return;
            const [_, senderB64, targetB64, text] = match;
            let sNick, sConnId, sVirtualNo = '';
            try { const decSender = decodeURIComponent(atob(senderB64)); [sNick, sConnId, sVirtualNo] = decSender.split("###"); } catch (er) { return; }
            if (sConnId === CONFIG.connectionId) return;
            let tConnId = "HERKES";
            if (targetB64 !== "HERKES") { try { const dt = decodeURIComponent(atob(targetB64)); tConnId = dt.split("###")[1]; } catch (er) { return; } }
            if (text.startsWith("[P2P_") && tConnId === CONFIG.connectionId) { if (!state.users.has(sConnId)) { state.users.set(sConnId, sVirtualNo || (String(sNick || '').replace(/^P2P$/i, '').trim()) || sConnId.substring(0, 10)); updateUI(); } const pType = text.substring(5, text.indexOf("]")); const pData = decodeURIComponent(atob(text.substring(text.indexOf("]") + 1))); handleSignaling(sConnId, pType, pData); return; }
            if (text.startsWith("ADMIN_ONLINE") || text.startsWith("NUMARA_TALEBI") || text.startsWith("LOG_ISTEGI") || text.startsWith("NUMARA_CEVAP###")) return;
            if (text.startsWith("LOG_CEVAP###")) { const parts = text.split("###"); if (parts.length >= 3) { try { log(`[Sunucu]: ${decodeURIComponent(atob(parts.slice(2).join("###")))}`, "#fbbf24"); } catch (er) {} } return; }

            if (text.startsWith("PROFILE_UPDATE###")) { log("[WSS BLOCK] WSS profil güncellemesi yok sayıldı", "#fbbf24"); return; }
            if (text.startsWith("CALL_")) { log("[WSS BLOCK] WSS arama sinyali yok sayıldı", "#fbbf24"); return; }

            // Encrypted WSS message: SEC###iv###ct
            if (text.startsWith("SEC###")) {
                if (tConnId !== "HERKES") { log("[WSS BLOCK] WSS özel mesaj yok sayıldı", "#fbbf24"); return; }
                const decrypted = await secureDecode(text, sConnId);
                if (!decrypted) return;
                // Re-process the decrypted payload as if it came via WSS
                if (decrypted.startsWith("MSG###")) {
                    const firstSep = decrypted.indexOf("###", 6); if (firstSep === -1) return;
                    const mid = decrypted.substring(6, firstSep); const body = decrypted.substring(firstSep + 3);
                    if (tConnId !== "HERKES" && tConnId !== CONFIG.connectionId) return;
                    renderIncomingMsg(sConnId, tConnId, body, false, mid);
                    wsSend(`MSG_ACK###${mid}###DELIVERED`, sConnId);
                    const isPrivate = tConnId !== "HERKES";
                    const sameOpen = (isPrivate && state.chatMode === 'chat' && state.activeChat === sConnId) || (!isPrivate && state.chatMode === 'chat' && state.activeChat === 'genel');
                    if (sameOpen) setTimeout(() => wsSend(`MSG_ACK###${mid}###READ`, sConnId), 400);
                }
                return;
            }

            if (text.startsWith("MSG_ACK###")) { log("[WSS BLOCK] WSS okundu bilgisi yok sayıldı", "#fbbf24"); return; }
            if (text.startsWith("MSG###")) {
                if (tConnId !== "HERKES") { log("[WSS BLOCK] WSS özel mesaj yok sayıldı", "#fbbf24"); return; }
                const firstSep = text.indexOf("###", 6); if (firstSep === -1) return;
                const mid = text.substring(6, firstSep); const body = text.substring(firstSep + 3);
                if (tConnId !== "HERKES" && tConnId !== CONFIG.connectionId) return;
                renderIncomingMsg(sConnId, tConnId, body, false, mid);
                wsSend(`MSG_ACK###${mid}###DELIVERED`, sConnId);
                const isPrivate = tConnId !== "HERKES";
                const sameOpen = (isPrivate && state.chatMode === 'chat' && state.activeChat === sConnId) || (!isPrivate && state.chatMode === 'chat' && state.activeChat === 'genel');
                if (sameOpen) setTimeout(() => wsSend(`MSG_ACK###${mid}###READ`, sConnId), 400);
                return;
            }
            if (text === "GIRIS_YAPILDI") { sendProfileUpdate(sConnId); return; } // legacy
            if (text === "BURADAYIM") { sendProfileUpdate(sConnId); return; }
            // LOOKUP: numarayla peer arama (broadcast)
            if (text.startsWith("LOOKUP###")) {
                const askedNum = text.substring(9);
                if (CONFIG.virtualNo && normalizeNumber(askedNum) === normalizeNumber(CONFIG.virtualNo)) {
                    wsSend(`LOOKUP_REPLY###${CONFIG.virtualNo}`, sConnId);
                }
                return;
            }
            if (text.startsWith("LOOKUP_REPLY###")) {
                const num = normalizeNumber(text.substring(15));
                handleLookupReply(num, sConnId);
                return;
            }
            if (tConnId !== "HERKES" && tConnId !== CONFIG.connectionId) return;
            renderIncomingMsg(sConnId, tConnId, text, false, null);
        } catch (ex) { }
    };
}

function updateTopbarStatus(online) {
    const s = document.getElementById('topbarStatus');
    if (online) { s.innerText = "● Çevrimiçi"; s.className = "topbar-status online"; }
    else { s.innerText = "● Çevrimdışı"; s.className = "topbar-status offline"; }
}

// ==================== MESSAGE RENDER ====================
function getChatIdForMsg(targetConnId, senderConnId, isOwn) {
    // Returns the conversation ID this message belongs to
    if (targetConnId === "HERKES") return "genel";
    if (isOwn) return targetConnId; // own private message belongs to the target's chat
    return senderConnId; // incoming private message belongs to sender's chat
}

function shouldRenderInActiveChat(chatId) {
    return state.chatMode === 'chat' && state.activeChat === chatId;
}

function appendMsgToDOM(div) {
    const container = document.getElementById('chatMessages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function buildOwnMsgEl(text, msgId, isP2P, timeStr, status) {
    const div = document.createElement('div'); div.className = 'msg msg-own'; div.dataset.msgId = msgId || '';
    const tag = isP2P ? '<span class="msg-tag tag-p2p">P2P</span>' : '<span class="msg-tag tag-wss">WSS</span>';
    let tickHtml = '<span class="tick gray" data-tick="sent">✓</span>';
    if (status === 'delivered') tickHtml = '<span class="tick gray" data-tick="sent">✓</span>';
    else if (status === 'read') tickHtml = '<span class="tick blue" data-tick="sent">✓</span>';
    div.innerHTML = `<div class="msg-bubble"><div class="msg-meta" style="justify-content:flex-start;margin-bottom:2px"><span style="font-size:10px;opacity:.5">SEN${tag}</span></div><div>${escapeHtml(text)}</div><div class="msg-meta"><span class="msg-time">${timeStr}</span>${tickHtml}</div></div>`;
    return div;
}

function buildIncomingMsgEl(displaySender, text, isP2P, isPrivate, timeStr, msgId) {
    const div = document.createElement('div'); div.className = `msg ${isPrivate ? 'msg-private' : 'msg-other'}`;
    if (msgId) div.dataset.msgId = msgId;
    let tag = isP2P ? '<span class="msg-tag tag-p2p">P2P</span>' : (isPrivate ? '<span class="msg-tag tag-priv">ÖZEL</span>' : '<span class="msg-tag tag-wss">WSS</span>');
    div.innerHTML = `<div class="msg-bubble"><div class="msg-sender">${escapeHtml(displaySender)} ${tag}</div><div>${escapeHtml(text)}</div><div class="msg-meta"><span class="msg-time">${timeStr}</span></div></div>`;
    return div;
}

function renderOwnMsg(targetConnId, text, msgId, isP2P) {
    const isPrivate = (targetConnId !== "HERKES");
    const chatId = getChatIdForMsg(targetConnId, null, true);
    const ts = Date.now();
    const now = new Date(ts); const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const div = buildOwnMsgEl(text, msgId, isP2P, timeStr, 'sent');

    // Only render in DOM if this chat is currently active
    if (shouldRenderInActiveChat(chatId)) {
        appendMsgToDOM(div);
    }
    state.sentMsgs.set(msgId, { el: div, status: 'sent', chatId });

    // Persist to IndexedDB
    dbSaveMessage(chatId, { text, ts, sender: 'SEN', isOwn: true, isP2P, isPrivate, msgId, status: 'sent' });
    updateConversation(targetConnId, text, true, isPrivate);
}

function renderIncomingMsg(senderConnId, targetConnId, text, isP2P, msgId) {
    const isPrivate = (targetConnId !== "HERKES");
    const chatId = getChatIdForMsg(targetConnId, senderConnId, false);
    const ts = Date.now();
    const now = new Date(ts); const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const displaySender = getDisplayName(senderConnId);
    const div = buildIncomingMsgEl(displaySender, text, isP2P, isPrivate, timeStr, msgId);

    // Only render in DOM if this chat is currently active
    if (shouldRenderInActiveChat(chatId)) {
        appendMsgToDOM(div);
    }
    playBeep(isPrivate);

    // Persist to IndexedDB
    dbSaveMessage(chatId, { text, ts, sender: displaySender, isOwn: false, isP2P, isPrivate, msgId });

    if (isPrivate && !(state.chatMode === 'chat' && state.activeChat === senderConnId)) {
        ozelSayac++;
        const badge = document.getElementById('convOzelBadge'); badge.innerText = ozelSayac; badge.classList.remove('hidden');
        const navBadge = document.getElementById('navBadgeSohbet'); navBadge.innerText = ozelSayac; navBadge.classList.remove('hidden');
    }
    updateConversation(senderConnId, text, false, isPrivate);
    // GünesOS köprüsü: kullanıcı başka uygulamadayken (Kuran/Oyunlar vb.) bildirim alabilsin.
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'sohbeto:incoming-msg',
                from: senderConnId,
                name: displaySender.replace(/\[.*?\]/g, '').trim() || displaySender,
                text: String(text || '').slice(0, 240),
                isPrivate
            }, '*');
        }
    } catch (e) {}
}

// ==================== CONVERSATIONS ====================
function updateConversation(connId, lastMsg, isOwn, isPrivate) {
    const nick = getDisplayName(connId);
    const now = new Date(); const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const existing = state.conversations.get(connId);
    const isActiveChat = state.chatMode === 'chat' && state.activeChat === connId;
    const newUnread = isOwn || isActiveChat ? (existing?.unread || 0) : (existing?.unread || 0) + 1;
    const conv = { nick, lastMsg: isOwn ? `Sen: ${lastMsg}` : lastMsg, time: timeStr, unread: newUnread, isPrivate, ts: Date.now() };
    state.conversations.set(connId, conv);
    if (isPrivate) dbSaveConversation(connId, conv);
    renderConvList();
}

function renderConvList() {
    const genelList = document.getElementById('convListGenel'), ozelList = document.getElementById('convListOzel');
    genelList.innerHTML = ''; ozelList.innerHTML = '';
    // Genel Sohbet artık varsayılan olarak gösterilmiyor.
    let ozelCount = 0;
    state.conversations.forEach((conv, connId) => {
        if (!conv.isPrivate) return; ozelCount++;
        const displayNick = getDisplayName(connId, conv.nick);
        const d = document.createElement('div'); d.className = 'conv-item';
        d.innerHTML = `<div class="conv-avatar ${getAvatarColor(displayNick)}" data-card-trigger="1" style="cursor:pointer">${getAvatarContent(connId, displayNick)}</div><div class="conv-info"><div class="conv-name">${escapeHtml(displayNick)}</div><div class="conv-preview">${escapeHtml(conv.lastMsg)}</div></div><div class="conv-meta"><div class="conv-time">${conv.time}</div>${conv.unread > 0 ? `<div class="conv-unread">${conv.unread}</div>` : ''}</div>`;
        const avEl = d.querySelector('.conv-avatar');
        if (avEl) avEl.addEventListener('click', (ev) => { ev.stopPropagation(); showContactCard(connId); });
        d.onclick = () => openChat(connId); ozelList.appendChild(d);
    });
    if (ozelCount === 0) ozelList.innerHTML = '<div class="conv-empty">Henüz özel sohbet yok<br>Kişilerden birini seçerek başlayın</div>';
}

function getAvatarColor(name) { let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); return 'avatar-c' + (Math.abs(hash) % 8); }
function getInitials(name) { const clean = name.replace(/\[.*?\]/g, '').trim(); const parts = clean.split(/\s+/); if (parts.length >= 2 && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase(); return clean.substring(0, 2).toUpperCase(); }

// ==================== SWIPE NAVIGATION ====================
async function openChat(id) {
    state.chatMode = 'chat'; state.activeChat = id; state.target = id === 'genel' ? 'HERKES' : id;
    const displayNick = id === 'genel' ? 'Genel Sohbet' : getDisplayName(id);
    const cleanName = displayNick.replace(/\[.*?\]/g, '').trim() || displayNick;
    document.getElementById('topbarTitle').innerText = cleanName;
    const btnMic = document.getElementById('btnMic');
    if (id !== 'genel') { btnMic.classList.remove('hidden'); initP2P(id); } else { btnMic.classList.add('hidden'); }

    // Tam ekran sohbet modu: alt nav gizle, üst bar'a back+avatar+call butonları
    document.querySelector('.app-container').classList.add('chat-mode');
    document.querySelector('.app-container').classList.remove('list-mode');
    document.getElementById('topbarBack').classList.remove('hidden');
    if (id !== 'genel') {
        const avEl = document.getElementById('topbarAvatar');
        avEl.classList.remove('hidden');
        renderProfileAvatar(avEl, id, 'topbar-avatar', displayNick);
        document.getElementById('topbarVideoCall').classList.remove('hidden');
        document.getElementById('topbarAudioCall').classList.remove('hidden');
    } else {
        document.getElementById('topbarAvatar').classList.add('hidden');
        document.getElementById('topbarVideoCall').classList.add('hidden');
        document.getElementById('topbarAudioCall').classList.add('hidden');
    }

    // Mesajları yükle: kaydırma animasyonu olmadan, anında en altta göster
    const container = document.getElementById('chatMessages');
    const prevBehavior = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    container.innerHTML = '';
    const msgs = await dbLoadMessages(id, 200);
    if (msgs.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#5a6a7e;font-size:12px;line-height:1.5">💬 Henüz mesaj yok<br><span style="font-size:10px">İlk mesajı siz gönderin</span></div>';
    } else {
        const frag = document.createDocumentFragment();
        msgs.forEach(m => {
            const d = new Date(m.ts);
            const timeStr = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
            let el;
            if (m.isOwn) {
                el = buildOwnMsgEl(m.text, m.msgId, m.isP2P, timeStr, m.status || 'sent');
                if (m.msgId) {
                    const existing = state.sentMsgs.get(m.msgId);
                    if (existing) { existing.el = el; } else { state.sentMsgs.set(m.msgId, { el, status: m.status || 'sent', chatId: id }); }
                }
            } else {
                el = buildIncomingMsgEl(m.sender || 'Bilinmiyor', m.text, m.isP2P, m.isPrivate, timeStr, m.msgId);
            }
            // Mesajlara giriş animasyonunu kapat
            el.style.animation = 'none';
            frag.appendChild(el);
        });
        container.appendChild(frag);
        // Force reflow ve anında en alta in
        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; container.style.scrollBehavior = prevBehavior || ''; });
    }

    if (id !== 'genel') { const conv = state.conversations.get(id); if (conv) { conv.unread = 0; renderConvList(); dbSaveConversation(id, conv); } switchConvTab('ozel'); }
    document.getElementById('pageConvList').className = 'swipe-page left';
    document.getElementById('pageChat').className = 'swipe-page center';
}

function backToList() {
    state.chatMode = 'list'; state.activeChat = null;
    document.getElementById('topbarTitle').innerText = 'Sohbeto';
    document.querySelector('.app-container').classList.remove('chat-mode');
    document.querySelector('.app-container').classList.add('list-mode');
    document.getElementById('topbarBack').classList.add('hidden');
    document.getElementById('topbarAvatar').classList.add('hidden');
    document.getElementById('topbarVideoCall').classList.add('hidden');
    document.getElementById('topbarAudioCall').classList.add('hidden');
    document.getElementById('pageConvList').className = 'swipe-page center';
    document.getElementById('pageChat').className = 'swipe-page right';
    renderConvList();
}

// Topbar'daki avatar/buton handlerları
function openTopbarContactCard() { if (state.activeChat && state.activeChat !== 'genel') showContactCard(state.activeChat); }
function topbarStartAudioCall() { if (state.activeChat && state.activeChat !== 'genel') startAudioCall(state.activeChat, false); }
function topbarStartVideoCall() { if (state.activeChat && state.activeChat !== 'genel') startVideoCall(state.activeChat, false); }

// Touch swipe (sohbet listesi içinde geri dönmek için)
const swipeContainer = document.getElementById('swipeContainer');
swipeContainer.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; isSwiping = false; }, { passive: true });
swipeContainer.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) isSwiping = true;
}, { passive: true });
swipeContainer.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (state.chatMode === 'chat' && dx > 80) backToList();
}, { passive: true });

// ==================== VIEW SWIPE (Sohbetler ↔ Kişiler ↔ Gruplar) ====================
const VIEW_ORDER = ['sohbetler', 'kisiler', 'gruplar'];
let viewTouchStartX = 0, viewTouchStartY = 0, viewIsSwiping = false;
const screenChatEl = document.getElementById('screenChat');
if (screenChatEl) {
    screenChatEl.addEventListener('touchstart', (e) => {
        viewTouchStartX = e.touches[0].clientX; viewTouchStartY = e.touches[0].clientY; viewIsSwiping = false;
    }, { passive: true });
    screenChatEl.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - viewTouchStartX, dy = e.touches[0].clientY - viewTouchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) viewIsSwiping = true;
    }, { passive: true });
    screenChatEl.addEventListener('touchend', (e) => {
        if (!viewIsSwiping) return;
        // Sohbet açıkken yatay kaydırma sadece geri dönmek için (yukarıda hallediliyor)
        if (state.chatMode === 'chat') return;
        const dx = e.changedTouches[0].clientX - viewTouchStartX;
        if (Math.abs(dx) < 60) return;
        const idx = VIEW_ORDER.indexOf(state.currentView);
        if (idx < 0) return;
        if (dx < 0 && idx < VIEW_ORDER.length - 1) switchView(VIEW_ORDER[idx + 1]);
        else if (dx > 0 && idx > 0) switchView(VIEW_ORDER[idx - 1]);
    }, { passive: true });
}

// ==================== SEND ====================
async function sendCurrentMessage() {
    const inp = document.getElementById('chatInput'); const text = inp.value.trim(); if (!text) return;
    const msgId = newMsgId(); const target = state.target;
    const peer = peers[target];
    if (target !== "HERKES") {
        // Özel mesajlar WSS'ye asla düşmez: P2P açıksa hemen gönder, değilse P2P kurulunca gönder.
        const payload = `MSG###${msgId}###${text}`;
        state.outboundQueue.set(msgId, { msgId, targetConnId: target, text, ts: Date.now(), attempts: 0, p2pOnly: true });
        saveOutbox();
        renderOwnMsg(target, text, msgId, true);
        sendSecureP2PWhenReady(target, payload, 'Mesaj', (sent) => {
            const queued = state.outboundQueue.get(msgId);
            if (queued && sent) { queued.attempts = (queued.attempts || 0) + 1; saveOutbox(); }
        });
    } else {
        // Genel sohbet kaldırıldı ama geriye uyumluluk için açık kanal davranışı korunur.
        if (!wsChat || wsChat.readyState !== 1) { state.outboundQueue.set(msgId, { msgId, targetConnId: target, text, ts: Date.now(), attempts: 0 }); saveOutbox(); renderOwnMsg(target, text, msgId, false); log(`Mesaj kuyrukta`, "#f59e0b"); }
        else { wsSend(`MSG###${msgId}###${text}`, target); state.outboundQueue.set(msgId, { msgId, targetConnId: target, text, ts: Date.now(), attempts: 1 }); saveOutbox(); renderOwnMsg(target, text, msgId, false); }
    }
    inp.value = ''; inp.style.height = 'auto';
}
async function flushOutboundQueue() {
    for (const [msgId, m] of state.outboundQueue) {
        if (m.targetConnId !== "HERKES") {
            const payload = `MSG###${m.msgId}###${m.text}`;
            sendSecureP2PWhenReady(m.targetConnId, payload, 'Kuyruktaki mesaj', (sent) => {
                if (sent) { m.attempts = (m.attempts || 0) + 1; saveOutbox(); }
            });
        } else {
            if (!wsChat || wsChat.readyState !== 1) continue;
            wsSend(`MSG###${m.msgId}###${m.text}`, m.targetConnId);
            m.attempts = (m.attempts || 0) + 1;
        }
    }
    saveOutbox();
}

// ==================== ACK ====================
function handleAck(msgId, status) {
    const entry = state.sentMsgs.get(msgId); if (!entry) return;
    const tickEl = entry.el.querySelector('[data-tick]'); if (!tickEl) return;
    if (status === 'DELIVERED' && entry.status !== 'read') { tickEl.innerHTML = '✓'; tickEl.className = 'tick gray'; entry.status = 'delivered'; if (state.outboundQueue.has(msgId)) { state.outboundQueue.delete(msgId); saveOutbox(); } }
    else if (status === 'READ') { tickEl.innerHTML = '✓'; tickEl.className = 'tick blue'; entry.status = 'read'; if (state.outboundQueue.has(msgId)) { state.outboundQueue.delete(msgId); saveOutbox(); } }
}

// ==================== UI NAVIGATION ====================
function switchScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }

function switchView(view) {
    state.currentView = view;
    document.getElementById('viewSohbetler').classList.toggle('hidden', view !== 'sohbetler');
    document.getElementById('viewKisiler').classList.toggle('hidden', view !== 'kisiler');
    document.getElementById('viewGruplar').classList.toggle('hidden', view !== 'gruplar');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    // List-mode topbar başlığı + (gerekiyorsa) chat-mode'dan çıkış
    const titleEl = document.getElementById('ltTitle');
    if (titleEl) titleEl.innerText = view === 'kisiler' ? 'Kişiler' : view === 'gruplar' ? 'Gruplar' : 'Sohbetler';
    document.querySelector('.app-container')?.classList.add('list-mode');
    if (view === 'kisiler') updateContactList();
    if (view === 'sohbetler') { backToList(); renderStoriesRow(); }
}

function listTopbarAdd() {
    const v = state.currentView;
    if (v === 'kisiler') document.getElementById('addContactModal')?.classList.remove('hidden');
    else if (v === 'gruplar') showNotif('Grup oluşturma yakında aktif.', 3000);
    else showNotif('Yeni sohbet yakında.', 2500);
}
function toggleListMenu(ev) {
    ev?.stopPropagation();
    const dd = document.getElementById('menuDropdown');
    if (!dd) return;
    dd.classList.toggle('hidden');
    dd.style.position = 'fixed'; dd.style.top = '60px'; dd.style.left = '12px'; dd.style.right = 'auto';
}

function renderStoriesRow() {
    const row = document.getElementById('storiesRow'); if (!row) return;
    const contacts = Array.from(contactsState.byNumber.values()).slice(0, 6);
    let html = '<div class="story" onclick="showNotif(\'Hikaye yakında aktif.\',2500)">' +
        '<div class="story-av" style="background:linear-gradient(135deg,#1e1b4b,#312e81)"><div class="add-plus">+</div></div>' +
        '<div class="story-name">Hikayem</div></div>';
    contacts.forEach(c => {
        const name = c.name || c.number;
        const init = (name || '?').trim().charAt(0).toUpperCase();
        html += `<div class="story" onclick="openContactByNumber('${c.number}')">
            <div class="story-av">${init}</div>
            <div class="story-name">${escapeHtml(name.split(' ')[0])}</div></div>`;
    });
    row.innerHTML = html;
}

function switchConvTab(t) {
    // Tek liste modu: GENEL ve ÖZEL aynı sayfada gösteriliyor, sadece state ve badge sıfırlama korunur.
    state.currentConvTab = t || 'genel';
    document.getElementById('convListGenel').classList.remove('hidden');
    document.getElementById('convListOzel').classList.remove('hidden');
    const ob = document.getElementById('convOzelBadge'); if (ob) ob.classList.add('hidden');
    const nb = document.getElementById('navBadgeSohbet'); if (nb) nb.classList.add('hidden');
    ozelSayac = 0;
}

function enterChatScreen() { document.getElementById('topbarTitle').innerText = 'Sohbeto'; switchScreen('screenChat'); switchView('sohbetler'); updateUI(); }
function updateUI() { updateContactList(); renderConvList(); }

function updateContactList(filter) {
    const list = document.getElementById('contactList'); if (!list) return; list.innerHTML = '';
    const searchVal = (filter || document.getElementById('contactSearch')?.value || '').toLowerCase().trim();
    const countEl = document.getElementById('contactCount');
    let matchCount = 0;
    const contacts = Array.from(contactsState.byNumber.values());
    contacts.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    let lastLetter = '';
    const lettersPresent = new Set();
    contacts.forEach(c => {
        const number = c.number;
        const name = c.name || number;
        const cleanName = name.toLowerCase();
        if (searchVal && !cleanName.includes(searchVal) && !number.toLowerCase().includes(searchVal)) return;
        matchCount++;
        const letter = (name || '?').trim().charAt(0).toLocaleUpperCase('tr');
        if (letter !== lastLetter) {
            const h = document.createElement('div');
            h.className = 'contact-letter'; h.id = 'cl-' + letter; h.innerText = letter;
            list.appendChild(h); lastLetter = letter; lettersPresent.add(letter);
        }
        const connId = c.connId || null;
        const isConnected = connId && peers[connId]?.dc?.readyState === "open";
        const isOnline = !!connId && state.users.has(connId);
        const onlineClass = (isConnected || isOnline) ? '' : 'off';
        const statusText = (isConnected || isOnline) ? 'Çevrimiçi' : 'Çevrimdışı';
        const d = document.createElement('div'); d.className = 'contact-item';
        d.innerHTML = `<div class="contact-avatar ${getAvatarColor(name)}">${connId ? getAvatarContent(connId, name) : `<span>${escapeHtml(getInitials(name).substring(0,2))}</span>`}</div><div class="contact-info"><div class="contact-name">${escapeHtml(name)}</div><div class="contact-status ${onlineClass}"><span class="dot"></span>${statusText}</div></div>`;
        const avatarEl = d.querySelector('.contact-avatar');
        avatarEl.style.cursor = 'pointer';
        avatarEl.onclick = (e) => {
            e.stopPropagation();
            if (connId) showContactCard(connId);
            else openContactByNumber(number);
        };
        d.onclick = () => { openContactByNumber(number); };
        list.appendChild(d);
    });
    if (countEl) countEl.innerText = contacts.length;
    if (contacts.length === 0) list.innerHTML = '<div style="padding:40px;text-align:center;color:#a8b3c7;font-size:13px">Rehber boş<br><span style="font-size:11px">Sağ üstteki + ile kişi ekleyin</span></div>';
    else if (matchCount === 0 && searchVal) list.innerHTML = '<div style="padding:40px;text-align:center;color:#a8b3c7;font-size:13px">🔍 Sonuç bulunamadı</div>';
    // Alfabe çubuğu
    const ab = document.getElementById('alphaBar');
    if (ab) {
        const letters = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z','#'];
        ab.innerHTML = letters.map(l => {
            const has = lettersPresent.has(l);
            return `<span style="opacity:${has?1:.4}" onclick="document.getElementById('cl-${l}')?.scrollIntoView({behavior:'smooth',block:'start'})">${l}</span>`;
        }).join('');
    }
}

// Numara üzerinden kişiyi aç: connId bilinmiyorsa LOOKUP gönder, P2P kur, sohbeti aç
async function openContactByNumber(number) {
    const c = getContactByNumber(number); if (!c) return;
    if (c.connId && state.users.has(c.connId)) {
        switchView('sohbetler'); openChat(c.connId); return;
    }
    // Henüz connId yok ya da peer offline → LOOKUP yayımla
    log(`[LOOKUP] ${c.number} aranıyor...`, '#fbbf24');
    wsSend(`LOOKUP###${c.number}`, "HERKES");
    showNotif(`🔎 ${escapeHtml(c.name)} (${escapeHtml(c.number)}) çevrimiçi mi diye bakıyoruz...`, 4000);
    // 5 sn içinde reply gelirse handleLookupReply otomatik açar
    if (!window._pendingLookups) window._pendingLookups = new Map();
    window._pendingLookups.set(c.number, { ts: Date.now(), name: c.name });
    setTimeout(() => {
        if (window._pendingLookups?.has(c.number)) {
            window._pendingLookups.delete(c.number);
            showNotif(`⚪ ${escapeHtml(c.name)} şu an çevrimdışı.`, 4000);
        }
    }, 6000);
}

function handleLookupReply(number, connId) {
    const c = getContactByNumber(number); if (!c) return;
    c.connId = connId; c.lastSeen = Date.now();
    contactsState.byNumber.set(c.number, c);
    dbSaveContact(c);
    state.users.set(connId, `${c.name} [${c.number}]`);
    log(`[LOOKUP ✓] ${c.number} → ${connId.substring(0,10)}`, '#22c55e');
    if (window._pendingLookups?.has(number)) {
        window._pendingLookups.delete(number);
        switchView('sohbetler'); openChat(connId);
    }
    updateContactList();
}

// Add Contact modal handlers
async function saveNewContact() {
    const nameEl = document.getElementById('newContactName');
    const numEl = document.getElementById('newContactNumber');
    const errEl = document.getElementById('newContactError');
    const name = (nameEl.value || '').trim();
    const number = normalizeNumber(numEl.value);
    errEl.classList.add('hidden');
    if (!name) { errEl.innerText = 'İsim boş olamaz.'; errEl.classList.remove('hidden'); return; }
    if (!number || number.length < 8) { errEl.innerText = 'Geçerli numara girin.'; errEl.classList.remove('hidden'); return; }
    if (CONFIG.virtualNo && number === normalizeNumber(CONFIG.virtualNo)) { errEl.innerText = 'Kendi numaranızı ekleyemezsiniz.'; errEl.classList.remove('hidden'); return; }
    const existing = contactsState.byNumber.get(number);
    const c = { number, name, connId: existing?.connId || null, addedAt: existing?.addedAt || Date.now(), lastSeen: existing?.lastSeen || null };
    contactsState.byNumber.set(number, c);
    await dbSaveContact(c);
    nameEl.value = ''; numEl.value = '';
    document.getElementById('addContactModal').classList.add('hidden');
    log(`Kişi eklendi: ${name} (${number})`, '#22c55e');
    updateContactList();
    // Hemen LOOKUP at, online ise connId'yi öğren
    wsSend(`LOOKUP###${number}`, "HERKES");
}

document.getElementById('btnAddContact').onclick = () => {
    document.getElementById('newContactName').value = '';
    document.getElementById('newContactNumber').value = '';
    document.getElementById('newContactError').classList.add('hidden');
    document.getElementById('addContactModal').classList.remove('hidden');
};

// Contact search listener
document.getElementById('contactSearch')?.addEventListener('input', () => updateContactList());

// ==================== CONTACT PROFILE CARD ====================
let cardTargetConnId = null;

function toggleCardMoreMenu(e){ if(e) e.stopPropagation(); var m=document.getElementById('cardMoreMenu'); if(m) m.classList.toggle('hidden'); }
function closeCardMoreMenu(){ var m=document.getElementById('cardMoreMenu'); if(m) m.classList.add('hidden'); }
function cardAutoAdd(){
    closeCardMoreMenu();
    var connId = cardTargetConnId; if(!connId) return;
    var existing = getContactByConnId(connId);
    if (existing) { log('Bu kişi zaten rehberinizde: ' + (existing.name||existing.number), '#fbbf24'); return; }
    var nick = getDisplayName(connId);
    var cleanName = nick.replace(/\[.*?\]/g,'').trim();
    var numPart = nick.match(/\[(.*?)\]/);
    var number = numPart ? numPart[1] : connId.substring(0,12);
    var contact = { number: number, name: cleanName || number, connId: connId, addedAt: Date.now() };
    contactsState.byNumber.set(number, contact);
    try { dbSaveContact(contact); } catch(e) {}
    log('Kişi otomatik eklendi: ' + contact.name, '#22c55e');
    updateUI();
}
function cardSendGroupInvite(){
    closeCardMoreMenu();
    var connId = cardTargetConnId; if(!connId) return;
    try {
        var payload = 'GROUP_INVITE###' + (state.virtualNo||'') + '###' + Date.now();
        if (typeof sendToPeer === 'function') sendToPeer(connId, payload);
        else if (wsChat && wsChat.readyState === 1) wsChat.send('TO###' + connId + '###' + btoa(unescape(encodeURIComponent(payload))));
        log('Grup daveti gönderildi', '#6366f1');
    } catch(e){ log('Grup daveti gönderilemedi: '+e.message, '#f87171'); }
}

// ==================== VOICE MESSAGES (P2P) ====================
// Sesli mesaj: opus/webm base64 chunk halinde (P2P data channel) iletilir.
// Paket formatı:
//   VOICE_PART###vid###index###total###mime###durSec###base64chunk
//   VOICE_END###vid
// Adapter (sohbeto-adapter.js) MediaRecorder ile kayıt yapıp sendVoiceMessage()
// çağırır; alıcıda parçalar birleştirilip Blob URL ile <audio> bubble'ı render edilir.
const _voiceRx = new Map(); // vid -> { parts:[], total, mime, dur, count }
const VOICE_CHUNK = 8000;   // base64 karakter cinsinden ~6 KB parça

function buildVoiceMsgEl(displaySender, blobUrl, durSec, isOwn, isP2P, timeStr, msgId) {
    const div = document.createElement('div');
    div.className = 'msg ' + (isOwn ? 'msg-own' : 'msg-other');
    if (msgId) div.dataset.msgId = msgId;
    const tag = isP2P ? '<span class="msg-tag tag-p2p">P2P</span>' : '<span class="msg-tag tag-wss">WSS</span>';
    const head = isOwn
        ? `<div class="msg-meta" style="justify-content:flex-start;margin-bottom:2px"><span style="font-size:10px;opacity:.5">SEN${tag}</span></div>`
        : `<div class="msg-sender">${escapeHtml(displaySender)} ${tag}</div>`;
    const body = blobUrl
        ? `<audio controls preload="metadata" src="${blobUrl}" style="max-width:220px;height:34px;display:block"></audio>`
        : `<div style="opacity:.6;font-size:12px">🎤 Sesli mesaj (${durSec}s)</div>`;
    div.innerHTML = `<div class="msg-bubble">${head}${body}<div class="msg-meta"><span class="msg-time">${timeStr} · 🎤 ${durSec}s</span></div></div>`;
    return div;
}

function renderOwnVoice(targetConnId, blobUrl, durSec, msgId) {
    const isPrivate = (targetConnId !== "HERKES");
    const chatId = getChatIdForMsg(targetConnId, null, true);
    const ts = Date.now();
    const now = new Date(ts);
    const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const el = buildVoiceMsgEl('SEN', blobUrl, durSec, true, true, timeStr, msgId);
    if (shouldRenderInActiveChat(chatId)) appendMsgToDOM(el);
    state.sentMsgs.set(msgId, { el, status: 'sent', chatId });
    const previewText = `🎤 Sesli mesaj (${durSec}s)`;
    dbSaveMessage(chatId, { text: previewText, ts, sender: 'SEN', isOwn: true, isP2P: true, isPrivate, msgId, status: 'sent' });
    updateConversation(targetConnId, previewText, true, isPrivate);
}

function renderIncomingVoice(senderConnId, blobUrl, durSec) {
    const chatId = senderConnId;
    const ts = Date.now();
    const now = new Date(ts);
    const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const displaySender = getDisplayName(senderConnId);
    const el = buildVoiceMsgEl(displaySender, blobUrl, durSec, false, true, timeStr, null);
    if (shouldRenderInActiveChat(chatId)) appendMsgToDOM(el);
    playBeep(true);
    const previewText = `🎤 Sesli mesaj (${durSec}s)`;
    dbSaveMessage(chatId, { text: previewText, ts, sender: displaySender, isOwn: false, isP2P: true, isPrivate: true });
    if (!(state.chatMode === 'chat' && state.activeChat === senderConnId)) {
        ozelSayac++;
        const badge = document.getElementById('convOzelBadge'); if (badge) { badge.innerText = ozelSayac; badge.classList.remove('hidden'); }
        const navBadge = document.getElementById('navBadgeSohbet'); if (navBadge) { navBadge.innerText = ozelSayac; navBadge.classList.remove('hidden'); }
    }
    updateConversation(senderConnId, previewText, false, true);
}

function handleVoicePacket(senderConnId, data) {
    if (data.startsWith("VOICE_PART###")) {
        const parts = data.split("###");
        const vid = parts[1], idx = parseInt(parts[2],10), total = parseInt(parts[3],10);
        const mime = parts[4] || 'audio/webm', dur = parseInt(parts[5],10) || 1;
        const chunk = parts.slice(6).join("###");
        const key = senderConnId + ':' + vid;
        let rec = _voiceRx.get(key);
        if (!rec) { rec = { parts: new Array(total), total, mime, dur, count: 0 }; _voiceRx.set(key, rec); }
        if (rec.parts[idx] === undefined) { rec.parts[idx] = chunk; rec.count++; }
    } else if (data.startsWith("VOICE_END###")) {
        const vid = data.split("###")[1];
        const key = senderConnId + ':' + vid;
        const rec = _voiceRx.get(key); if (!rec) return;
        _voiceRx.delete(key);
        try {
            const b64 = rec.parts.join('');
            const bin = atob(b64);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            const blob = new Blob([u8], { type: rec.mime });
            const url = URL.createObjectURL(blob);
            renderIncomingVoice(senderConnId, url, rec.dur);
            log(`[P2P ←] 🎤 Sesli mesaj (${rec.dur}s) ${senderConnId.substring(0,8)}`, '#22c55e');
        } catch (e) { console.warn('voice reassemble error', e); }
    }
}

async function sendVoiceMessage(targetConnId, base64Audio, durSec, mime) {
    if (!targetConnId || targetConnId === 'HERKES' || targetConnId === CONFIG.connectionId) return false;
    if (!base64Audio) return false;
    const peer = peers[targetConnId];
    if (!peer || !peer.dc || peer.dc.readyState !== 'open') {
        try { initP2P(targetConnId); } catch(e) {}
        log('[P2P] Sesli mesaj için P2P kanal hazır değil; kısa süre sonra tekrar deneyin.', '#fbbf24');
        return false;
    }
    const vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const total = Math.ceil(base64Audio.length / VOICE_CHUNK);
    const m = mime || 'audio/webm';
    const dur = Math.max(1, Math.round(durSec || 1));
    for (let i = 0; i < total; i++) {
        const chunk = base64Audio.slice(i * VOICE_CHUNK, (i + 1) * VOICE_CHUNK);
        const pkt = `VOICE_PART###${vid}###${i}###${total}###${m}###${dur}###${chunk}`;
        if (!sendDataChannelText(targetConnId, pkt)) {
            await new Promise(r => setTimeout(r, 30));
            if (!sendDataChannelText(targetConnId, pkt)) { log('[P2P] Sesli mesaj parçası gönderilemedi', '#ef4444'); return false; }
        }
        if (i % 8 === 7) await new Promise(r => setTimeout(r, 10));
    }
    sendDataChannelText(targetConnId, `VOICE_END###${vid}`);
    try {
        const bin = atob(base64Audio);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: m });
        const url = URL.createObjectURL(blob);
        renderOwnVoice(targetConnId, url, dur, vid);
    } catch(e) {}
    log(`[P2P →] 🎤 Sesli mesaj (${dur}s) gönderildi`, '#22c55e');
    return true;
}
window.sendVoiceMessage = sendVoiceMessage;


function showContactCard(connId) {
    cardTargetConnId = connId;
    const nick = getDisplayName(connId);
    const avatarEl = document.getElementById('cardAvatar');
    renderProfileAvatar(avatarEl, connId, 'contact-card-avatar', nick);
    const cleanName = nick.replace(/\[.*?\]/g, '').trim();
    document.getElementById('cardName').innerText = cleanName || nick;
    const numPart = nick.match(/\[(.*?)\]/);
    document.getElementById('cardNumber').innerText = numPart ? numPart[1] : connId.substring(0, 12);
    closeCardMoreMenu();
    document.getElementById('contactCardOverlay').classList.remove('hidden');
}

function closeContactCard() {
    document.getElementById('contactCardOverlay').classList.add('hidden');
    closeCardMoreMenu();
    cardTargetConnId = null;
}

async function deleteContactFromCard() {
    const connId = cardTargetConnId;
    if (!connId) return;
    const c = getContactByConnId(connId);
    if (!c) { closeContactCard(); return; }
    if (!confirm(`"${c.name || c.number}" rehberden silinsin mi? Mesaj geçmişi de silinecek.`)) return;
    try { if (peers[connId]?.pc) peers[connId].pc.close(); } catch(e){}
    delete peers[connId];
    contactsState.byNumber.delete(c.number);
    await dbDeleteContact(c.number);
    closeContactCard();
    if (state.chatMode === 'chat' && state.activeChat === connId) backToList();
    updateUI();
    log(`Kişi silindi: ${c.name || c.number}`, '#ef4444');
}

document.getElementById('contactCardOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeContactCard();
});

function startAudioCallFromCard() {
    if (!cardTargetConnId) return;
    const connId = cardTargetConnId;
    closeContactCard();
    startAudioCall(connId, false); // false = outgoing call, send CALL_RING
}

function startVideoCallFromCard() {
    if (!cardTargetConnId) return;
    const connId = cardTargetConnId;
    closeContactCard();
    startVideoCall(connId, false); // false = outgoing call, send CALL_RING
}

function sendMessageFromCard() {
    if (!cardTargetConnId) return;
    const connId = cardTargetConnId;
    closeContactCard();
    switchView('sohbetler');
    openChat(connId);
}

function showContactInfo() {
    if (!cardTargetConnId) return;
    const connId = cardTargetConnId;
    const nick = getDisplayName(connId);
    const isConnected = peers[connId]?.dc?.readyState === "open";
    const avatarEl = document.getElementById('infoAvatar');
    renderProfileAvatar(avatarEl, connId, 'contact-info-avatar', nick);
    const cleanName = nick.replace(/\[.*?\]/g, '').trim();
    document.getElementById('infoName').innerText = cleanName || nick;
    const numPart = nick.match(/\[(.*?)\]/);
    document.getElementById('infoNumber').innerText = numPart ? numPart[1] : connId.substring(0, 12);
    document.getElementById('infoFieldName').innerText = cleanName || nick;
    document.getElementById('infoFieldNumber').innerText = numPart ? numPart[1] : 'Bilinmiyor';
    document.getElementById('infoFieldConnType').innerText = isConnected ? '🟢 P2P Doğrudan Bağlantı' : '⚪ WSS Sunucu Üzerinden';
    document.getElementById('infoFieldConnId').innerText = connId;
    document.getElementById('infoFieldStatus').innerText = isConnected ? 'Çevrimiçi - P2P Aktif' : 'Çevrimiçi';
    closeContactCard();
    document.getElementById('contactInfoModal').classList.remove('hidden');
}

// ==================== ACTIVE CALL WITH DURATION ====================
let callTimerInterval = null;
let callStartTime = null;
let isMuted = false;
let isSpeaker = false;

let activeCallConnId = null; // Track which connId the active call is with

async function startAudioCall(connId, isIncoming, connectedAt) {
    activeCallConnId = connId;
    const nick = getDisplayName(connId);
    const avatarEl = document.getElementById('activeCallAvatar');
    renderProfileAvatar(avatarEl, connId, 'active-call-avatar', nick, 'font-size:44px');
    document.getElementById('activeCallName').innerText = nick.replace(/\[.*?\]/g, '').trim() || nick;
    document.getElementById('activeCallDuration').innerText = '00:00';
    document.getElementById('activeCallScreen').classList.remove('hidden');

    isMuted = false; isSpeaker = false;
    document.getElementById('btnMute').classList.remove('active');
    document.getElementById('btnSpeaker').classList.remove('active');
    document.getElementById('btnVideoToggle').classList.remove('active');

    // First get microphone BEFORE setting up P2P so tracks are available
    if (!localAudioStream) {
        try {
            localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            log("Mikrofon aktif - Sesli arama", "#22c55e");
        } catch (e) {
            log("Mikrofon izni yok!", "#ef4444");
        }
    }

    // Now init P2P - localAudioStream is available so tracks will be added
    await initP2P(connId);

    if (isIncoming) {
        // Incoming call accepted - start timer immediately since both sides are ready
        document.getElementById('activeCallStatus').innerText = 'Bağlandı';
        startCallTimer(connectedAt || Date.now());
    } else {
        // Outgoing call - show "Çalıyor..." and wait for CALL_ACCEPT
        document.getElementById('activeCallStatus').innerText = 'Çalıyor...';
        // Do NOT start timer yet - wait for CALL_ACCEPT
        sendCallSignal(connId, "CALL_RING");
    }
}

function startCallTimer(startedAt) {
    // Clear any existing timer
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
    callStartTime = startedAt || Date.now();
    if (Math.abs(Date.now() - callStartTime) > 60000) callStartTime = Date.now();
    try { window.__SOHBETO_CALL_CONNECTED_AT = callStartTime; } catch (e) {}
    const tick = () => {
        const elapsed = Date.now() - callStartTime;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        const timeStr = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        document.getElementById('activeCallDuration').innerText = timeStr;
        const activeStatusEl = document.getElementById('activeCallStatus');
        if (activeStatusEl) activeStatusEl.innerText = 'Bağlandı';
        // Also update video call duration if active
        if (document.getElementById('videoContainer').classList.contains('active')) {
            document.getElementById('videoCallDuration').innerText = timeStr;
        }
    };
    tick();
    callTimerInterval = setInterval(tick, 1000);
}

function endActiveCall(skipSend) {
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(t => t.stop());
        localAudioStream = null;
    }
    const connId = activeCallConnId || state.activeChat;
    if (!skipSend && connId && connId !== 'genel') sendCallSignal(connId, "CALL_END");
    activeCallConnId = null;
    document.getElementById('activeCallScreen').classList.add('hidden');
    log("Arama sonlandırıldı", "#f59e0b");
}

function toggleMute() {
    isMuted = !isMuted;
    document.getElementById('btnMute').classList.toggle('active', isMuted);
    document.getElementById('btnVideoMute').classList.toggle('active', isMuted);
    if (localAudioStream) {
        localAudioStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
    }
    log(isMuted ? "Mikrofon sessiz" : "Mikrofon açık", isMuted ? "#ef4444" : "#22c55e");
}

function toggleSpeaker() {
    isSpeaker = !isSpeaker;
    document.getElementById('btnSpeaker').classList.toggle('active', isSpeaker);
    document.getElementById('btnVideoSpeaker').classList.toggle('active', isSpeaker);
    log(isSpeaker ? "Hoparlör açık" : "Hoparlör kapalı", "#6366f1");
}

async function toggleVideoInCall() {
    const connId = activeCallConnId || state.activeChat || cardTargetConnId;
    await startVideoCall(connId, true);
    if (connId) sendCallSignal(connId, "CALL_RING_VIDEO");
    document.getElementById('activeCallScreen').classList.add('hidden');
}

// ==================== VIDEO CALL ====================
let localVideoStream = null;
let videoTimerInterval = null; // kept for backward compat, prefer callTimerInterval

async function startVideoCall(connId, isIncoming, connectedAt) {
    if (!connId) return;
    activeCallConnId = connId;
    const nick = getDisplayName(connId);

    try {
        localVideoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // Also set localAudioStream from video stream's audio tracks
        if (!localAudioStream) {
            localAudioStream = localVideoStream;
        }

        const localVideoEl = document.createElement('video');
        localVideoEl.srcObject = localVideoStream;
        localVideoEl.autoplay = true;
        localVideoEl.muted = true;
        localVideoEl.playsInline = true;
        document.getElementById('videoLocal').innerHTML = '';
        document.getElementById('videoLocal').appendChild(localVideoEl);

        document.getElementById('videoCallName').innerText = nick.replace(/\[.*?\]/g, '').trim() || nick;
        document.getElementById('videoContainer').classList.add('active');

        // Tema/adapter köprüleri için #activeCallScreen'i de aç ve durumu yaz —
        // görsel ekran iframe içinde offscreen stub'ta, etki yok; sadece sinyal.
        const acScreen = document.getElementById('activeCallScreen');
        if (acScreen) acScreen.classList.remove('hidden');
        const acName = document.getElementById('activeCallName');
        if (acName) acName.innerText = nick.replace(/\[.*?\]/g, '').trim() || nick;
        const acStatus = document.getElementById('activeCallStatus');
        if (acStatus) acStatus.innerText = isIncoming ? 'Bağlandı' : 'Çalıyor…';
        const acDuration = document.getElementById('activeCallDuration');
        if (acDuration) acDuration.innerText = '00:00';

        // Init P2P first so peer connection exists, then add tracks
        await initP2P(connId);

        // Add/replace all tracks (audio + video) and renegotiate when needed
        const changed = addStreamTracksToPeer(connId, localVideoStream);
        if (changed) await renegotiatePeer(connId);

        if (isIncoming) {
            // Incoming/switching from audio - start timer immediately
            const acStatus = document.getElementById('activeCallStatus');
            if (acStatus) acStatus.innerText = 'Bağlandı';
            const videoDuration = document.getElementById('videoCallDuration');
            if (videoDuration) videoDuration.innerText = '00:00';
            startCallTimer(connectedAt || Date.now());
            log("Görüntülü arama kabul edildi", "#22c55e");
        } else {
            // Outgoing call - don't start timer, wait for CALL_ACCEPT
            document.getElementById('videoCallDuration').innerText = '00:00';
            sendCallSignal(connId, "CALL_RING_VIDEO");
            log("Görüntülü arama başlatıldı - Karşı taraf bekleniyor", "#6366f1");
        }
    } catch (e) {
        log("Kamera/mikrofon izni yok: " + e.message, "#ef4444");
    }
}

function toggleCamera() {
    if (localVideoStream) {
        const videoTracks = localVideoStream.getVideoTracks();
        videoTracks.forEach(t => { t.enabled = !t.enabled; });
        document.getElementById('btnCameraToggle').classList.toggle('active', videoTracks[0]?.enabled);
        log(videoTracks[0]?.enabled ? "Kamera açık" : "Kamera kapalı", "#6366f1");
    }
}

function endVideoCall(skipSend) {
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
    if (videoTimerInterval) { clearInterval(videoTimerInterval); videoTimerInterval = null; }
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(t => t.stop());
        localVideoStream = null;
    }
    if (localAudioStream) {
        localAudioStream.getTracks().forEach(t => t.stop());
        localAudioStream = null;
    }
    const connId = activeCallConnId || state.activeChat;
    if (!skipSend && connId && connId !== 'genel') sendCallSignal(connId, "CALL_END");
    activeCallConnId = null;
    document.getElementById('videoContainer').classList.remove('active');
    document.getElementById('videoLocal').innerHTML = '';
    document.getElementById('videoRemote').innerHTML = '<div class="video-placeholder">📹</div>';
    log("Görüntülü arama sonlandırıldı", "#f59e0b");
}

// ==================== SETTINGS ====================
function openSettings() {
    document.getElementById('settingsName').value = state.nick || '';
    document.getElementById('settingsBio').value = state.bio || '';
    updateProfilePics(); renderMemories();
    document.getElementById('settingsModal').classList.remove('hidden');
}
function renderMemories() {
    const list = document.getElementById('memoriesList'); list.innerHTML = '';
    state.memories.forEach((mem, i) => {
        const d = document.createElement('div'); d.className = 'memory-item';
        d.innerHTML = `<div class="memory-icon">${mem.icon || '📌'}</div><div style="flex:1"><div class="memory-text">${escapeHtml(mem.text)}</div><div class="memory-date">${mem.date || ''}</div></div><button class="icon-btn" onclick="removeMemory(${i})" style="color:#f87171;font-size:16px">✕</button>`;
        list.appendChild(d);
    });
}
function addMemory() {
    const text = prompt('Anınızı yazın:'); if (!text) return;
    const icons = ['📌','💡','🎵','📸','❤️','⭐','🎯','🌟'];
    state.memories.push({ text, icon: icons[Math.floor(Math.random() * icons.length)], date: new Date().toLocaleDateString('tr-TR') });
    dbPut("memories", state.memories); renderMemories();
}
function removeMemory(index) { state.memories.splice(index, 1); dbPut("memories", state.memories); renderMemories(); }
async function saveSettings() {
    const name = document.getElementById('settingsName').value.trim(), bio = document.getElementById('settingsBio').value.trim();
    if (name) { state.nick = name; await dbPut("nick", name); }
    state.bio = bio; await dbPut("bio", bio);
    await dbPut("profileEmoji", state.profileEmoji);
    await dbPut("profileImage", state.profileImage || null);
    document.getElementById('settingsModal').classList.add('hidden'); scheduleProfileBroadcast(50); log("Ayarlar kaydedildi ve P2P profili gönderildi", "#22c55e");
}

// ==================== EVENTS ====================
function openEvents() {
    const body = document.getElementById('eventsBody');
    body.innerHTML = `
        <div class="event-card"><div class="event-date">1 Mayıs 2026</div><div class="event-title">🚀 Sohbeto Lansman</div><div class="event-desc">Yeni güvenli mesajlaşma platformu resmi olarak yayında!</div><span class="event-badge active">Aktif</span></div>
        <div class="event-card"><div class="event-date">5 Mayıs 2026</div><div class="event-title">🎮 Oyun Gecesi</div><div class="event-desc">Çevrimiçi oyun gecesi - tüm kullanıcılar davetli</div><span class="event-badge upcoming">Yakında</span></div>
        <div class="event-card"><div class="event-date">10 Mayıs 2026</div><div class="event-title">🔒 Güvenlik Güncellemesi</div><div class="event-desc">Çift kilit sistemi ve yeni şifreleme algoritmaları eklenecek</div><span class="event-badge upcoming">Yakında</span></div>
        <div class="event-card"><div class="event-date">15 Mayıs 2026</div><div class="event-title">🎤 Sesli Sohbet Beta</div><div class="event-desc">Grup sesli sohbet özelliği beta olarak kullanıma açılacak</div><span class="event-badge upcoming">Yakında</span></div>
        <div class="event-card"><div class="event-date">20 Mayıs 2026</div><div class="event-title">🏆 En Aktif Kullanıcı Ödülü</div><div class="event-desc">Haftanın en aktif kullanıcısına özel rozet</div><span class="event-badge upcoming">Yakında</span></div>
    `;
    document.getElementById('eventsModal').classList.remove('hidden');
}

// ==================== AUTO-RESIZE TEXTAREA ====================
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });

// ==================== EVENT HANDLERS ====================
// ==================== WELCOME (lokal SMS doğrulama) ====================
let _pendingVerifyCode = null;
let _pendingVerifyNumber = null;

document.getElementById('btnSendCode').onclick = async () => {
    const numEl = document.getElementById('welcomeNumber');
    const num = normalizeNumber(numEl.value);
    if (!num || num.length < 8) { showNotif('Geçerli bir numara girin (örn. +905551234567).', 4000); return; }
    const nick = 'Kullanıcı';
    state.nick = nick; await dbPut("nick", nick);
    _pendingVerifyNumber = num;
    _pendingVerifyCode = String(Math.floor(100000 + Math.random() * 900000));
    log(`Doğrulama kodu üretildi: ${_pendingVerifyCode}`, '#fbbf24');
    try { window.parent && window.parent.postMessage({ type: 'sohbeto:code', code: _pendingVerifyCode, number: num }, '*'); } catch(e){}
    openOtpScreen('welcome');
};

document.getElementById('btnStart').onclick = async () => {
    const codeEl = document.getElementById('welcomeCode');
    const entered = (codeEl.value || '').trim();
    if (!_pendingVerifyCode || !_pendingVerifyNumber) { showNotif('Önce doğrulama kodu gönderin.', 4000); return; }
    if (entered !== _pendingVerifyCode) { showNotif('❌ Kod hatalı, tekrar deneyin.', 4000); codeEl.value = ''; return; }
    const btn = document.getElementById('btnStart'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>BAĞLANIYOR...';
    if (!state.nick) { state.nick = 'Kullanıcı'; await dbPut("nick", state.nick); }
    await dbPut("profileEmoji", state.profileEmoji);
    const virtualNo = _pendingVerifyNumber;
    const seed = await generateSeed(state.nick, virtualNo);
    await saveVirtualNo(virtualNo, seed);
    hideNotif();
    connectCountServer(() => {
        connectChat(async () => {
            log(`Sanal numara: ${virtualNo}`, "#22c55e");
            await dbPut("firstSessionDone", true);
            try { window.parent && window.parent.postMessage({ type: 'sohbeto:registered', number: virtualNo }, '*'); } catch(e){}
            setTimeout(() => enterChatScreen(), 1500);
        });
    });
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { }
};

document.getElementById('welcomeCode').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btnStart').click(); });

// ==================== LOGIN (SMS doğrulama, çıkış sonrası) ====================
let _loginPendingCode = null;
let _loginPendingNumber = null;

document.getElementById('btnLoginSendCode').onclick = async () => {
    const numEl = document.getElementById('loginNumber');
    const num = normalizeNumber(numEl.value);
    if (!num || num.length < 8) { showNotif('Geçerli bir numara girin (örn. +905551234567).', 4000); return; }
    _loginPendingNumber = num;
    _loginPendingCode = String(Math.floor(100000 + Math.random() * 900000));
    log(`Login doğrulama kodu üretildi: ${_loginPendingCode}`, '#fbbf24');
    try { window.parent && window.parent.postMessage({ type: 'sohbeto:code', code: _loginPendingCode, number: num }, '*'); } catch(e){}
    openOtpScreen('login');
};

document.getElementById('btnLoginVerify').onclick = async () => {
    const codeEl = document.getElementById('loginCode');
    const entered = (codeEl.value || '').trim();
    if (!_loginPendingCode || !_loginPendingNumber) { showNotif('Önce doğrulama kodu gönderin.', 4000); return; }
    if (entered !== _loginPendingCode) { showNotif('❌ Kod hatalı, tekrar deneyin.', 4000); codeEl.value = ''; return; }
    const btn = document.getElementById('btnLoginVerify'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>BAĞLANIYOR...';
    if (!state.nick) { state.nick = 'Kullanıcı'; await dbPut("nick", state.nick); }
    // Eğer numara değiştiyse yeni seed üret ve kaydet, aynıysa mevcudu kullan
    if (!CONFIG.virtualNo || CONFIG.virtualNo !== _loginPendingNumber) {
        const seed = await generateSeed(state.nick, _loginPendingNumber);
        await saveVirtualNo(_loginPendingNumber, seed);
    }
    await dbPut("firstSessionDone", true);
    hideNotif();
    btn.disabled = false; btn.innerHTML = 'DOĞRULA & BAŞLA';
    _loginPendingCode = null; _loginPendingNumber = null;
    document.getElementById('loginCode').value = '';
    document.getElementById('loginNumber').value = '';
    document.getElementById('loginCodeWrap').classList.add('hidden');
    connectAndChat();
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { }
};

document.getElementById('loginCode').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btnLoginVerify').click(); });
document.getElementById('loginNumber').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btnLoginSendCode').click(); });

function connectAndChat() {
    enterChatScreen();
    if (!wsChat || wsChat.readyState !== 1) { connectCountServer(() => connectChat()); try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { } }
}

document.getElementById('btnSend').onclick = sendCurrentMessage;
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCurrentMessage(); } });

const menuDropdown = document.getElementById('menuDropdown');
document.getElementById('btnMenu').onclick = (e) => { e.stopPropagation(); menuDropdown.classList.toggle('hidden'); };
document.addEventListener('click', (e) => { if (!menuDropdown.contains(e.target) && e.target !== document.getElementById('btnMenu')) menuDropdown.classList.add('hidden'); });

document.getElementById('menuSettings').onclick = () => { menuDropdown.classList.add('hidden'); openSettings(); };
document.getElementById('menuEvents').onclick = () => { menuDropdown.classList.add('hidden'); openEvents(); };
document.getElementById('menuLogToggle').onclick = () => { menuDropdown.classList.add('hidden'); document.getElementById('logPanel').classList.toggle('hidden'); };
document.getElementById('menuLogout').onclick = async () => {
    menuDropdown.classList.add('hidden');
    // End any active calls
    endActiveCall();
    endVideoCall();
    // Close WebSocket connections
    if (wsChat) try { wsChat.close(); wsChat = null; } catch (e) { }
    if (wsCount) try { wsCount.close(); wsCount = null; } catch (e) { }
    // Clear all runtime state
    state.users.clear();
    state.conversations.clear();
    state.outboundQueue.clear();
    state.sentMsgs.clear();
    state.chatMode = 'list';
    state.activeChat = null;
    state.target = 'HERKES';
    state.currentView = 'sohbetler';
    state.currentConvTab = 'genel';
    state.incomingCallFrom = null;
    ozelSayac = 0;
    // Clear all peer connections
    Object.keys(peers).forEach(k => { try { if (peers[k].pc) peers[k].pc.close(); } catch(e){} delete peers[k]; });
    // Clear UI elements
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('contactList').innerHTML = '';
    document.getElementById('convListGenel').innerHTML = '';
    document.getElementById('convListOzel').innerHTML = '';
    document.getElementById('logContainer').innerHTML = '';
    // Reset login (SMS) UI
    _loginPendingCode = null; _loginPendingNumber = null;
    var _ln = document.getElementById('loginNumber'); if (_ln) _ln.value = CONFIG.virtualNo || '+90';
    var _lc = document.getElementById('loginCode'); if (_lc) _lc.value = '';
    var _lcw = document.getElementById('loginCodeWrap'); if (_lcw) _lcw.classList.add('hidden');
    // Login ekranındaki profil avatarını güncelle
    var _lpc = document.getElementById('loginPicCircle');
    if (_lpc) {
        if (state.profileImage) _lpc.innerHTML = `<img src="${escapeAttr(state.profileImage)}" alt="Profil fotoğrafı">`;
        else _lpc.innerText = state.profileEmoji || '👤';
    }
    // Reset badges
    document.getElementById('convOzelBadge').classList.add('hidden');
    document.getElementById('navBadgeSohbet').classList.add('hidden');
    // Reset navigation state
    backToList();
    switchView('sohbetler');
    // Switch to login screen
    switchScreen('screenLogin');
    log("Çıkış yapıldı", "#f59e0b");
};

// ==================== TIMERS ====================
// (Şifre rotasyon zamanlayıcısı kaldırıldı - artık SMS doğrulama kullanılıyor)

// ==================== INIT ====================
// ===== Sohbeto Theme System =====
function setSohbetoTheme(name){
    if(!['glass','cosmic','minimal'].includes(name)) name='cosmic';
    document.body.setAttribute('data-sohbeto-theme', name);
    try{ localStorage.setItem('sohbeto_theme', name); }catch(e){}
    document.querySelectorAll('#themePicker .theme-card, #themeTour .tt-card').forEach(c=>{
        c.classList.toggle('active', c.dataset.theme===name);
    });
}
function loadSohbetoTheme(){
    let t='cosmic';
    try{ t = localStorage.getItem('sohbeto_theme') || 'cosmic'; }catch(e){}
    setSohbetoTheme(t);
}
// ===== Sanal Tur (varsayılan: kapalı) =====
function tourPick(name){ setSohbetoTheme(name); }
function tourFinish(){
    try{ localStorage.setItem('sohbeto_tour_done','1'); }catch(e){}
    const el=document.getElementById('themeTour');
    if(el){ el.style.transition='opacity .35s'; el.style.opacity='0'; setTimeout(()=>{el.classList.remove('active');el.style.opacity='';},350); }
}
function maybeShowTour(){ /* devre dışı: cosmic varsayılan tema */ }

// ===== OTP SCREEN (mockup) =====
let _otpFlow = null; let _otpTimerInt = null;
function openOtpScreen(flow){
    _otpFlow = flow;
    switchScreen('screenOtp');
    const cells = document.querySelectorAll('#screenOtp .otp-cell');
    cells.forEach(c => c.value = '');
    setTimeout(() => cells[0]?.focus(), 80);
    // 2:45 geri sayım
    let remaining = 165;
    const tEl = document.getElementById('otpTimer');
    const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    if (tEl) tEl.innerText = fmt(remaining);
    if (_otpTimerInt) clearInterval(_otpTimerInt);
    _otpTimerInt = setInterval(() => {
        remaining--;
        if (tEl) tEl.innerText = fmt(Math.max(0, remaining));
        if (remaining <= 0) { clearInterval(_otpTimerInt); _otpTimerInt = null; }
    }, 1000);
}
function _otpReadCode(){
    return Array.from(document.querySelectorAll('#screenOtp .otp-cell')).map(c => (c.value||'').trim()).join('');
}
document.querySelectorAll('#screenOtp .otp-cell').forEach((cell, i, arr) => {
    cell.addEventListener('input', e => {
        const v = e.target.value.replace(/[^0-9]/g,'').slice(0,1);
        e.target.value = v;
        if (v && arr[i+1]) arr[i+1].focus();
        if (_otpReadCode().length === 6) document.getElementById('otpVerifyBtn').click();
    });
    cell.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !e.target.value && arr[i-1]) arr[i-1].focus();
        if (e.key === 'Enter') document.getElementById('otpVerifyBtn').click();
    });
    cell.addEventListener('paste', e => {
        const txt = (e.clipboardData?.getData('text')||'').replace(/[^0-9]/g,'').slice(0,6);
        if (!txt) return;
        e.preventDefault();
        arr.forEach((c, idx) => c.value = txt[idx] || '');
        if (txt.length === 6) document.getElementById('otpVerifyBtn').click();
    });
});
document.getElementById('otpVerifyBtn').onclick = () => {
    const code = _otpReadCode();
    if (code.length !== 6) { showNotif('6 haneli kodu girin.', 3000); return; }
    if (_otpFlow === 'login') {
        document.getElementById('loginCode').value = code;
        document.getElementById('btnLoginVerify').click();
    } else {
        document.getElementById('welcomeCode').value = code;
        document.getElementById('btnStart').click();
    }
};
document.getElementById('otpResendBtn').onclick = () => {
    if (_otpFlow === 'login') document.getElementById('btnLoginSendCode').click();
    else document.getElementById('btnSendCode').click();
};

async function init() {
    loadSohbetoTheme();
    // Unregister any service workers to prevent caching issues
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            registrations.forEach(reg => reg.unregister());
        } catch (e) {}
    }
    // Clear caches
    if ('caches' in window) {
        try {
            const names = await caches.keys();
            names.forEach(name => caches.delete(name));
        } catch (e) {}
    }

    const identity = await loadIdentity(); loadOutbox(); initAvatarGrid(); updateProfilePics();
    await loadContactsToState();
    const splashStart = Date.now();
    const SPLASH_MIN = 2500;
    const finishSplash = () => {
        const splash = document.getElementById('screenSplash');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 450);
        }
        if (identity.hasNo && identity.hasSeed) { connectAndChat(); }
        else { switchScreen('screenWelcome'); }
        maybeShowTour();
    };
    const wait = Math.max(0, SPLASH_MIN - (Date.now() - splashStart));
    setTimeout(finishSplash, wait);
}
init();
