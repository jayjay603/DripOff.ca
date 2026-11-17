import {json, isSameOrigin, isAuthenticated, readJson, supabase, handleError, SUPABASE_URL} from '../lib/server.mjs';

const imagePrefix = `${SUPABASE_URL}/storage/v1/object/public/catalog-images/`;
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rowToProduct = row => ({id:row.id,brand:row.brand,category:row.category,name:row.name,published:row.published,sortOrder:row.sort_order,sizes:row.sizes||[],colorways:row.colorways||[]});
const invalid = message => { throw Object.assign(new Error(message), {status:400}); };
const isSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isImageUrl = value => typeof value === 'string' && value.startsWith(imagePrefix) && !/[?#]/.test(value.slice(imagePrefix.length)) && value.length <= 500;

function productRow(product, creating) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) invalid('Invalid product.');
  const allowed = new Set(['brand','category','name','published','sortOrder','sizes','colorways']);
  if (Object.keys(product).some(key => !allowed.has(key))) invalid('Invalid product field.');
  if (creating && ['brand','category','name','published','sortOrder','sizes','colorways'].some(key => !(key in product))) invalid('Product details are missing.');
  const row = {};
  if ('brand' in product) { if (!isSlug(product.brand)) invalid('Invalid brand.'); row.brand = product.brand; }
  if ('category' in product) { if (!isSlug(product.category)) invalid('Invalid category.'); row.category = product.category; }
  if ('name' in product) { if (typeof product.name !== 'string' || !product.name.trim() || product.name.length > 120) invalid('Invalid product name.'); row.name = product.name.trim(); }
  if ('published' in product) { if (typeof product.published !== 'boolean') invalid('Invalid visibility.'); row.published = product.published; }
  if ('sortOrder' in product) { if (!Number.isInteger(product.sortOrder) || product.sortOrder < 0) invalid('Invalid product order.'); row.sort_order = product.sortOrder; }
  if ('sizes' in product) {
    if (!Array.isArray(product.sizes) || product.sizes.length > 50 || product.sizes.some(size => typeof size !== 'string' || !size || size.length > 30)) invalid('Invalid sizes.');
    row.sizes = product.sizes;
  }
  if ('colorways' in product) {
    if (!Array.isArray(product.colorways) || product.colorways.length > 30) invalid('Invalid colorways.');
    row.colorways = product.colorways.map(colorway => {
      if (!colorway || typeof colorway !== 'object' || typeof colorway.id !== 'string' || colorway.id.length > 100 || typeof colorway.name !== 'string' || colorway.name.length > 60 || !Array.isArray(colorway.images) || colorway.images.length > 30 || colorway.images.some(url => !isImageUrl(url))) invalid('Invalid colorway photos.');
      return {id:colorway.id,name:colorway.name,images:colorway.images};
    });
  }
  if (!Object.keys(row).length) invalid('No product changes supplied.');
  return row;
}

async function handler(request) {
  if (!isAuthenticated(request)) return json({error:'Sign in required.'}, 401);
  if (request.method === 'GET') {
    try {
      const rows = await supabase('/rest/v1/catalog_products?select=*&order=sort_order.asc,updated_at.asc');
      return json(rows.map(rowToProduct));
    } catch (error) { return handleError(error); }
  }
  if (request.method !== 'POST') return json({error:'Method not allowed.'}, 405, {'Allow':'GET, POST'});
  if (!isSameOrigin(request)) return json({error:'Request origin was rejected.'}, 403);
  try {
    const input = await readJson(request);
    if (input.action === 'saveProduct') {
      const id = input.id;
      if (id != null && !isUuid(id)) invalid('Invalid product ID.');
      const row = productRow(input.product, id == null);
      const rows = await supabase(id ? `/rest/v1/catalog_products?id=eq.${id}` : '/rest/v1/catalog_products', {method:id ? 'PATCH':'POST',headers:{Prefer:'return=representation'},body:row});
      if (!rows?.length) throw Object.assign(new Error('Product was not saved.'), {status:404});
      return json(rowToProduct(rows[0]));
    }
    if (input.action === 'deleteProduct') {
      if (!isUuid(input.id)) invalid('Invalid product ID.');
      await supabase(`/rest/v1/catalog_products?id=eq.${input.id}`, {method:'DELETE',headers:{Prefer:'return=minimal'}});
      return json({ok:true});
    }
    if (input.action === 'deleteBrand' || input.action === 'deleteCategory') {
      if (!isSlug(input.id)) invalid('Invalid ID.');
      const table = input.action === 'deleteBrand' ? 'catalog_brands' : 'catalog_categories';
      const linked = await supabase(`/rest/v1/catalog_products?select=id&${input.action === 'deleteBrand' ? 'brand' : 'category'}=eq.${input.id}&limit=1`);
      if (linked.length) invalid('Remove products in this group first.');
      await supabase(`/rest/v1/${table}?id=eq.${input.id}`, {method:'DELETE',headers:{Prefer:'return=minimal'}});
      return json({ok:true});
    }
    if (input.action === 'addBrand' || input.action === 'addCategory') {
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > (input.action === 'addBrand' ? 80 : 60)) invalid('Invalid name.');
      const name = input.name.trim();
      const id = slug(name);
      if (!isSlug(id)) invalid('Use a name with letters or numbers.');
      if (input.action === 'addBrand') {
        if (input.logoUrl != null && !isImageUrl(input.logoUrl)) invalid('Invalid logo.');
        const rows = await supabase('/rest/v1/catalog_brands', {method:'POST',headers:{Prefer:'return=representation'},body:{id,name,logo_url:input.logoUrl || null}});
        return json({id:rows[0].id,name:rows[0].name,logoUrl:rows[0].logo_url});
      }
      const rows = await supabase('/rest/v1/catalog_categories', {method:'POST',headers:{Prefer:'return=representation'},body:{id,name}});
      return json({id:rows[0].id,name:rows[0].name});
    }
    invalid('Unknown catalog action.');
  } catch (error) { return handleError(error); }
}

export default {fetch:handler};
