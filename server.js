const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || '';
if (!ADMIN_PASS) console.warn('ADMIN_PASS is not set. Admin write access is disabled until it is configured.');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

for (const dir of [DATA_DIR, UPLOAD_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{}');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2));
const toBool = value => value === true || value === 'true';
const toOrder = value => Number.isFinite(Number(value)) ? Number(value) : 100;

function authCheck(req, res, next) {
  if (!ADMIN_PASS) return res.status(503).json({ error: 'Admin password is not configured on the server.' });
  const pass = req.headers['x-admin-pass'] || req.query.adminPass;
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${safe}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname);
    cb(ok ? null : new Error('Images only'), ok);
  }
});

app.use(express.json({ limit: '5mb' }));
app.use('/data/uploads', express.static(UPLOAD_DIR));
app.use(express.static(ROOT));

app.get('/api/health', (_, res) => res.json({ ok: true, adminConfigured: Boolean(ADMIN_PASS) }));

app.post('/api/auth', (req, res) => {
  if (!ADMIN_PASS) return res.status(503).json({ error: 'Admin password is not configured on the server.' });
  if ((req.body || {}).password === ADMIN_PASS) return res.json({ ok: true });
  return res.status(401).json({ error: 'Wrong password' });
});

app.get('/api/settings', (_, res) => res.json(readJson(SETTINGS_FILE)));
app.put('/api/settings', authCheck, (req, res) => {
  const current = readJson(SETTINGS_FILE);
  const updated = { ...current, ...req.body };
  writeJson(SETTINGS_FILE, updated);
  res.json(updated);
});

app.get('/api/products', (_, res) => res.json(readJson(PRODUCTS_FILE)));
app.post('/api/products', authCheck, upload.array('images', 10), (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const body = req.body || {};
  const imagePaths = (req.files || []).map(file => `data/uploads/${file.filename}`);
  let fallbackImages = [];
  try { fallbackImages = body.images ? JSON.parse(body.images) : []; } catch {}

  const product = {
    id: Date.now().toString(),
    name: body.name || 'Untitled Product',
    category: body.category || '',
    scent: body.scent || '',
    price: body.price || '0.00',
    description: body.description || '',
    badge: body.badge || '',
    order: toOrder(body.order),
    hidden: toBool(body.hidden),
    soldOut: toBool(body.soldOut),
    etsyUrl: body.etsyUrl || 'https://houseofthewildbloom.etsy.com',
    images: imagePaths.length ? imagePaths : fallbackImages
  };
  products.unshift(product);
  writeJson(PRODUCTS_FILE, products);
  res.status(201).json(product);
});

app.put('/api/products/:id', authCheck, upload.array('images', 10), (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  const current = products[index];
  const body = req.body || {};
  let images = current.images || [];
  const uploaded = (req.files || []).map(file => `data/uploads/${file.filename}`);
  if (uploaded.length) images = uploaded;
  else if (body.images) {
    try { images = JSON.parse(body.images); } catch {}
  }

  products[index] = {
    ...current,
    name: body.name ?? current.name,
    category: body.category ?? current.category,
    scent: body.scent ?? current.scent,
    price: body.price ?? current.price,
    description: body.description ?? current.description,
    badge: body.badge ?? current.badge,
    order: body.order !== undefined ? toOrder(body.order) : (current.order ?? 100),
    hidden: body.hidden !== undefined ? toBool(body.hidden) : Boolean(current.hidden),
    soldOut: body.soldOut !== undefined ? toBool(body.soldOut) : Boolean(current.soldOut),
    etsyUrl: body.etsyUrl ?? current.etsyUrl,
    images
  };
  writeJson(PRODUCTS_FILE, products);
  res.json(products[index]);
});

app.delete('/api/products/:id', authCheck, (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const existing = products.find(p => p.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  for (const image of existing.images || []) {
    if (image.startsWith('data/uploads/')) {
      const full = path.join(ROOT, image);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
  }
  writeJson(PRODUCTS_FILE, products.filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

app.post('/api/upload', authCheck, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ path: `data/uploads/${req.file.filename}` });
});

app.get('/api/media', (_, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).map(name => ({ name, path: `data/uploads/${name}` }));
  res.json(files.sort((a, b) => b.name.localeCompare(a.name)));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path.includes('.')) return next();
  return res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Wild Bloom rebuild running on http://localhost:${PORT}`);
});
