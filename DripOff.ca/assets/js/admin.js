(() => {
  const BUILT_IN_BRANDS = ['Amiri','Balenciaga','Bape','Burberry','Chrome Hearts','Coach','Dior','Essentials','Gallery Dept','Goyard','Gucci','Hermès','Louis Vuitton','Moncler','Moose Knuckles','Ralph Lauren','Sp5der','Trapstar','Saint Laurent'];
  let BRANDS = [...BUILT_IN_BRANDS];
  const BUILT_IN_CATEGORIES = [{key:'shoes',label:'Shoes'},{key:'hoodies',label:'Hoodies'},{key:'shirts',label:'Shirts'},{key:'belts',label:'Belts'},{key:'pants',label:'Pants'}];
  let CATEGORIES = [...BUILT_IN_CATEGORIES];
  const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = { products: [], editingId: null, colorways: [], busy: false, uploads: 0 };

  function setSignedIn(value){$('signInView').hidden=value;$('adminView').hidden=!value;$('signOut').hidden=!value;}
  function clearAuth(){CatalogStore.clearSession();state.products=[];render();setSignedIn(false);}
  function notice(message, error = false) { const el=$('notice'); el.textContent=message; el.classList.toggle('error',error); }
  function categoryLabel(key) { return CATEGORIES.find(c=>c.key===key)?.label || key; }
  function syncPicker(id) {
    const select=$(id), picker=$(id+'Picker'), menu=$(id+'Menu');
    const selected=select.selectedOptions[0] || select.options[0];
    if(selected && !select.value)select.value=selected.value;
    picker.querySelector('.picker-value').textContent=selected?.textContent || 'Choose one';
    menu.innerHTML=[...select.options].map(option=>`<button class="picker-option" type="button" role="option" data-value="${esc(option.value)}" aria-selected="${option.value===select.value}">${esc(option.textContent)}</button>`).join('');
  }
  function closePickers() {
    document.querySelectorAll('.picker').forEach(picker=>{picker.querySelector('.picker-menu').hidden=true;picker.querySelector('.picker-trigger').setAttribute('aria-expanded','false');});
  }
  function openPicker(picker, focus=false) {
    closePickers();
    const menu=picker.querySelector('.picker-menu');menu.hidden=false;
    picker.querySelector('.picker-trigger').setAttribute('aria-expanded','true');
    if(focus)(menu.querySelector('[aria-selected="true"]')||menu.querySelector('.picker-option'))?.focus();
  }
  function render() {
    const list=$('productList');
    if (!state.products.length) { list.innerHTML='<div class="empty-state"><div class="empty-icon">＋</div><h2>Your catalog starts here</h2><p>Add a product and its photos to get started.</p><button class="primary" type="button" data-action="create">Add your first product</button></div>'; return; }
    list.innerHTML=state.products.slice().sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)).map((p,i)=>{
      const image=p.colorways?.flatMap(c=>c.images||[])[0];
      return `<article class="product-row ${p.published?'':'is-hidden'}" data-id="${esc(p.id)}">
        <div class="product-image">${image?`<img src="${esc(image)}" alt="" loading="lazy">`:'<span>No photo</span>'}</div>
        <div class="product-copy"><div class="product-title"><h2>${esc(p.name)}</h2><span class="status ${p.published?'live':''}">${p.published?'Visible':'Hidden'}</span></div><p>${esc(BRANDS.find(b=>slug(b)===p.brand)||p.brand)} <span>·</span> ${esc(categoryLabel(p.category))}</p><small>${(p.colorways||[]).length} colorway${(p.colorways||[]).length===1?'':'s'} · ${(p.sizes||[]).length} sizes</small></div>
        <div class="row-actions"><button type="button" class="secondary" data-action="edit">Edit</button><button type="button" class="icon-button" data-action="up" aria-label="Move up" title="Move up" ${i===0?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button><button type="button" class="icon-button" data-action="down" aria-label="Move down" title="Move down" ${i===state.products.length-1?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6"/></svg></button><button type="button" class="secondary" data-action="toggle">${p.published?'Hide':'Show'}</button><button type="button" class="danger-button" data-action="delete">Delete</button></div>
      </article>`;
    }).join('');
  }
  function fillSelects(product) {
    $('brand').innerHTML=BRANDS.map(b=>`<option value="${slug(b)}">${esc(b)}</option>`).join('');
    $('category').innerHTML=CATEGORIES.map(c=>`<option value="${c.key}">${c.label}</option>`).join('');
    $('brand').value=product?.brand||slug(BRANDS[0]); $('category').value=product?.category||CATEGORIES[0].key;
    syncPicker('brand'); syncPicker('category'); closePickers();
    sizeEditor.setProduct({category:$('category').value,sizes:product?.sizes||[]});
  }
  async function loadBrands() {
    const data = await CatalogStore.listBrands();
    BRANDS = [...BUILT_IN_BRANDS, ...data.map(brand => brand.name)];
  }
  async function loadCategories() {
    const data = await CatalogStore.listCategories();
    CATEGORIES = [...BUILT_IN_CATEGORIES, ...data.map(category => ({key:category.id,label:category.name}))];
  }
  async function createBrand() {
    const input=$('newBrandName'), name=input.value.trim();
    if (!name) { notice('Enter a brand name.',true); input.focus(); return; }
    if (BRANDS.some(brand=>slug(brand)===slug(name))) { notice('That brand already exists.',true); return; }
    const button=$('createBrand'); button.disabled=true;
    try {
      const file=$('newBrandLogo').files[0];
      let logoUrl=null;
      if(file){
        if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>4*1024*1024)throw new Error('Choose a JPG, PNG, WEBP or GIF logo under 4 MB.');
        notice('Uploading brand logo…');
        logoUrl=await CatalogStore.uploadImage(file,'brand-logos');
      }
      const brand=await CatalogStore.addBrand(name,logoUrl);
      await loadBrands();
      fillSelects({brand:brand.id,category:$('category').value,sizes:sizeEditor.getSizes()});
      $('newBrandFields').hidden=true; input.value=''; $('newBrandLogo').value='';
      notice(`${brand.name} added. Add a product to make it visible in the catalog.`);
    } catch(e) { notice(`Could not add brand: ${e.message}`,true); }
    finally { button.disabled=false; }
  }
  async function createCategory() {
    const input=$('newCategoryName'),name=input.value.trim();
    if(!name){notice('Enter a category name.',true);input.focus();return;}
    if(CATEGORIES.some(category=>category.key===slug(name))){notice('That category already exists.',true);return;}
    const button=$('createCategory');button.disabled=true;
    try {
      const category=await CatalogStore.addCategory(name);
      await loadCategories();
      fillSelects({brand:$('brand').value,category:category.id,sizes:[]});
      $('newCategoryFields').hidden=true;input.value='';
      notice(`${category.name} added. Save a product in it to show it in the catalog.`);
    } catch(e){notice(`Could not add category: ${e.message}`,true);}
    finally{button.disabled=false;}
  }
  const uid=()=>globalThis.crypto?.randomUUID?.()||`cw-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function addColorway(c={}) { state.colorways.push({id:c.id||uid(),name:c.name||'',images:[...(c.images||[])]}); drawColorways(); }
  function drawColorways() {
    $('colorways').innerHTML=state.colorways.map((c,i)=>`<section class="colorway" data-cw="${esc(c.id)}"><div class="colorway-head"><label class="field">Colorway name<input data-name value="${esc(c.name)}" maxlength="60" placeholder="e.g. Black"></label><button class="text-button" type="button" data-remove="${esc(c.id)}" aria-label="Remove colorway">Remove</button></div>
      <div class="dropzone" tabindex="0" role="button" data-drop="${esc(c.id)}"><span class="drop-icon">↥</span><strong>Drop photos here</strong><span>or <u>choose files</u></span><small>JPG, PNG, WEBP or GIF</small></div>
      <div class="photo-list">${c.images.map((url,j)=>`<div class="photo-entry"><div class="photo-thumb"><img src="${esc(url)}" alt="Photo ${j+1}"><button type="button" data-photo-remove="${esc(c.id)}" data-index="${j}" aria-label="Remove photo">×</button></div></div>`).join('')}</div></section>`).join('');
  }
  function openEditor(product) {
    state.editingId=product?.id||null; state.colorways=(product?.colorways||[]).map(c=>({id:c.id||uid(),name:c.name||'',images:[...(c.images||[])]}));
    $('formTitle').textContent=product?'Edit product':'Add product'; $('name').value=product?.name||''; $('newBrandFields').hidden=true; $('newBrandName').value=''; $('newBrandLogo').value=''; $('newCategoryFields').hidden=true; $('newCategoryName').value=''; fillSelects(product); if(!state.colorways.length) addColorway(); else drawColorways();
    $('editor').showModal(); $('name').focus();
  }
  function closeEditor(){ $('editor').close(); }
  async function uploadFiles(files,cwId) {
    const allowed=['image/jpeg','image/png','image/webp','image/gif'];
    state.uploads++; $('saveProduct').disabled=true;
    try {
    for(const file of files){
      if(!allowed.includes(file.type)){notice(`${file.name} is not a supported image file.`,true);continue;}
      if(file.size>4*1024*1024){notice(`${file.name} is larger than 4 MB.`,true);continue;}
      try {
        notice(`Uploading ${file.name}…`);
        const imageUrl=await CatalogStore.uploadImage(file,'products');
        const cw=state.colorways.find(x=>x.id===cwId);
        if(cw){cw.images.push(imageUrl);drawColorways();}
        notice('Photo uploaded. It will appear exactly as shown.');
      }
      catch(e){notice(`Could not upload ${file.name}: ${e.message}`,true);}
    }
    } finally { state.uploads--; $('saveProduct').disabled=state.busy||state.uploads>0; }
  }
  async function save(e) {
    e.preventDefault(); if(state.busy||state.uploads)return;
    const payload={brand:$('brand').value,category:$('category').value,name:$('name').value.trim(),published:state.editingId?(state.products.find(p=>p.id===state.editingId)?.published??true):true,sortOrder:state.editingId?(state.products.find(p=>p.id===state.editingId)?.sortOrder??state.products.length):state.products.length,sizes:sizeEditor.getSizes(),colorways:state.colorways.map(c=>({id:c.id,name:c.name.trim(),images:c.images}))};
    if(!payload.name){notice('Enter a product name.',true);return;} if(!payload.colorways.length||payload.colorways.some(c=>!c.images.length)){notice('Add at least one photo to every colorway.',true);return;}
    state.busy=true; $('saveProduct').disabled=true;
    try { await CatalogStore.saveProduct(payload,state.editingId); closeEditor(); notice('Product saved.'); await load(); }
    catch(e){notice(`Could not save product: ${e.message}`,true);} finally {state.busy=false;$('saveProduct').disabled=state.uploads>0;}
  }
  async function action(row,button) {
    const p=state.products.find(x=>String(x.id)===row.dataset.id); if(!p)return;
    const sorted=state.products.slice().sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)); const i=sorted.indexOf(p); const action=button.dataset.action;
    try {
      if(action==='edit')return openEditor(p);
      if(action==='toggle')await CatalogStore.saveProduct({published:!p.published},p.id);
      if(action==='delete'){if(!confirm(`Delete “${p.name}”? This cannot be undone.`))return;await CatalogStore.deleteProduct(p.id);}
      if(action==='up'||action==='down'){const j=i+(action==='up'?-1:1); if(j<0||j>=sorted.length)return; [sorted[i],sorted[j]]=[sorted[j],sorted[i]]; for(let position=0;position<sorted.length;position++)if(sorted[position].sortOrder!==position)await CatalogStore.saveProduct({sortOrder:position},sorted[position].id);}
      await load(); notice(action==='delete'?'Product deleted.':'Catalog updated.');
    } catch(e){notice(`Could not update product: ${e.message}`,true);}
  }
  async function load(){ try{await CatalogStore.ensureEditor();const [data]=await Promise.all([CatalogStore.listProducts(),loadBrands(),loadCategories()]);state.products=data;render();setSignedIn(true);$('loginError').textContent='';}catch(e){ if(!CatalogStore.hasSession()||e.status===401||e.status===403){clearAuth();$('loginError').textContent=e.message;return;} setSignedIn(true);$('productList').innerHTML=`<div class="empty-state"><h2>Catalog unavailable</h2><p>${esc(e.message)}</p><button class="secondary" type="button" id="retry">Try again</button></div>`; $('retry')?.addEventListener('click',load); } }

  $('newProduct').addEventListener('click',()=>openEditor()); $('productList').addEventListener('click',e=>{const create=e.target.closest('[data-action="create"]');if(create)return openEditor();const b=e.target.closest('[data-action]');if(b)action(b.closest('[data-id]'),b);});
  document.querySelectorAll('.picker').forEach(picker=>{
    picker.addEventListener('click',e=>{
      const option=e.target.closest('.picker-option');
      if(option){const select=picker.querySelector('select');select.value=option.dataset.value;syncPicker(select.id);closePickers();picker.querySelector('.picker-trigger').focus();select.dispatchEvent(new Event('change',{bubbles:true}));return;}
      if(e.target.closest('.picker-trigger')){const menu=picker.querySelector('.picker-menu');menu.hidden?openPicker(picker):closePickers();}
    });
    picker.addEventListener('keydown',e=>{
      const menu=picker.querySelector('.picker-menu');
      if(e.target.closest('.picker-trigger')&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();openPicker(picker,true);return;}
      const option=e.target.closest('.picker-option');if(!option)return;
      const options=[...menu.querySelectorAll('.picker-option')],index=options.indexOf(option);
      if(e.key==='Escape'){e.preventDefault();closePickers();picker.querySelector('.picker-trigger').focus();}
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){
        e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next]?.focus();
      } else if(e.key==='Tab')closePickers();
    });
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.picker'))closePickers();});
  $('showNewBrand').addEventListener('click',()=>{ $('newBrandFields').hidden=!$('newBrandFields').hidden; if(!$('newBrandFields').hidden)$('newBrandName').focus(); });
  $('createBrand').addEventListener('click',createBrand);
  $('showNewCategory').addEventListener('click',()=>{ $('newCategoryFields').hidden=!$('newCategoryFields').hidden; if(!$('newCategoryFields').hidden)$('newCategoryName').focus(); });
  $('createCategory').addEventListener('click',createCategory);
  $('category').addEventListener('change',()=>sizeEditor.setProduct({category:$('category').value,sizes:[]})); $('addColorway').addEventListener('click',()=>addColorway()); $('closeEditor').addEventListener('click',closeEditor); $('cancelEditor').addEventListener('click',closeEditor); $('productForm').addEventListener('submit',save);
  $('colorways').addEventListener('input',e=>{if(e.target.matches('[data-name]')){const cw=state.colorways.find(x=>x.id===e.target.closest('[data-cw]').dataset.cw);if(cw)cw.name=e.target.value;}});
  $('colorways').addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove){state.colorways=state.colorways.filter(x=>x.id!==remove.dataset.remove);drawColorways();}const photo=e.target.closest('[data-photo-remove]');if(photo){const cw=state.colorways.find(x=>x.id===photo.dataset.photoRemove);if(cw)cw.images.splice(+photo.dataset.index,1);drawColorways();}const drop=e.target.closest('[data-drop]');if(drop){$('filePicker').dataset.cw=drop.dataset.drop;$('filePicker').click();}});
  $('colorways').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-drop]')){e.preventDefault();$('filePicker').dataset.cw=e.target.dataset.drop;$('filePicker').click();}});
  $('colorways').addEventListener('dragover',e=>{const z=e.target.closest('[data-drop]');if(z){e.preventDefault();z.classList.add('dragging');}});
  $('colorways').addEventListener('dragleave',e=>e.target.closest('[data-drop]')?.classList.remove('dragging'));
  $('colorways').addEventListener('drop',e=>{const z=e.target.closest('[data-drop]');if(z){e.preventDefault();z.classList.remove('dragging');uploadFiles(e.dataTransfer.files,z.dataset.drop);}});
  $('filePicker').addEventListener('change',e=>{if(e.target.files.length)uploadFiles(e.target.files,e.target.dataset.cw);e.target.value='';});
  const sizeEditor=window.Sizes.mountEditor($('sizes'),{category:CATEGORIES[0].key,sizes:[]},{label:'Available sizes',customLabel:'Add a custom size'});
  $('signInForm').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('signInButton'),error=$('loginError');button.disabled=true;error.textContent='';
    try {await CatalogStore.signIn($('loginCode').value.trim());$('loginCode').value='';await load();}
    catch(e){error.textContent=e.message||'That code was not accepted. Try again.';}
    finally{button.disabled=false;}
  });
  $('signOut').addEventListener('click',async()=>{await CatalogStore.signOut();clearAuth();$('loginCode').value='';$('loginError').textContent='';});
  if(CatalogStore.hasSession())load();else setSignedIn(false);
})();
