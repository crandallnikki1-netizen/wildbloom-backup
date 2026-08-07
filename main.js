const $ = (selector) => document.querySelector(selector);
const productGrid = $('#product-grid');
const collectionsGrid = $('#collections-grid');
const benefitsList = $('#benefits-list');

$('#nav-toggle').addEventListener('click', () => {
  $('#mobile-nav').classList.toggle('open');
});

function escapeHtml(value='') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadSite() {
  const [settings, products] = await Promise.all([
    fetch('/api/settings').then(r => r.json()),
    fetch('/api/products').then(r => r.json())
  ]);
  renderSettings(settings);
  renderProducts(products);
}

function renderSettings(settings) {
  const site = settings.site || {};
  const hero = settings.hero || {};
  const about = settings.about || {};
  const collections = settings.collections || [];
  const benefits = settings.benefits || [];
  const footer = settings.footer || {};

  $('#announcement').textContent = site.announcement || '';
  $('#brand-name').textContent = site.name || 'House of the Wild Bloom';
  $('#hero-eyebrow').textContent = hero.eyebrow || '';
  $('#hero-headline').textContent = hero.headline || '';
  $('#hero-script').textContent = hero.scriptLine || '';
  $('#hero-description').textContent = hero.description || '';
  $('#hero-image').src = hero.image || 'assets/hero-ritual.svg';
  $('#hero-primary').textContent = hero.primaryLabel || 'Shop';
  $('#hero-secondary').textContent = hero.secondaryLabel || 'View More';
  $('#hero-primary').href = hero.primaryUrl || '#products';
  $('#hero-secondary').href = hero.secondaryUrl || '#collections';

  $('#about-eyebrow').textContent = about.eyebrow || '';
  $('#about-headline').textContent = about.headline || '';
  $('#about-body').textContent = about.body || '';
  $('#about-body2').textContent = about.body2 || '';
  $('#about-image').src = about.image || 'assets/founder-nikki.svg';

  benefitsList.innerHTML = benefits.map(item => `
    <div class="benefit-item">
      <h3>${escapeHtml(item.title || '')}</h3>
      <p>${escapeHtml(item.text || '')}</p>
    </div>
  `).join('');

  collectionsGrid.innerHTML = collections.map(item => `
    <article class="collection-card">
      <div class="collection-card__image"><img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.title || '')}" /></div>
      <div class="collection-card__body">
        <h3>${escapeHtml(item.title || '')}</h3>
        <p>${escapeHtml(item.description || '')}</p>
        <a class="text-link" href="${escapeHtml(item.link || '#products')}">Explore →</a>
      </div>
    </article>
  `).join('');

  const marqueeItems = settings.marquee || [];
  const repeated = [...marqueeItems, ...marqueeItems, ...marqueeItems];
  $('#marquee-track').innerHTML = repeated.map(item => `<span>${escapeHtml(item)}</span>`).join('');

  $('#footer-line').textContent = footer.line || '';
  $('#footer-note').textContent = footer.note || '';

  const etsyUrl = site.etsyUrl || 'https://houseofthewildbloom.etsy.com';
  $('#etsy-link-top').href = etsyUrl;
  $('#etsy-link-bottom').href = etsyUrl;
  $('#email-link').href = `mailto:${site.email || 'houseofthewildbloom@gmail.com'}`;
}

function renderProducts(products=[]) {
  productGrid.innerHTML = products.map(product => {
    const image = (product.images && product.images[0]) || 'assets/hero-ritual.svg';
    return `
      <article class="product-card">
        <div class="product-card__image">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name || '')}" />
          ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
        </div>
        <div class="product-card__body">
          <p class="product-category">${escapeHtml(product.category || '')}</p>
          <h3>${escapeHtml(product.name || '')}</h3>
          <p class="product-scent">${escapeHtml(product.scent || '')}</p>
          <p class="product-description">${escapeHtml(product.description || '')}</p>
          <div class="product-card__footer">
            <strong>$${escapeHtml(product.price || '0.00')}</strong>
            <a class="btn btn--small" href="${escapeHtml(product.etsyUrl || '#')}" target="_blank" rel="noopener">View</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

loadSite().catch(err => {
  console.error(err);
  productGrid.innerHTML = '<p>Could not load products right now.</p>';
});
