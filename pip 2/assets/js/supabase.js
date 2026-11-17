/* The publishable key is public. Only the server function holds the secret key. */
window.CatalogStore = (() => {
  const url = 'https://wzcxekpdogqkylhhhmdh.supabase.co';
  const key = 'sb_publishable_Y8Wxvy94tQbf2TOvfw3XfA_c9a3o2r5';
  const imageTypes = new Set(['image/jpeg','image/png','image/webp','image/gif']);
  let sessionPossible = true;

  async function readResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.message || data.msg || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function publicRequest(path) {
    return readResponse(await fetch(url + path, {headers:{apikey:key}}));
  }

  async function adminRequest(path, {method='GET', body} = {}) {
    return readResponse(await fetch(path, {
      method,
      credentials:'same-origin',
      headers: body instanceof Blob ? {'Content-Type':body.type} : body ? {'Content-Type':'application/json'} : {},
      body: body instanceof Blob ? body : body ? JSON.stringify(body) : undefined
    }));
  }

  async function signIn(code) {
    await adminRequest('/api/login', {method:'POST',body:{code}});
    sessionPossible = true;
  }

  async function ensureEditor() {
    const result = await adminRequest('/api/login');
    if (!result.authenticated) throw Object.assign(new Error('Sign in required.'), {status:401});
    sessionPossible = true;
  }

  async function signOut() {
    try { await adminRequest('/api/login', {method:'DELETE'}); }
    finally { sessionPossible = false; }
  }

  const productFromRow = row => ({id:row.id,brand:row.brand,category:row.category,name:row.name,published:row.published,sortOrder:row.sortOrder,sizes:row.sizes||[],colorways:row.colorways||[]});
  async function listProducts(publishedOnly = false) {
    if (publishedOnly) return (await publicRequest('/rest/v1/catalog_products?select=*&published=eq.true&order=sort_order.asc,updated_at.asc')).map(row => productFromRow({...row,sortOrder:row.sort_order}));
    return adminRequest('/api/catalog');
  }
  function saveProduct(product, id = null) { return adminRequest('/api/catalog', {method:'POST',body:{action:'saveProduct',product,id}}); }
  function deleteProduct(id) { return adminRequest('/api/catalog', {method:'POST',body:{action:'deleteProduct',id}}); }
  async function listBrands() { return (await publicRequest('/rest/v1/catalog_brands?select=id,name,logo_url&order=name.asc')).map(row=>({id:row.id,name:row.name,logoUrl:row.logo_url})); }
  function addBrand(name, logoUrl = null) { return adminRequest('/api/catalog', {method:'POST',body:{action:'addBrand',name,logoUrl}}); }
  async function listCategories() { return (await publicRequest('/rest/v1/catalog_categories?select=id,name&order=name.asc')).map(row=>({id:row.id,name:row.name})); }
  function addCategory(name) { return adminRequest('/api/catalog', {method:'POST',body:{action:'addCategory',name}}); }

  async function uploadImage(file, folder) {
    if (!imageTypes.has(file.type) || file.size > 4 * 1024 * 1024) throw new Error('Choose a JPG, PNG, WEBP or GIF under 4 MB.');
    const result = await adminRequest(`/api/upload?folder=${encodeURIComponent(folder)}`, {method:'POST',body:file});
    return result.url;
  }

  return {hasSession:()=>sessionPossible,clearSession:()=>{sessionPossible=false;},signIn,signOut,ensureEditor,listProducts,saveProduct,deleteProduct,listBrands,addBrand,listCategories,addCategory,uploadImage};
})();
