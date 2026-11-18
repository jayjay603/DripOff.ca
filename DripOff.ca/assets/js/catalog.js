const LOGOS = {
  "amiri": "assets/images/logos/amiri.png",
  "balenciaga": "assets/images/logos/balenciaga.png",
  "bape": "assets/images/logos/bape.png",
  "burberry": "assets/images/logos/burberry.png",
  "chrome-hearts": "assets/images/logos/chrome-hearts.png",
  "coach": "assets/images/logos/coach.jpg",
  "dior": "assets/images/logos/dior.png",
  "essentials": "assets/images/logos/essentials.png",
  "gallery-dept": "assets/images/logos/gallery-dept.jpg",
  "goyard": "assets/images/logos/goyard.png",
  "gucci": "assets/images/logos/gucci.png",
  "hermes": "assets/images/logos/hermes.png",
  "louis-vuitton": "assets/images/logos/louis-vuitton.png",
  "moncler": "assets/images/logos/moncler.png",
  "moose-knuckles": "assets/images/logos/moose-knuckles.png",
  "ralph-lauren": "assets/images/logos/ralph-lauren.png",
  "sp5der": "assets/images/logos/sp5der.png",
  "trapstar": "assets/images/logos/trapstar.png",
  "saint-laurent": "assets/images/logos/saint-laurent.png"
};
const BRAND_NAMES = ['Amiri','Balenciaga','Bape','Burberry','Chrome Hearts','Coach','Dior','Essentials','Gallery Dept','Goyard','Gucci','Hermès','Louis Vuitton','Moncler','Moose Knuckles','Ralph Lauren','Sp5der','Trapstar','Saint Laurent'];
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const range = (a, z, step = 1) => Array.from({length: (z - a) / step + 1}, (_, i) => a + i * step);
const BUILT_IN_CATEGORIES = [
  {key:'shoes',   label:'Shoes',   single:'Shoe',   unit:'Size (EUR)', sizes: range(35, 45)},
  {key:'hoodies', label:'Hoodies', single:'Hoodie', unit:'Size',       sizes: ['S','M','L','XL']},
  {key:'shirts',  label:'Shirts',  single:'Shirt',  unit:'Size',       sizes: ['S','M','L','XL']},
  {key:'belts',   label:'Belts',   single:'Belt',   unit:'Length (cm)', sizes: range(95, 140, 5).map(n => n + ' cm')},
  {key:'pants',   label:'Pants',   single:'Pants',  unit:'Size',       sizes: ['S','M','L','XL']}
];
let CATEGORIES = [...BUILT_IN_CATEGORIES];
let PRODUCTS = [];
let catalogError = false;
const productsFor = (brand, category) => PRODUCTS.filter(p => p.published === true && p.brand === brand && (!category || p.category === category)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name));
let BRANDS = BRAND_NAMES.map(name => ({id:slug(name), name}));
const $ = id => document.getElementById(id);
let current = null, currentCat = CATEGORIES[0].key, sel = null, gallery = null, sizeView = null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function imgBlock(src, label) { return `<div class="ph">${esc(label)}</div><img src="${esc(src)}" alt="" loading="lazy" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">`; }
const firstImage = p => p.colorways?.[0]?.images?.[0] || '';
function goHome() {
  current = null; closeModal();
  $('app').innerHTML = `<section class="hero"><h1>Drip<br>or drown.</h1><p>Pick a label to browse what is in the catalog.</p></section><div class="search"><input id="search" type="search" placeholder="Search a brand…" aria-label="Search a brand" autocomplete="off"></div><section class="logos" id="brandGrid"></section>`;
  $('search').addEventListener('input', e => renderBrandTiles(e.target.value));
  renderBrandTiles(''); window.scrollTo(0, 0);
}
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function renderBrandTiles(q) {
  const n = norm(q.trim());
  const tiles = BRANDS.map((b, i) => ({b, i})).filter(({b}) => productsFor(b.id).length && norm(b.name).includes(n));
  $('brandGrid').innerHTML = tiles.length
    ? tiles.map(({b, i}) => `<button type="button" class="logo-card" onclick="openBrand(${i})" aria-label="${esc(b.name)}" title="${esc(b.name)}">${b.logoUrl || LOGOS[b.id] ? `<img src="${esc(b.logoUrl || LOGOS[b.id])}" alt="${esc(b.name)}" loading="lazy">` : `<span class="brand-name-tile">${esc(b.name)}</span>`}</button>`).join('')
    : `<p class="empty" style="grid-column:1/-1">${catalogError ? 'Catalog unavailable right now.' : n ? 'No brand found.' : 'Products are being added. Check back soon.'}</p>`;
}
function openBrand(i) { current = BRANDS[i]; currentCat = categoriesFor(current.id)[0]?.key || ''; renderBrand(); window.scrollTo(0, 0); }
const categoriesFor = brand => CATEGORIES.filter(category => productsFor(brand, category.key).length);
const itemHTML = (p, i) => `<button type="button" class="item" onclick="openItem(${i})"><div class="thumb">${firstImage(p) ? imgBlock(firstImage(p), p.name) : `<div class="ph">${esc(p.name)}</div>`}</div><div class="meta"><span>${esc(p.name)}</span></div></button>`;
function renderBrand() {
  const b = current, cats = categoriesFor(b.id);
  if (!cats.some(c => c.key === currentCat)) currentCat = cats[0]?.key || '';
  const cat = cats.find(c => c.key === currentCat);
  const items = cat ? productsFor(b.id, cat.key) : [];
  $('app').innerHTML = `<div class="page-head"><button class="back" onclick="goHome()">Back</button><h2>${esc(b.name)}</h2></div>${cats.length ? `<div class="tabs" role="tablist">${cats.map(c => `<button type="button" class="tab" role="tab" aria-selected="${c.key === currentCat}" onclick="setCat('${esc(c.key)}')">${esc(c.label)}</button>`).join('')}</div><div class="grid">${items.length ? items.map(itemHTML).join('') : '<p class="empty">No saved products in this category yet.</p>'}</div>` : '<p class="empty">No saved products for this brand yet.</p>'}`;
}
function setCat(k) { currentCat = k; renderBrand(); window.scrollTo(0, 0); }
function inquiryDetails() {
  const color = gallery?.getSelection().colorway?.name;
  return [sel.product.name, color && `Color: ${color}`, sel.size && `Size: ${sel.size}`].filter(Boolean).join(' | ');
}
function openItem(i) {
  const p = productsFor(current.id, currentCat)[i]; if (!p) return;
  sel = {product: p, size: null, cat: CATEGORIES.find(c => c.key === currentCat)};
  $('mTitle').textContent = p.name;
  $('mSizeLabel').textContent = sel.cat?.unit || 'Size';
  gallery?.destroy();
  gallery = Colorways.mountGallery($('mGallery'), p);
  sizeView?.destroy();
  sizeView = Sizes.mountView($('mSizes'), p, {label: sel.cat?.unit || 'Available sizes', onChange: size => { sel.size = size; }});
  $('mHint').textContent = p.sizes?.length ? 'Choose an available size, then message for details.' : 'Message for availability.';
  $('modal').classList.add('open'); $('modal').querySelector('.close').focus({preventScroll: true});
}
function closeModal() { $('modal').classList.remove('open'); }
$('copyDetails').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(inquiryDetails()); toast('Product details copied'); }
  catch { toast('Could not copy details'); }
});
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); }
async function loadCatalog() {
  try {
    const [data, addedBrands, addedCategories] = await Promise.all([CatalogStore.listProducts(true), CatalogStore.listBrands(), CatalogStore.listCategories()]);
    PRODUCTS = data;
    BRANDS = [...BRAND_NAMES.map(name => ({id:slug(name), name})), ...addedBrands];
    CATEGORIES = [...BUILT_IN_CATEGORIES, ...addedCategories.map(category => ({key:category.id,label:category.name,unit:'Size',sizes:[]}))];
    catalogError = false;
    renderBrandTiles($('search')?.value || '');
  } catch (error) {
    PRODUCTS = [];
    catalogError = true;
    renderBrandTiles($('search')?.value || '');
  }
}
goHome(); loadCatalog();
