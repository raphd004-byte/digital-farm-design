const fs = require('fs');
const path = require('path');
const express = require('express');

const DATA_FILE = path.join(__dirname, 'data', 'farm-data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = {
      fruits: [
        { id: 'f1', name: 'Tree Tomatoes', variety: 'Red Origi', status: 'in_stock', price: 800, unit: 'kg', notes: ' ripe, sweet, harvested this week', stock_kg: 45, image: '' },
        { id: 'f2', name: 'Passion Fruit', variety: 'Purple', status: 'in_stock', price: 1200, unit: 'kg', notes: ' aromatic, purple skin', stock_kg: 30, image: '' },
        { id: 'f3', name: 'Avocado', variety: 'Hass', status: 'in_stock', price: 1500, unit: 'kg', notes: ' buttery, creamy', stock_kg: 60, image: '' },
        { id: 'f4', name: 'Mango', variety: 'Apple Mango', status: 'low_stock', price: 1000, unit: 'kg', notes: ' sweet, fibreless', stock_kg: 12, image: '' },
        { id: 'f5', name: 'French Beans', variety: 'Fine Quality', status: 'in_stock', price: 900, unit: 'kg', notes: ' tender, fresh pick', stock_kg: 25, image: '' },
        { id: 'f6', name: 'Macadamia Nuts', variety: 'Raw', status: 'in_stock', price: 5000, unit: 'kg', notes: ' roasted or raw available', stock_kg: 20, image: '' }
      ],
      harvests: [
        { id: 'h1', fruit_id: 'f1', date: '2026-09-01', kg: 20, quality: 'A', notes: 'First big pick of the season' },
        { id: 'h2', fruit_id: 'f2', date: '2026-09-03', kg: 15, quality: 'A', notes: '' },
        { id: 'h3', fruit_id: 'f3', date: '2026-09-05', kg: 30, quality: 'A', notes: '' },
        { id: 'h4', fruit_id: 'f5', date: '2026-09-07', kg: 18, quality: 'B+', notes: 'Slightly smaller batch' },
        { id: 'h5', fruit_id: 'f1', date: '2026-09-10', kg: 25, quality: 'A', notes: 'Good yield' }
      ],
      sales: [
        { id: 's1', fruit_id: 'f1', date: '2026-09-04', kg: 8, price_per_kg: 800, customer: 'Maria K.', paid: true, payment_method: 'M-Pesa', notes: '' },
        { id: 's2', fruit_id: 'f2', date: '2026-09-06', kg: 5, price_per_kg: 1200, customer: 'John M.', paid: true, payment_method: 'Cash', notes: '' },
        { id: 's3', fruit_id: 'f3', date: '2026-09-08', kg: 12, price_per_kg: 1500, customer: 'Fresh Market Co.', paid: false, payment_method: '', notes: 'Invoice sent, due in 7 days' },
        { id: 's4', fruit_id: 'f5', date: '2026-09-11', kg: 10, price_per_kg: 900, customer: 'Local Restaurant', paid: true, payment_method: 'Bank Transfer', notes: '' },
        { id: 's5', fruit_id: 'f6', date: '2026-09-13', kg: 4, price_per_kg: 5000, customer: 'Samuel W.', paid: true, payment_method: 'M-Pesa', notes: '' }
      ],
      workers: [
        { id: 'w1', name: 'Joseph O.', role: 'Harvest Lead', status: 'active', tasks: 'Supervising morning harvest, training new pickers', phone: '+254 701 234567' },
        { id: 'w2', name: 'Grace N.', role: 'Packhouse', status: 'active', tasks: 'Sorting, grading, packing', phone: '+254 712 345678' },
        { id: 'w3', name: 'David M.', role: 'Delivery', status: 'active', tasks: 'Transporting orders to customers', phone: '+254 723 456789' },
        { id: 'w4', name: 'Mercy A.', role: 'General Farm Hand', status: 'active', tasks: 'Weeding, irrigation, general support', phone: '+254 734 567890' }
      ],
      costs: [
        { id: 'c1', date: '2026-09-01', category: 'inputs', description: 'Organic fertilizer (50kg bag)', amount: 4500, paid: true },
        { id: 'c2', date: '2026-09-03', category: 'labour', description: 'Harvest team stipends (week 1)', amount: 8000, paid: true },
        { id: 'c3', date: '2026-09-05', category: 'inputs', description: 'Spray tank and nozzles', amount: 2200, paid: true },
        { id: 'c4', date: '2026-09-08', category: 'transport', description: 'Fuel for delivery trips', amount: 3500, paid: false },
        { id: 'c5', date: '2026-09-10', category: 'labour', description: 'Packhouse assistant wages', amount: 5000, paid: true }
      ],
      site: {
        title: "Mama Njeri's Organic Farm",
        tagline: "Fresh from our soil to your table.",
        story: "Mama Njeri's Organic Farm sits on the fertile slopes of Kahawa, where the red volcanic soil and morning mist give our fruits their rich flavour. We started in 2018 with just two trees and a small patch of beans — today we grow tree tomatoes, avocados, mangoes, passion fruit, French beans, and macadamia nuts using only organic methods. Every harvest is hand-picked at peak ripeness and packed the same day so you get fruit that tastes like the farm it came from. We believe in honest farming: no shortcuts, no chemicals, just good soil and careful hands. When you buy from us, you're not just getting fresh fruit — you're supporting a small family farm and the people who tend it.",
        contact: {
          phone: '+254 700 123456',
          email: 'mamanjerifarmu@gmail.com',
          location: 'Kahawa, Ruiru — 30 min from Nairobi CBD',
          hours: 'Monday to Saturday, 7:00 AM to 6:00 PM',
          directions: 'Turn off Thika Road at the Kahawa Bypass, follow the signs past the tea factory. Our gate is painted green, 200 metres on the right.',
          lat: -1.1500,
          lng: 36.8500
        },
        social: {
          facebook: 'https://facebook.com/mamanjerifarmu',
          instagram: 'https://instagram.com/mamanjerifarmu',
          whatsapp: '+254700123456'
        },
        store_enabled: true,
        store_note: 'Pre-orders welcome. We confirm availability and arrange delivery or pickup within 24 hours. For bulk orders (20kg+), a small discount applies — call or WhatsApp us to arrange.',
        seo: {
          description: "Mama Njeri's Organic Farm grows fresh tree tomatoes, avocados, mangoes, passion fruit, French beans, and macadamia nuts near Nairobi. Hand-picked, organic, delivered to your door.",
          keywords: 'organic farm Nairobi, tree tomatoes, avocados Kenya, fresh fruit delivery, macadamia nuts, French beans, passion fruit, farm near Ruiru, healthy fruit Kenya'
        },
        dashboard_notes: [
          { id: 'dn1', title: 'This Month\'s Goal', body: 'Sell 500kg of tree tomatoes and 200kg of avocados. Current: 45kg tomatoes, 60kg avocados in stock.', color: 'green' },
          { id: 'dn2', title: 'Reminder', body: 'Restock French beans from the lower plot next Tuesday. Call Joseph to arrange.', color: 'amber' }
        ]
      }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

// Helpers
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function getById(arr, id) { return arr.find(i => i.id === id); }

function updateById(arr, id, patch) {
  const idx = arr.findIndex(i => i.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch };
  return arr[idx];
}

function removeById(arr, id) {
  const idx = arr.findIndex(i => i.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

// Computed totals
function computeTotals(data) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlySales = data.sales.filter(s => new Date(s.date) >= startOfMonth);
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.kg * s.price_per_kg, 0);
  const paidRevenue = monthlySales.filter(s => s.paid).reduce((sum, s) => sum + s.kg * s.price_per_kg, 0);
  const unpaidRevenue = monthlySales.filter(s => !s.paid).reduce((sum, s) => sum + s.kg * s.price_per_kg, 0);
  
  const monthlyCosts = data.costs.filter(c => new Date(c.date) >= startOfMonth);
  const totalCosts = monthlyCosts.reduce((sum, c) => sum + c.amount, 0);
  const paidCosts = monthlyCosts.filter(c => c.paid).reduce((sum, c) => sum + c.amount, 0);
  const unpaidCosts = monthlyCosts.filter(c => !c.paid).reduce((sum, c) => sum + c.amount, 0);
  
  const profit = monthlyRevenue - totalCosts;
  
  // Best-selling fruit this month
  const fruitSales = {};
  monthlySales.forEach(s => {
    const fruit = data.fruits.find(f => f.id === s.fruit_id);
    if (fruit) {
      if (!fruitSales[fruit.id]) fruitSales[fruit.id] = { name: fruit.name, kg: 0, revenue: 0 };
      fruitSales[fruit.id].kg += s.kg;
      fruitSales[fruit.id].revenue += s.kg * s.price_per_kg;
    }
  });
  const bestSeller = Object.values(fruitSales).sort((a, b) => b.kg - a.kg)[0] || null;
  
  // Stock summary
  const stockValue = data.fruits
    .filter(f => f.status === 'in_stock' || f.status === 'low_stock')
    .reduce((sum, f) => sum + (f.stock_kg * f.price), 0);
  
  // Harvest summary this month
  const monthlyHarvests = data.harvests.filter(h => new Date(h.date) >= startOfMonth);
  const totalHarvestKg = monthlyHarvests.reduce((sum, h) => sum + h.kg, 0);
  
  return {
    monthly: { revenue: monthlyRevenue, paid: paidRevenue, unpaid: unpaidRevenue, costs: totalCosts, paidCosts: paidCosts, unpaidCosts: unpaidCosts, profit },
    bestSeller,
    stockValue,
    totalHarvestKg,
    totalHarvests: monthlyHarvests.length,
    totalSales: monthlySales.length,
    totalUnpaidInvoices: monthlySales.filter(s => !s.paid).length
  };
}

// Routes
module.exports = function(app) {
  // ---- DATA ROUTES ----
  
  // GET all data (for admin dashboard)
  app.get('/api/data', (req, res) => {
    const data = loadData();
    data.totals = computeTotals(data);
    res.json(data);
  });

  // ---- FRUITS (shared foundation) ----
  app.get('/api/fruits', (req, res) => {
    const data = loadData();
    res.json(data.fruits);
  });

  app.get('/api/fruits/:id', (req, res) => {
    const data = loadData();
    const fruit = getById(data.fruits, req.params.id);
    if (!fruit) return res.status(404).json({ error: 'Fruit not found' });
    res.json(fruit);
  });

  app.post('/api/fruits', (req, res) => {
    const data = loadData();
    const fruit = {
      id: genId(),
      name: req.body.name || 'New Fruit',
      variety: req.body.variety || '',
      status: req.body.status || 'in_stock',
      price: req.body.price || 0,
      unit: req.body.unit || 'kg',
      notes: req.body.notes || '',
      stock_kg: req.body.stock_kg || 0,
      image: req.body.image || ''
    };
    data.fruits.push(fruit);
    saveData(data);
    res.status(201).json(fruit);
  });

  app.put('/api/fruits/:id', (req, res) => {
    const data = loadData();
    const fruit = updateById(data.fruits, req.params.id, req.body);
    if (!fruit) return res.status(404).json({ error: 'Fruit not found' });
    saveData(data);
    res.json(fruit);
  });

  app.delete('/api/fruits/:id', (req, res) => {
    const data = loadData();
    const removed = removeById(data.fruits, req.params.id);
    if (!removed) return res.status(404).json({ error: 'Fruit not found' });
    saveData(data);
    res.json({ ok: true });
  });

  // ---- HARVESTS ----
  app.get('/api/harvests', (req, res) => {
    const data = loadData();
    res.json(data.harvests.map(h => {
      const fruit = getById(data.fruits, h.fruit_id);
      return { ...h, fruit_name: fruit ? fruit.name : '?', fruit_variety: fruit ? fruit.variety : '' };
    }));
  });

  app.post('/api/harvests', (req, res) => {
    const data = loadData();
    const harvest = {
      id: genId(),
      fruit_id: req.body.fruit_id,
      date: req.body.date || new Date().toISOString().slice(0, 10),
      kg: req.body.kg || 0,
      quality: req.body.quality || 'A',
      notes: req.body.notes || ''
    };
    data.harvests.push(harvest);
    // Update stock
    const fruit = getById(data.fruits, harvest.fruit_id);
    if (fruit) {
      fruit.stock_kg = (fruit.stock_kg || 0) + harvest.kg;
      fruit.status = fruit.stock_kg > 20 ? 'in_stock' : fruit.stock_kg > 0 ? 'low_stock' : 'out_of_stock';
    }
    saveData(data);
    res.status(201).json(harvest);
  });

  app.put('/api/harvests/:id', (req, res) => {
    const data = loadData();
    const harvest = updateById(data.harvests, req.params.id, req.body);
    if (!harvest) return res.status(404).json({ error: 'Harvest not found' });
    saveData(data);
    res.json(harvest);
  });

  app.delete('/api/harvests/:id', (req, res) => {
    const data = loadData();
    const harvest = getById(data.harvests, req.params.id);
    if (!harvest) return res.status(404).json({ error: 'Harvest not found' });
    
    // Reverse stock update
    const fruit = getById(data.fruits, harvest.fruit_id);
    if (fruit) {
      fruit.stock_kg = Math.max(0, (fruit.stock_kg || 0) - harvest.kg);
      fruit.status = fruit.stock_kg > 20 ? 'in_stock' : fruit.stock_kg > 0 ? 'low_stock' : 'out_of_stock';
    }
    
    removeById(data.harvests, req.params.id);
    saveData(data);
    res.json({ ok: true });
  });

  // ---- SALES ----
  app.get('/api/sales', (req, res) => {
    const data = loadData();
    res.json(data.sales.map(s => {
      const fruit = getById(data.fruits, s.fruit_id);
      return { ...s, fruit_name: fruit ? fruit.name : '?', fruit_variety: fruit ? fruit.variety : '' };
    }));
  });

  app.post('/api/sales', (req, res) => {
    const data = loadData();
    const sale = {
      id: genId(),
      fruit_id: req.body.fruit_id,
      date: req.body.date || new Date().toISOString().slice(0, 10),
      kg: req.body.kg || 0,
      price_per_kg: req.body.price_per_kg || 0,
      customer: req.body.customer || 'Walk-in customer',
      paid: req.body.paid || false,
      payment_method: req.body.payment_method || '',
      notes: req.body.notes || ''
    };
    data.sales.push(sale);
    // Reduce stock
    const fruit = getById(data.fruits, sale.fruit_id);
    if (fruit) {
      fruit.stock_kg = Math.max(0, (fruit.stock_kg || 0) - sale.kg);
      fruit.status = fruit.stock_kg > 20 ? 'in_stock' : fruit.stock_kg > 0 ? 'low_stock' : 'out_of_stock';
    }
    saveData(data);
    res.status(201).json(sale);
  });

  app.put('/api/sales/:id', (req, res) => {
    const data = loadData();
    const sale = updateById(data.sales, req.params.id, req.body);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    saveData(data);
    res.json(sale);
  });

  app.delete('/api/sales/:id', (req, res) => {
    const data = loadData();
    const sale = getById(data.sales, req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    
    // Reverse stock reduction
    const fruit = getById(data.fruits, sale.fruit_id);
    if (fruit) {
      fruit.stock_kg = (fruit.stock_kg || 0) + sale.kg;
      fruit.status = fruit.stock_kg > 20 ? 'in_stock' : fruit.stock_kg > 0 ? 'low_stock' : 'out_of_stock';
    }
    
    removeById(data.sales, req.params.id);
    saveData(data);
    res.json({ ok: true });
  });

  // ---- WORKERS ----
  app.get('/api/workers', (req, res) => {
    const data = loadData();
    res.json(data.workers);
  });

  app.post('/api/workers', (req, res) => {
    const data = loadData();
    const worker = {
      id: genId(),
      name: req.body.name || '',
      role: req.body.role || '',
      status: req.body.status || 'active',
      tasks: req.body.tasks || '',
      phone: req.body.phone || ''
    };
    data.workers.push(worker);
    saveData(data);
    res.status(201).json(worker);
  });

  app.put('/api/workers/:id', (req, res) => {
    const data = loadData();
    const worker = updateById(data.workers, req.params.id, req.body);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    saveData(data);
    res.json(worker);
  });

  app.delete('/api/workers/:id', (req, res) => {
    const data = loadData();
    const removed = removeById(data.workers, req.params.id);
    if (!removed) return res.status(404).json({ error: 'Worker not found' });
    saveData(data);
    res.json({ ok: true });
  });

  // ---- COSTS ----
  app.get('/api/costs', (req, res) => {
    const data = loadData();
    res.json(data.costs);
  });

  app.post('/api/costs', (req, res) => {
    const data = loadData();
    const cost = {
      id: genId(),
      date: req.body.date || new Date().toISOString().slice(0, 10),
      category: req.body.category || 'other',
      description: req.body.description || '',
      amount: req.body.amount || 0,
      paid: req.body.paid || false
    };
    data.costs.push(cost);
    saveData(data);
    res.status(201).json(cost);
  });

  app.put('/api/costs/:id', (req, res) => {
    const data = loadData();
    const cost = updateById(data.costs, req.params.id, req.body);
    if (!cost) return res.status(404).json({ error: 'Cost not found' });
    saveData(data);
    res.json(cost);
  });

  app.delete('/api/costs/:id', (req, res) => {
    const data = loadData();
    const removed = removeById(data.costs, req.params.id);
    if (!removed) return res.status(404).json({ error: 'Cost not found' });
    saveData(data);
    res.json({ ok: true });
  });

  // ---- SITE CONTENT (for website) ----
  app.get('/api/site', (req, res) => {
    const data = loadData();
    res.json(data.site);
  });

  app.put('/api/site', (req, res) => {
    const data = loadData();
    data.site = { ...data.site, ...req.body };
    saveData(data);
    res.json(data.site);
  });

  // ---- DASHBOARD NOTES (editable tiles on the dashboard) ----
  app.get('/api/dashboard-notes', (req, res) => {
    const data = loadData();
    res.json(data.site.dashboard_notes || []);
  });

  app.post('/api/dashboard-notes', (req, res) => {
    const data = loadData();
    const note = {
      id: genId(),
      title: req.body.title || 'New Note',
      body: req.body.body || '',
      color: req.body.color || 'green'
    };
    if (!data.site.dashboard_notes) data.site.dashboard_notes = [];
    data.site.dashboard_notes.push(note);
    saveData(data);
    res.status(201).json(note);
  });

  app.put('/api/dashboard-notes/:id', (req, res) => {
    const data = loadData();
    const notes = data.site.dashboard_notes || [];
    const idx = notes.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Note not found' });
    notes[idx] = { ...notes[idx], ...req.body };
    saveData(data);
    res.json(notes[idx]);
  });

  app.delete('/api/dashboard-notes/:id', (req, res) => {
    const data = loadData();
    const notes = data.site.dashboard_notes || [];
    const idx = notes.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Note not found' });
    notes.splice(idx, 1);
    saveData(data);
    res.json({ ok: true });
  });

  // ---- STATIC (serves CSS, JS, images, admin.html, etc.) ----
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Serve admin.html at /admin
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
  });

  // SPA fallback — serve index.html for any non-API, non-static route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
};
