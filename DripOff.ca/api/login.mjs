import {json, isSameOrigin, safeEqual, sessionConfigured, createSessionCookie, clearSessionCookie, isAuthenticated, readJson, handleError} from '../lib/server.mjs';

async function handler(request) {
  if (request.method === 'GET') return json({authenticated:isAuthenticated(request)});
  if (!isSameOrigin(request)) return json({error:'Request origin was rejected.'}, 403);
  if (request.method === 'DELETE') return json({authenticated:false}, 200, {'Set-Cookie':clearSessionCookie()});
  if (request.method !== 'POST') return json({error:'Method not allowed.'}, 405, {'Allow':'GET, POST, DELETE'});
  if (!sessionConfigured()) return json({error:'Seller access is not configured yet.'}, 503);
  try {
    const {code} = await readJson(request, 1024);
    if (typeof code !== 'string' || !safeEqual(code, process.env.ADMIN_CODE)) {
      return json({error:'Incorrect access code.'}, 401);
    }
    return json({authenticated:true}, 200, {'Set-Cookie':createSessionCookie()});
  } catch (error) { return handleError(error); }
}

export default {fetch:handler};
