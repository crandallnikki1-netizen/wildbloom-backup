const grid = document.querySelector('#product-grid');
const products = Array.isArray(window.WILD_BLOOM_PRODUCTS) ? window.WILD_BLOOM_PRODUCTS : [];

products.forEach((product) => {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-image" style="--card-bg:${product.color}" data-initials="${product.initials}"></div>
    <div class="product-info">
      <span class="product-type">${product.type}</span>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <span class="product-status">${product.status}</span>
    </div>`;
  grid.appendChild(card);
});

document.querySelector('#year').textContent = new Date().getFullYear();

const button = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
button.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
}));