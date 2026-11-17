/* Product-specific available-size helpers for the catalog and editor.
 * Load as a classic script; the API is available as window.Sizes.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Sizes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORY_DEFAULTS = Object.freeze({
    shoes: Object.freeze(['35','36','37','38','39','40','41','42','43','44','45']),
    hoodies: Object.freeze(['S','M','L','XL']),
    shirts: Object.freeze(['S','M','L','XL']),
    belts: Object.freeze(['95 cm','100 cm','105 cm','110 cm','115 cm','120 cm','125 cm','130 cm','135 cm','140 cm']),
    pants: Object.freeze(['S','M','L','XL'])
  });

  function clean(values) {
    if (!Array.isArray(values)) return [];
    const seen = new Set();
    return values.reduce((result, value) => {
      if (typeof value !== 'string') return result;
      const size = value.trim();
      const key = size.toLocaleLowerCase();
      if (size && !seen.has(key)) { seen.add(key); result.push(size); }
      return result;
    }, []);
  }

  // Saved sizes are authoritative. Category defaults are suggestions for editors only.
  function list(product) { return clean(product && product.sizes); }
  function defaults(category) { return (CATEGORY_DEFAULTS[category] || []).slice(); }
  function update(product, sizes) { return Object.assign({}, product, { sizes: clean(sizes) }); }
  function add(product, size) { return update(product, list(product).concat([size])); }
  function remove(product, size) { return update(product, list(product).filter(value => value !== size)); }

  function mountEditor(container, product, options) {
    if (!container) throw new TypeError('Sizes.mountEditor requires a container');
    const opts = options || {};
    let currentProduct = product || {};
    let selected = list(currentProduct);
    let suggestions = clean(opts.suggestions || defaults(currentProduct.category));
    const customLabel = opts.customLabel || 'Add another size';

    function commit(next) {
      selected = clean(next);
      currentProduct = update(currentProduct, selected);
      render();
      if (typeof opts.onChange === 'function') opts.onChange(currentProduct, selected.slice());
    }
    function render() {
      container.classList.add('size-editor');
      container.replaceChildren();
      const choices = [...suggestions, ...selected.filter(size => !suggestions.some(item => item.toLocaleLowerCase() === size.toLocaleLowerCase()))];
      const group = document.createElement('div');
      group.className = 'size-editor-options';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', opts.label || 'Available sizes');
      choices.forEach(size => {
        const label = document.createElement('label');
        label.className = 'size-editor-chip';
        const input = document.createElement('input');
        input.type = 'checkbox'; input.value = size; input.checked = selected.some(value => value.toLocaleLowerCase() === size.toLocaleLowerCase());
        input.addEventListener('change', () => commit(input.checked ? selected.concat([size]) : selected.filter(value => value.toLocaleLowerCase() !== size.toLocaleLowerCase())));
        const text = document.createElement('span'); text.textContent = size;
        label.append(input, text); group.append(label);
      });
      container.append(group);

      const form = document.createElement('form'); form.className = 'size-editor-custom';
      const input = document.createElement('input'); input.type = 'text'; input.maxLength = 32; input.autocomplete = 'off'; input.placeholder = customLabel;
      input.setAttribute('aria-label', customLabel);
      const button = document.createElement('button'); button.type = 'submit'; button.textContent = opts.addLabel || 'Add';
      form.append(input, button);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value || selected.some(size => size.toLocaleLowerCase() === value.toLocaleLowerCase())) { input.focus(); return; }
        commit(selected.concat([value]));
      });
      container.append(form);
    }
    render();
    return {
      getSizes: () => selected.slice(),
      setProduct(nextProduct) {
        currentProduct = nextProduct || {};
        selected = list(currentProduct);
        suggestions = clean(opts.suggestions || defaults(currentProduct.category));
        render();
      },
      destroy() { container.classList.remove('size-editor'); container.replaceChildren(); }
    };
  }

  function mountView(container, product, options) {
    if (!container) throw new TypeError('Sizes.mountView requires a container');
    const opts = options || {};
    let selected = opts.selected && list({ sizes: [opts.selected] })[0] || null;
    let sizes = list(product);
    function render() {
      container.classList.add('size-list');
      container.setAttribute('role', 'group');
      if (opts.label) container.setAttribute('aria-label', opts.label);
      else container.removeAttribute('aria-label');
      container.replaceChildren();
      sizes.forEach(size => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'size-choice'; button.textContent = size;
        button.setAttribute('aria-pressed', String(selected === size));
        button.addEventListener('click', () => {
          selected = size; render();
          if (typeof opts.onChange === 'function') opts.onChange(size, product);
        });
        container.append(button);
      });
    }
    render();
    return {
      getSelection: () => selected,
      select(size) { if (!sizes.includes(size)) return false; selected = size; render(); return true; },
      setProduct(nextProduct) { product = nextProduct || {}; sizes = list(product); if (!sizes.includes(selected)) selected = null; render(); },
      destroy() { container.classList.remove('size-list'); container.removeAttribute('role'); container.removeAttribute('aria-label'); container.replaceChildren(); }
    };
  }

  return { list, defaults, update, add, remove, mountEditor, mountView };
});
