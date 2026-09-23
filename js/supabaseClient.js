import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DEFAULT_MENU } from './menuManager.js';

const SUPABASE_URL = 'https://cppjonqvolackeqzneqm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PhlqeKhvvKzl_fh2gWF5bQ_rN3t8VNz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function toMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryName: row.category_name,
    price: row.price,
    description: row.description || '',
    badge: row.badge || '',
    image: row.image_url || 'assets/images/menu-coffee.jpg',
    tags: Array.isArray(row.tags) ? row.tags : [],
    isAvailable: row.is_available !== false
  };
}

async function loadLocalMenuBackup() {
  try {
    const response = await fetch('data/menu.json', { cache: 'no-store' });
    if (!response.ok) return [];
    const items = await response.json();
    return Array.isArray(items) ? items : [];
  } catch (_) {
    return [];
  }
}

async function loadLocalCmsBackup() {
  try {
    const response = await fetch('data/cms.json', { cache: 'no-store' });
    if (!response.ok) return {};
    const cms = await response.json();
    return cms && typeof cms === 'object' ? cms : {};
  } catch (_) {
    return {};
  }
}

function isDefaultMenu(items) {
  const defaultNames = new Set(DEFAULT_MENU.map(item => item.name));
  return items.length > 0 && items.every(item => defaultNames.has(item.name));
}

function response(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() { return payload; }
  };
}

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const path = new URL(url, window.location.origin).pathname;

  if (path === '/api/auth/check') {
    const user = await requireUser();
    return response(user ? 200 : 401, { success: !!user, authenticated: !!user });
  }

  if (path === '/api/login') {
    const { username, password } = body || {};
    const email = username.includes('@') ? username : username;
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return response(401, { success: false, error: result.error.message });
    return response(200, { success: true, token: result.data.session?.access_token });
  }

  if (path === '/api/logout') {
    await supabase.auth.signOut();
    return response(200, { success: true });
  }

  if (path === '/api/menu' && method === 'GET') {
    const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (error) return response(500, { success: false, error: error.message });
    const databaseItems = data.map(toMenuItem);
    const localItems = await loadLocalMenuBackup();
    const databaseNames = new Set(databaseItems.map(item => item.name));
    const hasMissingLocalItems = localItems.some(item => !databaseNames.has(item.name));
    const shouldUseLocalBackup = !options.preferDatabase
      && localItems.length > 0
      && (databaseItems.length === 0 || isDefaultMenu(databaseItems) || hasMissingLocalItems);
    const menuItems = shouldUseLocalBackup ? localItems : databaseItems;
    return response(200, {
      success: true,
      count: menuItems.length,
      data: menuItems.length > 0 ? menuItems : DEFAULT_MENU,
      source: shouldUseLocalBackup ? 'local-backup' : 'supabase',
      removeDefault: isDefaultMenu(databaseItems)
    });
  }

  if (path === '/api/menu' && method === 'POST') {
    const item = body || {};
    const row = {
      name: item.name,
      category: item.category,
      category_name: item.categoryName || item.category,
      price: Number(item.price) || 0,
      description: item.description || '',
      badge: item.badge || '',
      image_url: item.image || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      is_available: item.isAvailable !== false
    };
    const { data: existing } = await supabase.from('menu_items').select('id').eq('name', row.name).maybeSingle();
    const query = existing?.id
      ? supabase.from('menu_items').update(row).eq('id', existing.id).select().single()
      : supabase.from('menu_items').insert(row).select().single();
    const { data, error } = await query;
    if (error) return response(400, { success: false, error: error.message });
    return response(201, { success: true, data: toMenuItem(data) });
  }

  const menuMatch = path.match(/^\/api\/menu\/([^/]+)(?:\/availability)?$/);
  if (menuMatch) {
    const id = menuMatch[1];
    if (path.endsWith('/availability') && method === 'PATCH') {
      const { data: current, error: readError } = await supabase.from('menu_items').select('is_available').eq('id', id).single();
      if (readError) return response(404, { success: false, error: readError.message });
      const { error } = await supabase.from('menu_items').update({ is_available: !current.is_available }).eq('id', id);
      if (error) return response(400, { success: false, error: error.message });
      return response(200, { success: true, isAvailable: !current.is_available });
    }
    if (method === 'PUT') {
      const item = body || {};
      const update = {
        name: item.name,
        category: item.category,
        category_name: item.categoryName || item.category,
        price: Number(item.price) || 0,
        description: item.description || '',
        badge: item.badge || '',
        image_url: item.image || null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        is_available: item.isAvailable !== false
      };
      const { data, error } = await supabase.from('menu_items').update(update).eq('id', id).select().single();
      if (error) return response(400, { success: false, error: error.message });
      return response(200, { success: true, data: toMenuItem(data) });
    }
    if (method === 'DELETE') {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) return response(400, { success: false, error: error.message });
      return response(200, { success: true });
    }
  }

  if (path === '/api/cms' && method === 'GET') {
    const { data, error } = await supabase.from('site_content').select('content').eq('id', 'main').maybeSingle();
    if (error) return response(500, { success: false, error: error.message });
    if (data?.content && Object.keys(data.content).length > 0) {
      return response(200, { success: true, data: data.content, source: 'supabase' });
    }
    return response(200, { success: true, data: await loadLocalCmsBackup(), source: 'local-backup' });
  }

  if (path === '/api/cms' && method === 'PUT') {
    const { data: existing } = await supabase.from('site_content').select('content').eq('id', 'main').maybeSingle();
    const mergedContent = { ...(existing?.content || {}), ...(body || {}) };
    const { data, error } = await supabase.from('site_content').upsert({ id: 'main', content: mergedContent, updated_at: new Date().toISOString() }).select().single();
    if (error) return response(400, { success: false, error: error.message });
    return response(200, { success: true, data: data.content });
  }

  if (path === '/api/upload' && method === 'POST') {
    const dataUrl = body?.dataUrl || '';
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
    if (!match) return response(415, { success: false, error: 'Format gambar harus JPG, PNG, atau WEBP.' });
    const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0));
    if (bytes.length > 8 * 1024 * 1024) return response(413, { success: false, error: 'Ukuran gambar maksimal 8 MB.' });
    const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
    const filePath = `menu/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('menu-images').upload(filePath, new Blob([bytes], { type: match[1] }), { upsert: false });
    if (error) return response(400, { success: false, error: error.message });
    const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);
    return response(200, { success: true, url: data.publicUrl });
  }

  if (path === '/api/backup' && method === 'GET') {
    const [{ data: cms }, { data: menu }] = await Promise.all([
      supabase.from('site_content').select('content').eq('id', 'main').maybeSingle(),
      supabase.from('menu_items').select('*').order('created_at', { ascending: false })
    ]);
    return response(200, {
      success: true,
      site: 'BITTS Coffee Supabase Backup',
      exportedAt: new Date().toISOString(),
      data: { cms: cms?.content || {}, menu: (menu || []).map(toMenuItem) }
    });
  }

  if (path === '/api/restore' && method === 'POST') {
    const backup = body?.data || body || {};
    if (backup.cms && typeof backup.cms === 'object') {
      const { error } = await supabase.from('site_content').upsert({ id: 'main', content: backup.cms, updated_at: new Date().toISOString() });
      if (error) return response(400, { success: false, error: error.message });
    }
    if (Array.isArray(backup.menu)) {
      const rows = backup.menu.map(item => ({
        ...(typeof item.id === 'string' && /^[0-9a-f-]{36}$/i.test(item.id) ? { id: item.id } : {}),
        name: item.name,
        category: item.category,
        category_name: item.categoryName || item.category,
        price: Number(item.price) || 0,
        description: item.description || '',
        badge: item.badge || '',
        image_url: item.image || null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        is_available: item.isAvailable !== false
      }));
      const { error } = await supabase.from('menu_items').upsert(rows);
      if (error) return response(400, { success: false, error: error.message });
    }
    return response(200, { success: true, message: 'Data berhasil dipulihkan.' });
  }

  return response(404, { success: false, error: `Route Supabase tidak ditemukan: ${method} ${path}` });
}

export { requireUser };