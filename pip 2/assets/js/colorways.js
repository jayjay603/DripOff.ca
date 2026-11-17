/* Colorway helpers for the public catalog and catalog editor.
 * Load as a classic script; the API is available as window.Colorways.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Colorways = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function list(product) {
    return Array.isArray(product && product.colorways) ? product.colorways : [];
  }

  function images(colorway) {
    return Array.isArray(colorway && colorway.images)
      ? colorway.images.filter(src => typeof src === 'string' && src.trim())
      : [];
  }

  function get(product, id) {
    return list(product).find(colorway => colorway.id === id) || null;
  }

  function first(product) {
    return list(product)[0] || null;
  }

  // Pure immutable helpers used by admin save/edit flows.
  function update(product, id, changes) {
    return Object.assign({}, product, {
      colorways: list(product).map(colorway => colorway.id === id
        ? Object.assign({}, colorway, changes)
        : colorway)
    });
  }

  function add(product, colorway) {
    return Object.assign({}, product, { colorways: list(product).concat([{
      id: colorway.id,
      name: colorway.name || '',
      images: images(colorway)
    }]) });
  }

  function remove(product, id) {
    return Object.assign({}, product, {
      colorways: list(product).filter(colorway => colorway.id !== id)
    });
  }

  function appendImage(product, id, src) {
    const colorway = get(product, id);
    if (!colorway || typeof src !== 'string' || !src.trim()) return product;
    return update(product, id, { images: images(colorway).concat(src.trim()) });
  }

  function removeImage(product, id, index) {
    const colorway = get(product, id);
    if (!colorway) return product;
    return update(product, id, { images: images(colorway).filter((_, i) => i !== index) });
  }

  /*
   * Mounts a complete, accessible image picker/gallery into a container.
   * Options: selectedId, onChange(colorway, image, product), labels.
   * Returns { getSelection(), select(id), destroy() }.
   */
  function mountGallery(container, product, options) {
    if (!container) throw new TypeError('Colorways.mountGallery requires a container');
    const opts = options || {};
    let currentProduct = product || {};
    let selected = get(currentProduct, opts.selectedId) || first(currentProduct);
    let imageIndex = 0;
    const labels = Object.assign({ colorway: 'Color', photos: 'Product photos' }, opts.labels);

    function render() {
      const ways = list(currentProduct);
      selected = get(currentProduct, selected && selected.id) || first(currentProduct);
      const photos = images(selected);
      imageIndex = Math.min(imageIndex, Math.max(photos.length - 1, 0));
      container.classList.add('cw-gallery');
      container.innerHTML = '';

      let choices = null;
      if (ways.length) {
        choices = document.createElement('div');
        choices.className = 'cw-options';
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', labels.colorway);
        const heading = document.createElement('span');
        heading.className = 'cw-label';
        heading.textContent = labels.colorway;
        choices.append(heading);
        ways.forEach(way => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'cw-option';
          button.dataset.colorwayId = way.id;
          button.setAttribute('aria-pressed', String(!!selected && selected.id === way.id));
          button.textContent = way.name || 'Unnamed color';
          button.addEventListener('click', () => {
            selected = way;
            imageIndex = 0;
            render();
            notify();
          });
          choices.append(button);
        });
      }

      const gallery = document.createElement('div');
      gallery.className = 'cw-photos';
      gallery.setAttribute('aria-label', labels.photos);
      const main = document.createElement('div');
      main.className = 'cw-main';
      const src = photos[imageIndex];
      if (src) {
        const image = document.createElement('img');
        image.src = src;
        image.alt = (selected && selected.name ? selected.name : '') + ' product photo';
        image.loading = 'lazy';
        main.append(image);
      } else {
        const empty = document.createElement('span');
        empty.className = 'cw-empty';
        empty.textContent = 'No photos yet';
        main.append(empty);
      }
      gallery.append(main);

      if (photos.length > 1) {
        const thumbs = document.createElement('div');
        thumbs.className = 'cw-thumbnails';
        photos.forEach((photo, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'cw-thumbnail';
          button.setAttribute('aria-label', 'Show photo ' + (index + 1));
          button.setAttribute('aria-pressed', String(index === imageIndex));
          const image = document.createElement('img');
          image.src = photo;
          image.alt = '';
          image.loading = 'lazy';
          button.append(image);
          button.addEventListener('click', () => {
            imageIndex = index;
            render();
            notify();
          });
          thumbs.append(button);
        });
        gallery.append(thumbs);
      }
      container.append(gallery);
      if (choices) container.append(choices);
    }

    function notify() {
      if (typeof opts.onChange === 'function') {
        opts.onChange(selected, images(selected)[imageIndex] || null, currentProduct);
      }
    }

    render();
    return {
      getSelection: () => ({ colorway: selected, image: images(selected)[imageIndex] || null }),
      select(id) {
        const next = get(currentProduct, id);
        if (!next) return false;
        selected = next;
        imageIndex = 0;
        render();
        notify();
        return true;
      },
      setProduct(nextProduct) {
        currentProduct = nextProduct || {};
        render();
      },
      destroy() {
        container.classList.remove('cw-gallery');
        container.innerHTML = '';
      }
    };
  }

  return { list, images, get, first, update, add, remove, appendImage, removeImage, mountGallery };
});
