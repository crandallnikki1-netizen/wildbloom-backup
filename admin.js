let adminPass = '';
let settingsCache = null;
let productsCache = [];

const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = qs('#password').value;
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    qs('#login-error').textContent = 'That password did not work. Please try again.';
    return;
  }
  adminPass = password;
  qs('#login-shell').hidden = true;
  qs('#dashboard').hidden = false;
  await init();
});

qs('#logout-btn').addEventListener('click', () => window.location.reload());
qsa('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

function switchTab(name) {
  qsa('.tab').forEach(btn => btn.classList.toggle('is-active', btn.dataset.tab === name));
  qsa('.panel').forEach(panel => panel.classList.toggle('is-active', panel.id === `panel-${name}`));
}

async function init() {
  const [settings, products] = await Promise.all([
    fetch('/api/settings').then(r => r.json()),
    fetch('/api/products').then(r => r.json())
  ]);
  settingsCache = settings;
  productsCache = products;
  fillSettings();
  renderProducts();
  loadMedia();
}

function fillSettings() {
  const site = settingsCache.site || {};
  const hero = settingsCache.hero || {};
  const about = settingsCache.about || {};
  qs('#site-name').value = site.name || '';
  qs('#site-short').value = site.shortName || '';
  qs('#site-tagline').value = site.tagline || '';
  qs('#site-etsy').value = site.etsyUrl || '';
  qs('#site-email').value = site.email || '';
  qs('#site-announcement').value = site.announcement || '';
  qs('#hero-eyebrow-input').value = hero.eyebrow || '';
  qs('#hero-headline-input').value = hero.headline || '';
  qs('#hero-script-input').value = hero.scriptLine || '';
  qs('#hero-image-input').value = hero.image || '';
  qs('#hero-description-input').value = hero.description || '';
  qs('#about-eyebrow-input').value = about.eyebrow || '';
  qs('#about-headline-input').value = about.headline || '';
  qs('#about-image-input').value = about.image || '';
  qs('#about-body-input').value = about.body || '';
  qs('#about-body2-input').value = about.body2 || '';
}

async function uploadImage(file) {
  if (!file) return null;
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-pass': adminPass },
    body: form
  });
  if (!res.ok) throw new Error('Could not upload image');
  const data = await res.json();
  return data.path;
}

async function saveSettings(payload, statusSelector) {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Could not save settings');
  settingsCache = await res.json();
  qs(statusSelector).textContent = 'Saved.';
}

qs('#save-general').addEventListener('click', async () => {
  try {
    await saveSettings({
      site: {
        ...settingsCache.site,
        name: qs('#site-name').value,
        shortName: qs('#site-short').value,
        tagline: qs('#site-tagline').value,
        etsyUrl: qs('#site-etsy').value,
        email: qs('#site-email').value,
        announcement: qs('#site-announcement').value
      }
    }, '#general-status');
  } catch (err) {
    qs('#general-status').textContent = err.message;
  }
});

qs('#save-homepage').addEventListener('click', async () => {
  const status = qs('#homepage-status');
  status.textContent = 'Saving…';
  try {
    let heroImage = qs('#hero-image-input').value;
    let aboutImage = qs('#about-image-input').value;
    const heroFile = qs('#hero-image-upload').files[0];
    const aboutFile = qs('#about-image-upload').files[0];
    if (heroFile) heroImage = await uploadImage(heroFile);
    if (aboutFile) aboutImage = await uploadImage(aboutFile);

    await saveSettings({
      hero: {
        ...settingsCache.hero,
        eyebrow: qs('#hero-eyebrow-input').value,
        headline: qs('#hero-headline-input').value,
        scriptLine: qs('#hero-script-input').value,
        image: heroImage,
        description: qs('#hero-description-input').value
      },
      about: {
        ...settingsCache.about,
        eyebrow: qs('#about-eyebrow-input').value,
        headline: qs('#about-headline-input').value,
        image: aboutImage,
        body: qs('#about-body-input').value,
        body2: qs('#about-body2-input').value
      }
    }, '#homepage-status');
    qs('#hero-image-input').value = heroImage;
    qs('#about-image-input').value = aboutImage;
    qs('#hero-image-upload').value = '';
    qs('#about-image-upload').value = '';
  } catch (err) {
    status.textContent = err.message;
  }
});

function renderProducts() {
  const list = qs('#product-list');
  const sorted = [...productsCache].sort((a, b) => (Number(a.order) || 100) - (Number(b.order) || 100));
  list.innerHTML = sorted.map(product => `
    <article class="list-item">
      <img src="${(product.images || [])[0] || 'assets/hero-ritual.svg'}" alt="${product.name}" />
      <div>
        <h3>${product.name}</h3>
        <p>${product.category || ''} ${product.scent ? '· ' + product.scent : ''}</p>
        <small>$${product.price || '0.00'} · order ${product.order ?? 100}${product.hidden ? ' · hidden' : ''}${product.soldOut ? ' · sold out' : ''}</small>
      </div>
      <div class="row-actions">
        <button class="btn btn--ghost" data-edit="${product.id}">Edit</button>
        <button class="btn btn--ghost" data-delete="${product.id}">Delete</button>
      </div>
    </article>
  `).join('');
  qsa('[data-edit]').forEach(btn => btn.addEventListener('click', () => editProduct(btn.dataset.edit)));
  qsa('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.delete)));
}

qs('#new-product-btn').addEventListener('click', () => {
  qs('#product-form').hidden = false;
  qs('#product-form').reset();
  qs('#product-id').value = '';
  qs('#product-order').value = '100';
});
qs('#cancel-product').addEventListener('click', () => { qs('#product-form').hidden = true; });

function editProduct(id) {
  const product = productsCache.find(item => item.id === id);
  if (!product) return;
  qs('#product-form').hidden = false;
  qs('#product-id').value = product.id;
  qs('#product-name').value = product.name || '';
  qs('#product-category').value = product.category || '';
  qs('#product-scent').value = product.scent || '';
  qs('#product-price').value = product.price || '';
  qs('#product-badge').value = product.badge || '';
  qs('#product-order').value = product.order ?? 100;
  qs('#product-etsy').value = product.etsyUrl || '';
  qs('#product-image-path').value = (product.images || [])[0] || '';
  qs('#product-hidden').checked = Boolean(product.hidden);
  qs('#product-soldout').checked = Boolean(product.soldOut);
  qs('#product-description').value = product.description || '';
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-admin-pass': adminPass }});
  if (!res.ok) return alert('Could not delete product.');
  productsCache = await fetch('/api/products').then(r => r.json());
  renderProducts();
}

qs('#product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = qs('#product-id').value;
  const file = qs('#product-image-upload').files[0];
  const form = new FormData();
  form.append('name', qs('#product-name').value);
  form.append('category', qs('#product-category').value);
  form.append('scent', qs('#product-scent').value);
  form.append('price', qs('#product-price').value);
  form.append('badge', qs('#product-badge').value);
  form.append('order', qs('#product-order').value || '100');
  form.append('hidden', qs('#product-hidden').checked ? 'true' : 'false');
  form.append('soldOut', qs('#product-soldout').checked ? 'true' : 'false');
  form.append('etsyUrl', qs('#product-etsy').value);
  form.append('description', qs('#product-description').value);
  form.append('images', JSON.stringify([qs('#product-image-path').value].filter(Boolean)));
  if (file) form.append('images', file);

  const res = await fetch(id ? `/api/products/${id}` : '/api/products', {
    method: id ? 'PUT' : 'POST',
    headers: { 'x-admin-pass': adminPass },
    body: form
  });
  if (!res.ok) return alert('Could not save product.');
  productsCache = await fetch('/api/products').then(r => r.json());
  renderProducts();
  qs('#product-status').textContent = 'Saved product.';
  qs('#product-form').hidden = true;
});

qs('#media-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = qs('#media-file').files[0];
  if (!file) return;
  try {
    const path = await uploadImage(file);
    qs('#media-status').textContent = `Uploaded: ${path}`;
    qs('#media-form').reset();
    loadMedia();
  } catch (err) {
    qs('#media-status').textContent = err.message;
  }
});

async function loadMedia() {
  const files = await fetch('/api/media').then(r => r.json());
  qs('#media-list').innerHTML = files.map(file => `
    <article class="list-item">
      <img src="${file.path}" alt="${file.name}" />
      <div>
        <h3>${file.name}</h3>
        <p>${file.path}</p>
      </div>
    </article>
  `).join('') || '<p class="muted">No uploaded media yet.</p>';
}
