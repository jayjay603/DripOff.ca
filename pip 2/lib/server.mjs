import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wzcxekpdogqkylhhhmdh.supabase.co';
const COOKIE_NAME = '__Host-dripoff_session';
const SESSION_SECONDS = 12 * 60 * 60;

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {status, headers: {'Cache-Control':'no-store', ...headers}});
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function signature(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
}

export function sessionConfigured() {
  return !!(process.env.ADMIN_CODE && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

export function createSessionCookie() {
  const value = Buffer.from(JSON.stringify({exp:Date.now() + SESSION_SECONDS * 1000, nonce:randomBytes(16).toString('base64url')})).toString('base64url');
  return `${COOKIE_NAME}=${value}.${signature(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthenticated(request) {
  if (!sessionConfigured()) return false;
  const raw = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return false;
  const value = raw.slice(0, dot);
  if (!safeEqual(raw.slice(dot + 1), signature(value))) return false;
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString());
    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch { return false; }
}

export function supabaseConfigured() {
  return !!process.env.SUPABASE_SECRET_KEY;
}

export async function supabase(path, {method='GET', body, headers={}} = {}) {
  if (!supabaseConfigured()) throw Object.assign(new Error('Catalog storage is not configured yet.'), {status:503});
  const response = await fetch(SUPABASE_URL + path, {
    method,
    headers: {apikey:process.env.SUPABASE_SECRET_KEY, ...headers, ...(body && !(body instanceof ArrayBuffer) ? {'Content-Type':'application/json'} : {})},
    body: body && !(body instanceof ArrayBuffer) ? JSON.stringify(body) : body
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || data.error || 'Catalog request failed.'), {status:response.status});
  return data;
}

export async function readJson(request, maxBytes = 65536) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Object.assign(new Error('Expected JSON.'), {status:415});
  if (Number(request.headers.get('content-length') || 0) > maxBytes) throw Object.assign(new Error('Request is too large.'), {status:413});
  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) throw Object.assign(new Error('Request is too large.'), {status:413});
  try { return JSON.parse(text); }
  catch { throw Object.assign(new Error('Invalid JSON.'), {status:400}); }
}

export function handleError(error) {
  return json({error:error.status && error.status < 500 ? error.message : 'Server unavailable.'}, error.status || 500);
}
