import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════
// LOAD .env FILE (tanpa library tambahan)
// ══════════════════════════════════════════════════════
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('[CONFIG] File .env tidak ditemukan. Menggunakan nilai default (TIDAK AMAN untuk produksi!).');
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // skip komentar & baris kosong
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key   = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
  console.info('[CONFIG] File .env berhasil dimuat.');
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);

const DATA_DIR     = path.join(__dirname, 'data');
const UPLOADS_DIR  = path.join(__dirname, 'assets', 'uploads');
const CMS_FILE     = path.join(DATA_DIR, 'cms.json');
const MENU_FILE    = path.join(DATA_DIR, 'menu.json');

// Pastikan direktori data dan uploads tersedia
if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ══════════════════════════════════════════════════════
// SECURITY CONFIGURATION
// ══════════════════════════════════════════════════════

// ── 1. Admin Credentials ──
// Dibaca dari file .env (lihat .env di root project)
// JANGAN hardcode username/password di sini!
const isProduction = process.env.APP_ENV === 'production';
const missingAdminCredentials = !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;

if (isProduction && missingAdminCredentials) {
  console.error('[SECURITY] ADMIN_USERNAME dan ADMIN_PASSWORD wajib diatur pada environment production.');
  process.exit(1);
}

const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'adminbitts',
  password: process.env.ADMIN_PASSWORD || 'bittscoffe2026'
};

if (missingAdminCredentials) {
  console.warn('[SECURITY] ⚠️  ADMIN_USERNAME/ADMIN_PASSWORD tidak ditemukan di .env!');
  console.warn('[SECURITY] ⚠️  Gunakan kredensial default — GANTI sebelum deploy ke publik!');
}

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TOKEN_TTL_MS  = 30 * 24 * 60 * 60 * 1000; // 30 hari (sekali login)

function loadActiveTokens() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      const map = new Map();
      const now = Date.now();
      for (const [token, expiresAt] of Object.entries(data)) {
        if (expiresAt > now) map.set(token, expiresAt);
      }
      return map;
    }
  } catch (err) {
    console.error('Error loading sessions:', err.message);
  }
  return new Map();
}

const activeTokens = loadActiveTokens();

function saveActiveTokens() {
  try {
    const obj = {};
    const now = Date.now();
    for (const [token, expiresAt] of activeTokens.entries()) {
      if (expiresAt > now) obj[token] = expiresAt;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sessions:', err.message);
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isValidToken(token) {
  if (!token || !activeTokens.has(token)) return false;
  const expiresAt = activeTokens.get(token);
  if (Date.now() > expiresAt) { 
    activeTokens.delete(token); 
    saveActiveTokens();
    return false; 
  }
  return true;
}

function requireAuth(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!isValidToken(token)) {
    sendJson(res, 401, { success: false, error: 'Akses ditolak. Login terlebih dahulu.' });
    return false;
  }
  return true;
}

// ── 3. Rate Limiting (per IP) ──
// Struktur: { ip -> { count, windowStart } }
const RATE_LIMIT = {
  LOGIN_MAX:        10,               // maks percobaan dalam 1 window
  WINDOW_MS:        15 * 60 * 1000,  // window 15 menit
  LOCKOUT_FAILS:    5,                // gagal berturut-turut sebelum lockout
  LOCKOUT_MS:       15 * 60 * 1000,  // durasi lockout 15 menit
};

const loginAttempts   = new Map(); // { ip -> { count, windowStart } }
const loginLockouts   = new Map(); // { ip -> { fails, lockedUntil } }

function getClientIp(req) {
  // Ambil IP asli bahkan di balik proxy/reverse proxy
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// Cek apakah IP sedang dalam lockout
function isLockedOut(ip) {
  const lock = loginLockouts.get(ip);
  if (!lock) return false;
  if (Date.now() > lock.lockedUntil) {
    loginLockouts.delete(ip);
    return false;
  }
  return true;
}

function getLockoutSecondsLeft(ip) {
  const lock = loginLockouts.get(ip);
  if (!lock) return 0;
  return Math.ceil((lock.lockedUntil - Date.now()) / 1000);
}

// Cek rate limit: true = masih boleh, false = sudah limit
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || (now - entry.windowStart) > RATE_LIMIT.WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT.LOGIN_MAX) return false;
  return true;
}

// Catat kegagalan login untuk lockout
function recordLoginFailure(ip) {
  const now = Date.now();
  const lock = loginLockouts.get(ip) || { fails: 0, lockedUntil: 0 };
  lock.fails++;
  if (lock.fails >= RATE_LIMIT.LOCKOUT_FAILS) {
    lock.lockedUntil = now + RATE_LIMIT.LOCKOUT_MS;
    lock.fails = 0; // reset setelah lockout aktif
    console.warn(`[SECURITY] IP ${ip} dikunci 15 menit karena ${RATE_LIMIT.LOCKOUT_FAILS}x login gagal`);
  }
  loginLockouts.set(ip, lock);
}

function recordLoginSuccess(ip) {
  loginAttempts.delete(ip);
  loginLockouts.delete(ip);
}

// ── 4. HTTP Security Headers ──
const SECURITY_HEADERS = {
  // Cegah browser menebak tipe konten (MIME sniffing)
  'X-Content-Type-Options':  'nosniff',
  // Cegah website ini di-embed di iframe situs lain (Clickjacking)
  'X-Frame-Options':         'DENY',
  // Filter XSS bawaan browser lama
  'X-XSS-Protection':        '1; mode=block',
  // Jangan kirim Referer ke situs eksternal
  'Referrer-Policy':         'strict-origin-when-cross-origin',
  'Permissions-Policy':      'camera=(), microphone=(), geolocation=()',
  // Content Security Policy — hanya izinkan resource dari domain sendiri
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://esm.sh",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "frame-src https://www.google.com https://maps.google.com",
    "connect-src 'self' https://cppjonqvolackeqzneqm.supabase.co https://esm.sh",
    "object-src 'none'"
  ].join('; '),
  // Paksa HTTPS (aktif setelah deploy ke domain dengan SSL)
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function applySecurityHeaders(res, extraHeaders = {}) {
  const allHeaders = { ...SECURITY_HEADERS, ...extraHeaders };
  Object.entries(allHeaders).forEach(([k, v]) => res.setHeader(k, v));
}

// ── 5. Input Sanitization ──
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '') // hapus tag script
    .replace(/<[^>]*>/g, '')                      // hapus semua HTML tag
    .replace(/javascript:/gi, '')                 // hapus javascript: scheme
    .replace(/on\w+\s*=/gi, '')                   // hapus event handler attr
    .trim();
}

function sanitizeDeep(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[sanitizeString(k)] = sanitizeDeep(v);
    }
    return clean;
  }
  return obj;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Helper: send JSON response (dengan security headers)
function sendJson(res, statusCode, data) {
  applySecurityHeaders(res, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

// Helper: read JSON body from request
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Prevent flood attack (max 25MB for image uploads)
      if (body.length > 25 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper: safe read file JSON
function readJsonFile(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

// Helper: safe write file JSON
function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    applySecurityHeaders(res, {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.writeHead(204, {
      'Content-Length': '0'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ══════════════════════════════════════════════════════
  // REST API ROUTES (/api/*)
  // ══════════════════════════════════════════════════════

  // 0. AUTH: POST /api/login & POST /api/logout
  if (pathname === '/api/login' && method === 'POST') {
    const ip = getClientIp(req);

    // Cek lockout terlebih dahulu
    if (isLockedOut(ip)) {
      const secs = getLockoutSecondsLeft(ip);
      const mins = Math.ceil(secs / 60);
      console.warn(`[SECURITY] Login ditolak — IP ${ip} masih dalam lockout (${secs}s tersisa)`);
      return sendJson(res, 429, {
        success: false,
        error: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${mins} menit.`,
        retryAfterSeconds: secs
      });
    }

    // Cek rate limit
    if (!checkRateLimit(ip)) {
      console.warn(`[SECURITY] Rate limit tercapai untuk IP: ${ip}`);
      return sendJson(res, 429, {
        success: false,
        error: 'Terlalu banyak permintaan. Tunggu 15 menit sebelum mencoba lagi.',
        retryAfterSeconds: 900
      });
    }

    try {
      const rawBody = await getRequestBody(req);
      const body    = sanitizeDeep(rawBody);
      const { username, password } = body;

      // Validasi tipe input
      if (typeof username !== 'string' || typeof password !== 'string') {
        return sendJson(res, 400, { success: false, error: 'Format input tidak valid.' });
      }

      // Cegah username/password terlalu panjang (anti-DoS)
      if (username.length > 64 || password.length > 128) {
        return sendJson(res, 400, { success: false, error: 'Input melebihi batas maksimal.' });
      }

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        recordLoginSuccess(ip);
        const token = generateToken();
        activeTokens.set(token, Date.now() + TOKEN_TTL_MS);
        saveActiveTokens();
        console.info(`[AUTH] Login berhasil dari IP: ${ip} (Persistent 30 Hari)`);
        return sendJson(res, 200, { success: true, token, message: 'Login berhasil!' });
      } else {
        recordLoginFailure(ip);
        const lock = loginLockouts.get(ip) || {};
        const remainingAttempts = Math.max(0, RATE_LIMIT.LOCKOUT_FAILS - (lock.fails || 1));
        console.warn(`[AUTH] Login gagal dari IP: ${ip}`);
        return sendJson(res, 401, {
          success: false,
          error: remainingAttempts > 0
            ? `Username atau password salah. Sisa percobaan: ${remainingAttempts}.`
            : 'Akun dikunci 15 menit karena terlalu banyak percobaan gagal.'
        });
      }
    } catch (err) {
      return sendJson(res, 400, { success: false, error: 'Permintaan tidak valid.' });
    }
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      activeTokens.delete(token);
      saveActiveTokens();
    }
    return sendJson(res, 200, { success: true, message: 'Logout berhasil.' });
  }

  // 0b. AUTH CHECK: GET /api/auth/check
  if (pathname === '/api/auth/check' && method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (isValidToken(token)) {
      return sendJson(res, 200, { success: true, authenticated: true });
    } else {
      return sendJson(res, 401, { success: false, authenticated: false });
    }
  }

  // 1. CMS CONTENT (GET & PUT)
  if (pathname === '/api/cms') {
    if (method === 'GET') {
      const cmsData = readJsonFile(CMS_FILE, {});
      return sendJson(res, 200, { success: true, data: cmsData });
    }
    if (method === 'PUT') {
      if (!requireAuth(req, res)) return;
      try {
        const body = sanitizeDeep(await getRequestBody(req));
        const currentCms = readJsonFile(CMS_FILE, {});
        const updatedCms = { ...currentCms, ...body, updatedAt: new Date().toISOString() };
        writeJsonFile(CMS_FILE, updatedCms);
        return sendJson(res, 200, { success: true, message: 'Konten CMS berhasil diperbarui!', data: updatedCms });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }
  }

  // 2. MENU CATALOG (GET & POST)
  if (pathname === '/api/menu') {
    if (method === 'GET') {
      const menuList = readJsonFile(MENU_FILE, []);
      return sendJson(res, 200, { success: true, count: menuList.length, data: menuList });
    }
    if (method === 'POST') {
      if (!requireAuth(req, res)) return;
      try {
        const newItem = sanitizeDeep(await getRequestBody(req));
        if (!newItem.name || !newItem.category || newItem.price === undefined) {
          return sendJson(res, 400, { success: false, error: 'Field name, category, dan price wajib diisi!' });
        }
        const menuList = readJsonFile(MENU_FILE, []);
        const id = newItem.id || ('m_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4));
        const itemToSave = {
          id,
          name: newItem.name.trim(),
          category: newItem.category,
          categoryName: newItem.categoryName || newItem.category.charAt(0).toUpperCase() + newItem.category.slice(1),
          price: Number(newItem.price) || 0,
          description: (newItem.description || '').trim(),
          badge: (newItem.badge || '').trim(),
          image: newItem.image || 'assets/images/menu-coffee.jpg',
          tags: Array.isArray(newItem.tags) ? newItem.tags : [],
          isAvailable: newItem.isAvailable !== false
        };
        menuList.unshift(itemToSave);
        writeJsonFile(MENU_FILE, menuList);
        return sendJson(res, 201, { success: true, message: 'Menu berhasil ditambahkan!', data: itemToSave });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }
  }

  // 3. MENU BY ID (/api/menu/:id - PUT, DELETE, PATCH availability)
  if (pathname.startsWith('/api/menu/')) {
    const parts = pathname.split('/').filter(Boolean);
    const id = parts[2];

    if (id) {
      // Toggle availability: PATCH /api/menu/:id/availability
      if (parts[3] === 'availability' && method === 'PATCH') {
        if (!requireAuth(req, res)) return;
        const menuList = readJsonFile(MENU_FILE, []);
        const index = menuList.findIndex(m => m.id === id);
        if (index === -1) return sendJson(res, 404, { success: false, error: 'Menu tidak ditemukan' });
        menuList[index].isAvailable = !menuList[index].isAvailable;
        writeJsonFile(MENU_FILE, menuList);
        return sendJson(res, 200, { success: true, isAvailable: menuList[index].isAvailable });
      }

      // Update menu: PUT /api/menu/:id
      if (method === 'PUT') {
        if (!requireAuth(req, res)) return;
        try {
          const body = sanitizeDeep(await getRequestBody(req));
          const menuList = readJsonFile(MENU_FILE, []);
          const index = menuList.findIndex(m => m.id === id);
          if (index === -1) return sendJson(res, 404, { success: false, error: 'Menu tidak ditemukan' });
          
          // Selalu generate categoryName dari category yang baru (fix: category update bug)
          const newCategory = body.category || menuList[index].category;
          const derivedCategoryName = body.categoryName || 
            (newCategory ? newCategory.charAt(0).toUpperCase() + newCategory.slice(1).replace(/-/g, ' ') : newCategory);

          menuList[index] = {
            ...menuList[index],
            ...body,
            id,                                   // protect id
            category: newCategory,                // pastikan category baru tersimpan
            categoryName: derivedCategoryName,    // update categoryName dari category baru
            price: Number(body.price ?? menuList[index].price)
          };
          writeJsonFile(MENU_FILE, menuList);
          return sendJson(res, 200, { success: true, message: 'Menu berhasil diperbarui!', data: menuList[index] });
        } catch (err) {
          return sendJson(res, 400, { success: false, error: err.message });
        }
      }

      // Delete menu: DELETE /api/menu/:id
      if (method === 'DELETE') {
        if (!requireAuth(req, res)) return;
        const menuList = readJsonFile(MENU_FILE, []);
        const filtered = menuList.filter(m => m.id !== id);
        if (filtered.length === menuList.length) {
          return sendJson(res, 404, { success: false, error: 'Menu tidak ditemukan' });
        }
        writeJsonFile(MENU_FILE, filtered);
        return sendJson(res, 200, { success: true, message: 'Menu berhasil dihapus!' });
      }
    }
  }

  // 4. IMAGE / MEDIA UPLOAD: POST /api/upload
  if (pathname === '/api/upload' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    try {
      const body = await getRequestBody(req);
      const { dataUrl, fileName } = body;
      if (!dataUrl) {
        return sendJson(res, 400, { success: false, error: 'dataUrl base64 wajib dikirimkan!' });
      }

      // Extract base64
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return sendJson(res, 400, { success: false, error: 'Format base64 image tidak valid!' });
      }

      const mime = matches[1];
      const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
      if (!allowedMimeTypes.has(mime.toLowerCase())) {
        return sendJson(res, 415, { success: false, error: 'Format gambar harus JPG, PNG, atau WEBP.' });
      }
      const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
        return sendJson(res, 413, { success: false, error: 'Ukuran gambar maksimal 8 MB.' });
      }

      const safeName = (fileName ? fileName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'img')
        + '_' + Date.now() + '.' + ext;
      const targetFilePath = path.join(UPLOADS_DIR, safeName);

      fs.writeFileSync(targetFilePath, buffer);
      const publicUrl = `assets/uploads/${safeName}`;

      return sendJson(res, 200, {
        success: true,
        message: 'Gambar berhasil diunggah!',
        url: publicUrl,
        sizeBytes: buffer.length
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 5. MEDIA LIST: GET /api/media
  if (pathname === '/api/media' && method === 'GET') {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const mediaList = files
        .filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
        .map(file => {
          const stat = fs.statSync(path.join(UPLOADS_DIR, file));
          return {
            fileName: file,
            url: `assets/uploads/${file}`,
            sizeBytes: stat.size,
            uploadedAt: stat.mtime
          };
        })
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      return sendJson(res, 200, { success: true, count: mediaList.length, data: mediaList });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 6. BACKUP & RESTORE
  if (pathname === '/api/backup' && method === 'GET') {
    if (!requireAuth(req, res)) return;
    const cms = readJsonFile(CMS_FILE, {});
    const menu = readJsonFile(MENU_FILE, []);
    return sendJson(res, 200, {
      success: true,
      site: 'BITTS Coffee CMS Backup',
      exportedAt: new Date().toISOString(),
      data: { cms, menu }
    });
  }

  if (pathname === '/api/restore' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    try {
      const body = await getRequestBody(req);
      if (body.data) {
        if (body.data.cms) writeJsonFile(CMS_FILE, body.data.cms);
        if (body.data.menu) writeJsonFile(MENU_FILE, body.data.menu);
      } else {
        if (body.cms) writeJsonFile(CMS_FILE, body.cms);
        if (body.menu) writeJsonFile(MENU_FILE, body.menu);
      }
      return sendJson(res, 200, { success: true, message: 'Data cadangan berhasil dipulihkan!' });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // 7. FACTORY RESET
  if (pathname === '/api/reset' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    return sendJson(res, 200, { success: true, message: 'Data dikembalikan ke pengaturan default!' });
  }

  // ══════════════════════════════════════════════════════
  // STATIC FILE SERVER & CLEAN URL ALIASES
  // ══════════════════════════════════════════════════════
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin.html';
  if (reqPath === '/login' || reqPath === '/login/' || reqPath === '/masuk') reqPath = '/admin-login.html';

  let filePath;
  try {
    const decodedPath = decodeURIComponent(reqPath);
    const candidatePath = path.resolve(__dirname, `.${decodedPath}`);
    const rootPath = path.resolve(__dirname) + path.sep;
    if (candidatePath !== path.resolve(__dirname) && !candidatePath.startsWith(rootPath)) {
      res.writeHead(403);
      return res.end('403 Forbidden');
    }
    filePath = candidatePath;
    const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    const isSensitivePath = relativePath === '.env'
      || relativePath === 'data/sessions.json'
      || relativePath === '.git'
      || relativePath.startsWith('.git/');
    if (isSensitivePath) {
      res.writeHead(403);
      return res.end('403 Forbidden');
    }
  } catch {
    res.writeHead(400);
    return res.end('400 Bad Request');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      applySecurityHeaders(res, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Security headers untuk semua static file (HTML, CSS, JS, gambar, dll)
    applySecurityHeaders(res, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.writeHead(200);
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (streamErr) => {
      console.error('[FILE STREAM ERROR]', streamErr.message);
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    });
    res.on('error', () => {
      fileStream.destroy();
    });
    fileStream.pipe(res);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

server.listen(PORT, () => {
  console.log(`[BITTS Coffee Engine] Server & CMS REST API aktif di http://localhost:${PORT}`);
});
