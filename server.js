/**
 * DRAVSPORTS WEARS - Full-Stack Express Server & Analytics Backend
 * Location: Chuka Town, Tharaka Nithi County, Kenya
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// File Paths
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

// Deep merge helper so older saved content files still receive newly added default fields
function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }
  if (base && typeof base === 'object') {
    const out = Object.assign({}, base);
    if (override && typeof override === 'object' && !Array.isArray(override)) {
      Object.keys(override).forEach(key => {
        out[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
      });
    }
    return out;
  }
  return override === undefined ? base : override;
}

// Helper Functions for Persistence
function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return fallback;
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Initial Data Setup
let productsData = readJSON(PRODUCTS_FILE, [
  {
    id: 'prod_1',
    title: 'Nike Dri-FIT Pro Football Kit 2026',
    category: 'football',
    price: 2800,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: 'images/football_kit.png',
    description: 'Breathable, lightweight football jersey & shorts set.',
    createdAt: Date.now() - 1000000
  },
  {
    id: 'prod_2',
    title: 'ZoomX Marathon Running Sneakers',
    category: 'athletics',
    price: 4500,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    image: 'images/running_sneakers.png',
    description: 'High-bounce carbon plate running sneakers.',
    createdAt: Date.now() - 900000
  },
  {
    id: 'prod_3',
    title: 'Elite Compression Gym Set (Top + Tights)',
    category: 'gym',
    price: 3200,
    sizes: ['M', 'L', 'XL'],
    image: 'images/gym_wear.png',
    description: 'Ergonomic athletic compression fit for workouts.',
    createdAt: Date.now() - 800000
  }
]);

// Seed sample analytics if empty
let analyticsData = readJSON(ANALYTICS_FILE, {
  totalVisits: 284,
  uniqueVisitors: 142,
  dailyVisits: {
    [new Date().toISOString().split('T')[0]]: 48
  },
  locationStats: {
    'Chuka Town': 112,
    'Nairobi': 65,
    'Meru': 42,
    'Tharaka Nithi': 38,
    'Mombasa': 27
  },
  visitorsLog: []
});

let ordersData = readJSON(ORDERS_FILE, []);

// Default editable website content. Everything here can be changed from the admin panel.
const DEFAULT_CONTENT = {
  brand: {
    namePrefix: 'DRAV',
    nameSuffix: 'SPORTS'
  },
  contact: {
    phone: '0720357085',
    phoneSecondary: '',
    whatsapp: '254720357085',
    email: 'dravtechcompany@gmail.com',
    emailSecondary: ''
  },
  hero: {
    locationPill: 'Chuka Town & Nairobi Branches • Delivery Countrywide 🇰🇪',
    titlePrefix: 'ELEVATE YOUR GAME WITH',
    titleHighlight: 'PREMIUM SPORTSWEAR',
    description: 'Discover original, high-performance athletic apparel, football kits, running sneakers, gym compression wear, and sports gear. Fast doorstep & courier delivery across all 47 counties in Kenya!',
    primaryCta: 'Explore Sports Catalog',
    whatsappCta: 'Chat on WhatsApp',
    stats: [
      { value: '100+', label: 'Sports Gear Uploads' },
      { value: '47', label: 'Counties Delivery' },
      { value: '2', label: 'Branches: Chuka & Nairobi' }
    ]
  },
  about: {
    tag: 'About DravSports Wears',
    title: 'Your Premier Sports Partner in Tharaka Nithi, Nairobi & Countrywide Kenya',
    paragraphs: [
      'Founded and operating from our branches in Chuka Town and Nairobi, DravSports Wears is committed to providing athletes, local teams, fitness enthusiasts, and sports lovers with top-tier athletic wear at affordable prices.',
      'Whether you need custom team jerseys, high-cushion running sneakers for training, compression tights for the gym, or swimming accessories, we deliver directly to your doorstep anywhere in Kenya through trusted courier and parcel networks.'
    ],
    features: [
      { icon: 'fas fa-truck-fast', title: 'Countrywide Delivery', text: 'Express dispatch from Chuka and Nairobi to all 47 counties.' },
      { icon: 'fas fa-shield-alt', title: 'Verified Quality', text: 'Original durable fabrics, breathable moisture-wicking technology.' },
      { icon: 'fab fa-whatsapp', title: 'Instant WhatsApp Orders', text: 'Direct contact with our team for quick size confirmations and fast dispatch.' },
      { icon: 'fas fa-tags', title: 'Transparent Prices', text: 'All prices listed clearly with zero hidden costs.' }
    ]
  },
  team: {
    tag: 'Meet Our Staff',
    title: 'The Dedicated Team Behind DravSports',
    subtitle: 'Passionate sports enthusiasts delivering excellence from Chuka Town and Nairobi to your doorstep.',
    members: [
      {
        name: 'Fredrick Mbugua',
        role: 'Founder & CEO',
        location: 'Nairobi & Chuka Town',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80'
      },
      {
        name: 'Derrick Mutembei',
        role: 'General Manager, Chuka Branch',
        location: 'Chuka Town, Tharaka Nithi',
        image: 'images/team_derrick.png'
      },
      {
        name: 'Ann Kageni',
        role: 'Operations & Sales Lead',
        location: 'Chuka Town, Tharaka Nithi',
        image: 'images/team_ann.png'
      },
      {
        name: 'Victor Mwenda',
        role: 'Head of Logistics & Delivery',
        location: 'Countrywide Operations',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dennis Njeru',
        role: 'Sports Apparel Procurement',
        location: 'Nairobi Branch',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  branches: {
    tag: 'Our Branches',
    title: 'Visit Us At Either Branch',
    subtitle: 'Two convenient locations in Kenya. Walk in, or order online and we deliver countrywide.',
    items: [
      {
        name: 'Chuka Town Branch',
        address: 'Commercial Center Near University Gate 1, Chuka Town, Tharaka Nithi County, Kenya.',
        phone: '0720357085',
        hours: 'Mon - Sat: 8:00 AM - 7:00 PM'
      },
      {
        name: 'Nairobi Branch',
        address: 'Nairobi, Kenya.',
        phone: '0720357085',
        hours: 'Mon - Sat: 8:00 AM - 7:00 PM'
      }
    ]
  },
  contactSection: {
    tag: 'Get In Touch',
    title: 'Contact & Location Info',
    subtitle: 'Reach out directly or connect with us on WhatsApp for fast order verification and delivery countrywide.',
    address: 'Chuka Town, Commercial Center Near University Gate 1, Tharaka Nithi County & Nairobi, Kenya.',
    storeHours: 'Mon - Sat: 8:00 AM - 7:00 PM',
    deliveryNote: 'Countrywide Delivery (47 Counties)'
  },
  footer: {
    description: 'Your premier sportswear platform with branches in Chuka Town and Nairobi. Quality sports gear delivered nationwide across Kenya.',
    copyright: '© 2026 DravSports Wears. All Rights Reserved. Chuka Town & Nairobi, Kenya.'
  }
};

// Merge saved content over the defaults so no field is ever missing
let contentData = deepMerge(DEFAULT_CONTENT, readJSON(CONTENT_FILE, {}));

// Middleware to track website visits
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    return next();
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  // Increment total visits
  analyticsData.totalVisits = (analyticsData.totalVisits || 0) + 1;
  
  // Increment daily visits for dateStr
  if (!analyticsData.dailyVisits[dateStr]) {
    analyticsData.dailyVisits[dateStr] = 0;
  }
  analyticsData.dailyVisits[dateStr] += 1;

  // Add visitor entry to log (keep last 100)
  const townLocations = ['Chuka Town', 'Tharaka Nithi', 'Nairobi', 'Meru', 'Embu', 'Mombasa', 'Eldoret'];
  const simulatedTown = townLocations[Math.floor(Math.random() * townLocations.length)];

  analyticsData.visitorsLog.unshift({
    id: 'vis_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ip: clientIp,
    page: req.path,
    device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    location: simulatedTown
  });

  if (analyticsData.visitorsLog.length > 100) {
    analyticsData.visitorsLog = analyticsData.visitorsLog.slice(0, 100);
  }

  // Update location counters
  analyticsData.locationStats[simulatedTown] = (analyticsData.locationStats[simulatedTown] || 0) + 1;
  analyticsData.uniqueVisitors = Object.keys(analyticsData.visitorsLog.reduce((acc, log) => {
    acc[log.ip] = true;
    return acc;
  }, {})).length;

  writeJSON(ANALYTICS_FILE, analyticsData);
  next();
});

// API: Record Explicit Visit Ping from Frontend
app.post('/api/visit', (req, res) => {
  const { page, location } = req.body;
  const dateStr = new Date().toISOString().split('T')[0];
  
  analyticsData.totalVisits += 1;
  analyticsData.dailyVisits[dateStr] = (analyticsData.dailyVisits[dateStr] || 0) + 1;

  const loc = location || 'Chuka Town';
  analyticsData.locationStats[loc] = (analyticsData.locationStats[loc] || 0) + 1;

  analyticsData.visitorsLog.unshift({
    id: 'vis_' + Date.now(),
    timestamp: new Date().toISOString(),
    ip: req.ip || '127.0.0.1',
    page: page || '/',
    device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
    location: loc
  });

  writeJSON(ANALYTICS_FILE, analyticsData);
  res.json({ success: true, totalVisits: analyticsData.totalVisits, dailyVisitsToday: analyticsData.dailyVisits[dateStr] });
});

// API: Get Analytics Data (for Backend Dashboard)
app.get('/api/analytics', (req, res) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const todayVisits = analyticsData.dailyVisits[dateStr] || 0;

  res.json({
    totalVisits: analyticsData.totalVisits,
    uniqueVisitors: analyticsData.uniqueVisitors,
    todayVisits: todayVisits,
    dailyVisits: analyticsData.dailyVisits,
    locationStats: analyticsData.locationStats,
    visitorsLog: analyticsData.visitorsLog,
    totalProducts: productsData.length,
    totalOrders: ordersData.length
  });
});

// API: Get editable website content (used to render every section of the storefront)
app.get('/api/content', (req, res) => {
  res.json(contentData);
});

// API: Save website content from the admin panel
app.put('/api/content', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid content payload' });
  }

  contentData = deepMerge(DEFAULT_CONTENT, body);
  writeJSON(CONTENT_FILE, contentData);
  res.json({ success: true, content: contentData });
});

// API: Reset website content back to the built-in defaults
app.post('/api/content/reset', (req, res) => {
  contentData = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  writeJSON(CONTENT_FILE, contentData);
  res.json({ success: true, content: contentData });
});

// API: Get all products
app.get('/api/products', (req, res) => {
  res.json(productsData);
});

// API: Easy Image Upload (Base64 or Form payload)
app.post('/api/upload', (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Extract mime and base64 string
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid Base64 string' });
    }

    const ext = matches[1].split('/')[1] || 'png';
    const cleanFilename = (filename || 'sportswear').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const newFilename = `${cleanFilename}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, newFilename);

    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

    const imageUrl = `/uploads/${newFilename}`;
    res.json({ success: true, imageUrl, filename: newFilename });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// API: Add new sportswear product
app.post('/api/products', (req, res) => {
  const { title, category, price, sizes, image, description } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }

  const newProduct = {
    id: 'prod_' + Date.now(),
    title,
    category: category || 'football',
    price: Number(price),
    sizes: Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map(s => s.trim()) : ['Standard']),
    image: image || 'images/football_kit.png',
    description: description || 'High performance sportswear item from DravSports Wears.',
    createdAt: Date.now()
  };

  productsData.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, productsData);

  res.json({ success: true, product: newProduct });
});

// API: Delete product
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  productsData = productsData.filter(p => p.id !== id);
  writeJSON(PRODUCTS_FILE, productsData);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// API: Customer Orders Endpoint
app.get('/api/orders', (req, res) => {
  res.json(ordersData);
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  order.id = 'ord_' + Date.now();
  order.createdAt = new Date().toISOString();
  order.status = 'Pending Dispatch';
  
  ordersData.unshift(order);
  writeJSON(ORDERS_FILE, ordersData);
  res.json({ success: true, order });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🏆 DravSports Wears Backend Server Running!`);
  console.log(`📍 Location: Chuka Town, Tharaka Nithi County, Kenya`);
  console.log(`🌐 Storefront: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Backend Portal: http://localhost:${PORT}/admin.html`);
  console.log(`===================================================`);
});
