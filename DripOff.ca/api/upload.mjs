import {randomUUID} from 'node:crypto';
import {json, isSameOrigin, isAuthenticated, supabaseConfigured, SUPABASE_URL} from '../lib/server.mjs';

const extensions = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const maxBytes = 4 * 1024 * 1024;

async function handler(request) {
  if (!['POST','DELETE'].includes(request.method)) return json({error:'Method not allowed.'}, 405, {'Allow':'POST, DELETE'});
  if (!isAuthenticated(request)) return json({error:'Sign in required.'}, 401);
  if (!isSameOrigin(request)) return json({error:'Request origin was rejected.'}, 403);
  if (!supabaseConfigured()) return json({error:'Catalog storage is not configured yet.'}, 503);
  if (request.method === 'DELETE') {
    const path = new URL(request.url).searchParams.get('path');
    if (!/^(products|brand-logos)\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(path || '')) return json({error:'Invalid photo path.'}, 400);
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/catalog-images`, {
      method:'DELETE', headers:{apikey:process.env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'}, body:JSON.stringify({prefixes:[path]})
    });
    if (!response.ok) return json({error:'Photo removal failed.'}, response.status >= 500 ? 502 : 400);
    return json({ok:true});
  }
  const folder = new URL(request.url).searchParams.get('folder');
  const type = request.headers.get('content-type')?.split(';')[0];
  if (!['products','brand-logos'].includes(folder) || !extensions[type]) return json({error:'Choose a supported image.'}, 400);
  if (Number(request.headers.get('content-length') || 0) > maxBytes) return json({error:'Image must be under 4 MB.'}, 413);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > maxBytes) return json({error:'Image must be under 4 MB.'}, 413);
  const path = `${folder}/${randomUUID()}.${extensions[type]}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/catalog-images/${path}`, {
    method:'POST', headers:{apikey:process.env.SUPABASE_SECRET_KEY,'Content-Type':type,'x-upsert':'false'}, body:bytes
  });
  if (!response.ok) return json({error:'Photo upload failed.'}, response.status >= 500 ? 502 : 400);
  return json({url:`${SUPABASE_URL}/storage/v1/object/public/catalog-images/${path}`});
}

export default {fetch:handler};
