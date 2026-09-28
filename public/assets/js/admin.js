// ========================
// AUTH CHECK
// ========================
(function() {
  fetch('/api/auth/me')
    .then(r => r.json())
    .then(data => {
      if (!data.loggedIn) {
        window.location.href = '/admin/login';
      } else {
        document.getElementById('logoutBtn').style.display = 'inline-flex';
      }
    })
    .catch(() => { window.location.href = '/admin/login'; });
})();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login';
});

// ========================
// GLOBALS
// ========================
let currentData = null;
let editingSection = null;
let editingId = null;
let editingNoteId = null;
const API = '';

// ========================
// UTILITIES
// ========================
async function apiCall(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  };
  const res = await fetch(API + url, opts);
  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try {
      const errBody = await res.json();
      msg += ': ' + (errBody.error || JSON.stringify(errBody));
    } catch { msg += ': ' + (await res.text()); }
    throw new Error(msg);
  }
  if (res.status === 204) return {};
  return res.json();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function fmtPrice(amount) {
  if (amount == null || isNaN(amount)) return 'KES 0';
  return 'KES ' + Number(amount).toLocaleString('en-KE');
}

function statusLabel(status) {
  if (!status) return 'unknown';
  return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// MODAL HELPERS
function openModal(title, bodyHtml, footerHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFoot').innerHTML = footerHtml || '';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function formGroup(label, name, type, value, placeholder, options) {
  let input = '';
  if (type === 'select' && options) {
    input = `<select id="${name}">`;
    options.forEach(o => {
      input += `<option value="${o.value}"${o.value === value ? ' selected' : ''}>${escapeHtml(o.label)}</option>`;
    });
    input += '</select>';
  } else if (type === 'textarea') {
    input = `<textarea id="${name}" rows="3" class="form-textarea" placeholder="${placeholder || ''}">${escapeHtml(value || '')}</textarea>`;
  } else if (type === 'checkbox') {
    input = `<label class="checkbox-label"><input type="checkbox" id="${name}"${value ? ' checked' : ''}> ${label}</label>`;
    return input;
  } else {
    input = `<input type="${type}" id="${name}" value="${escapeHtml(value || '')}" placeholder="${placeholder || ''}">`;
  }
  return `<div class="form-group"><label>${label}</label>${input}</div>`;
}

function modalActions(buttons) {
  return buttons.map(b => `<button class="btn ${b.class}" id="${b.id}">${b.label}</button>`).join('');
}

// ========================
// DATA LOADING
// ========================
async function loadAllData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Not authenticated');
    currentData = await res.json();
    document.getElementById('lastUpdated').textContent = 'Updated ' + new Date().toLocaleTimeString();
    renderDashboard();
    renderFruits();
    renderHarvests();
    renderSales();
    renderWorkers();
    renderCosts();
    renderEmployeeNotes();
    renderStock();
  } catch (err) {
    console.error('Auth error:', err);
    window.location.href = '/admin/login';
  }
}

// ========================
// DASHBOARD
// ========================
function renderDashboard() {
  if (!currentData) return;
  const t = currentData.totals;
  const statsGrid = document.getElementById('statsGrid');

  statsGrid.innerHTML = `
    <div class="stat-card green">
      <div class="stat-card-label">Revenue (This Month)</div>
      <div class="stat-card-value">${fmtPrice(t.monthly.revenue)}</div>
      <div class="stat-card-sub">${t.monthly.sales || 0} sales · ${t.monthly.paid ? fmtPrice(t.monthly.paid) : 'KES 0'} paid</div>
    </div>
    <div class="stat-card amber">
      <div class="stat-card-label">Costs (This Month)</div>
      <div class="stat-card-value">${fmtPrice(t.monthly.costs)}</div>
      <div class="stat-card-sub">${t.monthly.unpaidCosts ? fmtPrice(t.monthly.unpaidCosts) : 'KES 0'} unpaid</div>
    </div>
    <div class="stat-card ${t.monthly.profit >= 0 ? 'green' : 'danger'}">
      <div class="stat-card-label">Profit / Loss</div>
      <div class="stat-card-value">${fmtPrice(t.monthly.profit)}</div>
      <div class="stat-card-sub">${t.monthly.profit >= 0 ? 'Profitable month' : 'Costs exceed revenue'}</div>
    </div>
    <div class="stat-card plum">
      <div class="stat-card-label">Stock Value</div>
      <div class="stat-card-value">${fmtPrice(t.stockValue)}</div>
      <div class="stat-card-sub">${currentData.fruits.filter(f => f.status !== 'out_of_stock').length} fruits in stock</div>
    </div>
  `;

  // Sales mini chart
  const sales = currentData.sales || [];
  const salesBadge = document.getElementById('salesBadge');
  if (sales.length) {
    salesBadge.textContent = sales.length + ' sales';
  } else {
    salesBadge.textContent = 'No sales';
  }

  const miniChart = document.getElementById('salesMiniChart');
  if (sales.length) {
    const maxAmt = Math.max(...sales.map(s => s.kg * s.price_per_kg));
    miniChart.innerHTML = sales.slice(-12).reverse().map(s => {
      const h = maxAmt > 0 ? ((s.kg * s.price_per_kg) / maxAmt) * 100 : 0;
      return `<div class="mini-bar ${s.paid ? 'paid' : 'unpaid'}" style="height:${Math.max(h, 2)}px" title="${escapeHtml(s.customer || '')} — ${fmtPrice(s.kg * s.price_per_kg)}"></div>`;
    }).join('');
  } else {
    miniChart.innerHTML = '<div class="mini-bar" style="height:2px;background:var(--ink-soft);opacity:0.3"></div>';
  }

  // Best seller
  const bestSellerInfo = document.getElementById('bestSellerInfo');
  const bestSellerBadge = document.getElementById('bestSellerBadge');
  if (t.bestSeller) {
    bestSellerBadge.textContent = t.bestSeller.name;
    bestSellerInfo.innerHTML = `
      <div class="best-seller-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8"/></svg>
      </div>
      <div>
        <div class="best-seller-name">${escapeHtml(t.bestSeller.name)}</div>
        <div class="best-seller-detail">${t.bestSeller.kg} kg sold · ${fmtPrice(t.bestSeller.revenue)} revenue</div>
      </div>`;
  } else {
    bestSellerBadge.textContent = 'No sales';
    bestSellerInfo.innerHTML = '<p class="text-muted">No sales recorded this month yet.</p>';
  }

  // Stock summary
  const stockSummary = document.getElementById('stockSummary');
  const inStock = currentData.fruits.filter(f => f.status === 'in_stock');
  const lowStock = currentData.fruits.filter(f => f.status === 'low_stock');
  const outOfStock = currentData.fruits.filter(f => f.status === 'out_of_stock');
  stockSummary.innerHTML = `
    <div class="stock-row"><span class="stock-row-name">In Stock</span><span class="stock-row-value positive">${inStock.length} fruits</span></div>
    ${lowStock.length ? `<div class="stock-row"><span class="stock-row-name">Low Stock</span><span class="stock-row-value warning">${lowStock.length} fruits</span></div>` : ''}
    ${outOfStock.length ? `<div class="stock-row" style="color:var(--danger)"><span class="stock-row-name">Out of Stock</span><span class="stock-row-value" style="color:var(--danger)">${outOfStock.length} fruits</span></div>` : ''}
    <div class="stock-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--paper-line)"><span class="stock-row-name">Total harvest this month</span><span class="stock-row-value">${t.totalHarvestKg} kg (${t.totalHarvests} picks)</span></div>
  `;

  // Profit view
  const profitView = document.getElementById('profitView');
  profitView.innerHTML = `
    <div class="profit-row">
      <span class="profit-row-label">
        <svg class="profit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Revenue
      </span>
      <span class="profit-row-value positive">${fmtPrice(t.monthly.revenue)}</span>
    </div>
    <div class="profit-row">
      <span class="profit-row-label">
        <svg class="profit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Costs
      </span>
      <span class="profit-row-value negative">-${fmtPrice(t.monthly.costs)}</span>
    </div>
    <div class="profit-divider"></div>
    <div class="profit-total">
      <span style="color:var(--ink-soft);font-size:14px;font-family:var(--font-sans);font-weight:400">Net</span>
      <span style="margin-left:8px">${fmtPrice(t.monthly.profit)}</span>
    </div>
  `;
}

// ========================
// FRUITS
// ========================
function renderFruits() {
  const tbody = document.getElementById('fruitsBody');
  if (!currentData || !currentData.fruits.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No fruits added yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = currentData.fruits.map(f => `
    <tr>
      <td><div class="fruit-cell"><span class="fruit-name">${escapeHtml(f.name)}</span>${f.variety ? `<span class="fruit-variety">${escapeHtml(f.variety)}</span>` : ''}</div></td>
      <td>${escapeHtml(f.variety || '—')}</td>
      <td><span class="status-badge ${f.status}">${statusLabel(f.status)}</span></td>
      <td class="price-cell">${fmtPrice(f.price)} <span class="unit">/${f.unit}</span></td>
      <td>${f.stock_kg} <span style="font-size:12px;color:var(--ink-soft)">kg</span></td>
      <td style="color:var(--ink-soft);font-size:12.5px;max-width:160px">${escapeHtml(f.notes || '—')}</td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${f.id}" data-section="fruits" title="Edit fruit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${f.id}" data-section="fruits" title="Delete fruit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddFruit() {
  editingSection = 'fruits';
  editingId = null;
  openModal('Add Fruit',
    `<div class="modal-form">
      ${formGroup('Fruit name *', 'f_name', 'text', '', 'e.g. Tree Tomatoes')}
      ${formGroup('Variety', 'f_variety', 'text', '', 'e.g. Red Origi')}
      ${formGroup('Status', 'f_status', 'select', 'in_stock', '', [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' }
      ])}
      ${formGroup('Price per ' + '{unit}' + ' (KES)', 'f_price', 'number', '', 'e.g. 800')}
      ${formGroup('Unit', 'f_unit', 'text', 'kg', 'e.g. kg, dozen')}
      ${formGroup('Current stock (kg)', 'f_stock', 'number', '0', 'e.g. 45')}
      ${formGroup('Notes', 'f_notes', 'textarea', '', 'Ripeness, flavour notes, etc.')}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Add Fruit', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      name: document.getElementById('f_name').value.trim(),
      variety: document.getElementById('f_variety').value.trim(),
      status: document.getElementById('f_status').value,
      price: parseFloat(document.getElementById('f_price').value) || 0,
      unit: document.getElementById('f_unit').value.trim() || 'kg',
      stock_kg: parseFloat(document.getElementById('f_stock').value) || 0,
      notes: document.getElementById('f_notes').value.trim()
    };
    if (!body.name) { alert('Please enter a fruit name.'); return; }
    try {
      await apiCall('POST', '/fruits', body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditFruit(id) {
  const f = currentData.fruits.find(x => x.id === id);
  if (!f) return;
  editingSection = 'fruits';
  editingId = id;
  openModal('Edit Fruit',
    `<div class="modal-form">
      ${formGroup('Fruit name *', 'f_name', 'text', f.name)}
      ${formGroup('Variety', 'f_variety', 'text', f.variety)}
      ${formGroup('Status', 'f_status', 'select', f.status, '', [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' }
      ])}
      ${formGroup('Price per ' + '{unit}' + ' (KES)', 'f_price', 'number', f.price)}
      ${formGroup('Unit', 'f_unit', 'text', f.unit)}
      ${formGroup('Current stock (kg)', 'f_stock', 'number', f.stock_kg)}
      ${formGroup('Notes', 'f_notes', 'textarea', f.notes)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      name: document.getElementById('f_name').value.trim(),
      variety: document.getElementById('f_variety').value.trim(),
      status: document.getElementById('f_status').value,
      price: parseFloat(document.getElementById('f_price').value) || 0,
      unit: document.getElementById('f_unit').value.trim() || 'kg',
      stock_kg: parseFloat(document.getElementById('f_stock').value) || 0,
      notes: document.getElementById('f_notes').value.trim()
    };
    if (!body.name) { alert('Please enter a fruit name.'); return; }
    try {
      await apiCall('PUT', '/fruits/' + id, body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function confirmDeleteFruit(id) {
  const f = currentData.fruits.find(x => x.id === id);
  openModal('Delete Fruit?',
    `<p style="color:var(--ink-soft)">Remove <strong>${escapeHtml(f?.name || '')}</strong>? This cannot be undone.</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/fruits/' + id);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
}

// ========================
// HARVESTS
// ========================
function renderHarvests() {
  const tbody = document.getElementById('harvestsBody');
  if (!currentData || !currentData.harvests.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No harvests recorded yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = currentData.harvests.map(h => `
    <tr>
      <td>${formatDate(h.date)}</td>
      <td>
        <div class="fruit-cell">
          <span class="fruit-name">${escapeHtml(h.fruit_name || '?')}</span>
          ${h.fruit_variety ? `<span class="fruit-variety">${escapeHtml(h.fruit_variety)}</span>` : ''}
        </div>
      </td>
      <td>${h.kg} <span style="font-size:12px;color:var(--ink-soft)">kg</span></td>
      <td><span class="status-badge ${h.quality === 'A' ? 'in_stock' : h.quality === 'B+' ? 'low_stock' : 'out_of_stock'}" style="text-transform:none;letter-spacing:0">${escapeHtml(h.quality)}</span></td>
      <td style="color:var(--ink-soft);font-size:12.5px">${escapeHtml(h.notes || '—')}</td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${h.id}" data-section="harvests" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${h.id}" data-section="harvests" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddHarvest() {
  const fruits = currentData?.fruits.filter(f => f.status !== 'out_of_stock') || [];
  const options = fruits.map(f => ({ value: f.id, label: f.name + (f.variety ? ' (' + f.variety + ')' : '') }));
  if (!options.length) { alert('No fruits available.'); return; }
  editingSection = 'harvests';
  editingId = null;
  openModal('Log Harvest',
    `<div class="modal-form">
      ${formGroup('Fruit *', 'h_fruit_id', 'select', fruits[0]?.id || '', '', options)}
      ${formGroup('Date', 'h_date', 'date', new Date().toISOString().slice(0, 10))}
      ${formGroup('Weight (kg) *', 'h_kg', 'number', '', 'e.g. 20')}
      ${formGroup('Quality', 'h_quality', 'select', 'A', '', [
        { value: 'A', label: 'A — Premium' },
        { value: 'B+', label: 'B+ — Good' },
        { value: 'B', label: 'B — Average' }
      ])}
      ${formGroup('Notes', 'h_notes', 'textarea', '', 'Any observations')}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Log Harvest', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      fruit_id: document.getElementById('h_fruit_id').value,
      date: document.getElementById('h_date').value,
      kg: parseFloat(document.getElementById('h_kg').value) || 0,
      quality: document.getElementById('h_quality').value,
      notes: document.getElementById('h_notes').value.trim()
    };
    if (!body.fruit_id) { alert('Please select a fruit.'); return; }
    if (!body.kg || body.kg <= 0) { alert('Please enter a weight.'); return; }
    try {
      await apiCall('POST', '/harvests', body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditHarvest(id) {
  const h = currentData.harvests.find(x => x.id === id);
  if (!h) return;
  const fruits = currentData?.fruits.filter(f => f.status !== 'out_of_stock') || [];
  const options = fruits.map(f => ({ value: f.id, label: f.name + (f.variety ? ' (' + f.variety + ')' : '') }));
  editingSection = 'harvests';
  editingId = id;
  openModal('Edit Harvest',
    `<div class="modal-form">
      ${formGroup('Fruit *', 'h_fruit_id', 'select', h.fruit_id, '', options)}
      ${formGroup('Date', 'h_date', 'date', h.date)}
      ${formGroup('Weight (kg) *', 'h_kg', 'number', h.kg)}
      ${formGroup('Quality', 'h_quality', 'select', h.quality, '', [
        { value: 'A', label: 'A — Premium' },
        { value: 'B+', label: 'B+ — Good' },
        { value: 'B', label: 'B — Average' }
      ])}
      ${formGroup('Notes', 'h_notes', 'textarea', h.notes)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      fruit_id: document.getElementById('h_fruit_id').value,
      date: document.getElementById('h_date').value,
      kg: parseFloat(document.getElementById('h_kg').value) || 0,
      quality: document.getElementById('h_quality').value,
      notes: document.getElementById('h_notes').value.trim()
    };
    if (!body.fruit_id) { alert('Please select a fruit.'); return; }
    try {
      await apiCall('PUT', '/harvests/' + id, body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function confirmDeleteHarvest(id) {
  const h = currentData.harvests.find(x => x.id === id);
  openModal('Delete Harvest?',
    `<p style="color:var(--ink-soft)">Remove this harvest record of ${h?.kg || 0}kg ${h?.fruit_name || ''}? Stock will be adjusted.</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/harvests/' + id);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
}

// ========================
// SALES
// ========================
function renderSales() {
  const tbody = document.getElementById('salesBody');
  if (!currentData || !currentData.sales.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>No sales recorded yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = currentData.sales.map(s => {
    const total = (s.kg * s.price_per_kg);
    return `
    <tr>
      <td>${formatDate(s.date)}</td>
      <td>
        <div class="fruit-cell">
          <span class="fruit-name">${escapeHtml(s.fruit_name || '?')}</span>
          ${s.fruit_variety ? `<span class="fruit-variety">${escapeHtml(s.fruit_variety)}</span>` : ''}
        </div>
      </td>
      <td>${s.kg} <span style="font-size:12px;color:var(--ink-soft)">kg</span></td>
      <td class="price-cell">${fmtPrice(s.price_per_kg)}</td>
      <td><span class="total-cell positive">${fmtPrice(total)}</span></td>
      <td>${escapeHtml(s.customer || '—')}</td>
      <td>
        <div class="paid-toggle ${s.paid ? 'on' : ''}" data-id="${s.id}" title="Toggle paid status"></div>
        <span style="font-size:12px;margin-left:4px">${s.paid ? 'Paid' : 'Unpaid'}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${s.id}" data-section="sales" title="Edit sale">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${s.id}" data-section="sales" title="Delete sale">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditSale(btn.dataset.id)));
  tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDeleteSale(btn.dataset.id)));
  tbody.querySelectorAll('.paid-toggle').forEach(tog => tog.addEventListener('click', () => toggleSalePaid(tog.dataset.id)));
}

function openAddSale() {
  const fruits = currentData?.fruits.filter(f => f.status !== 'out_of_stock' && f.stock_kg > 0) || [];
  const options = fruits.map(f => ({ value: f.id, label: f.name + (f.variety ? ' (' + f.variety + ')' : '') }));
  if (!options.length) { alert('No fruits available to sell.'); return; }
  editingSection = 'sales';
  editingId = null;
  openModal('Record Sale',
    `<div class="modal-form">
      ${formGroup('Fruit *', 's_fruit_id', 'select', fruits[0]?.id || '', '', options)}
      ${formGroup('Date', 's_date', 'date', new Date().toISOString().slice(0, 10))}
      ${formGroup('Weight (kg) *', 's_kg', 'number', '', 'e.g. 5')}
      ${formGroup('Price per kg (KES) *', 's_price', 'number', '', 'e.g. 800')}
      ${formGroup('Customer *', 's_customer', 'text', '', 'Who bought it?')}
      ${formGroup('Payment method', 's_payment', 'text', '', 'M-Pesa, Cash, etc.')}
      ${formGroup('Paid?', 's_paid', 'checkbox', false)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Record Sale', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      fruit_id: document.getElementById('s_fruit_id').value,
      date: document.getElementById('s_date').value,
      kg: parseFloat(document.getElementById('s_kg').value) || 0,
      price_per_kg: parseFloat(document.getElementById('s_price').value) || 0,
      customer: document.getElementById('s_customer').value.trim(),
      payment_method: document.getElementById('s_payment').value.trim(),
      paid: document.getElementById('s_paid').checked
    };
    if (!body.fruit_id) { alert('Please select a fruit.'); return; }
    if (!body.kg || body.kg <= 0) { alert('Please enter a weight.'); return; }
    if (!body.customer) { alert('Please enter a customer name.'); return; }
    try {
      await apiCall('POST', '/sales', body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditSale(id) {
  const s = currentData.sales.find(x => x.id === id);
  if (!s) return;
  const fruits = currentData?.fruits.filter(f => f.status !== 'out_of_stock') || [];
  const options = fruits.map(f => ({ value: f.id, label: f.name + (f.variety ? ' (' + f.variety + ')' : '') }));
  editingSection = 'sales';
  editingId = id;
  openModal('Edit Sale',
    `<div class="modal-form">
      ${formGroup('Fruit *', 's_fruit_id', 'select', s.fruit_id, '', options)}
      ${formGroup('Date', 's_date', 'date', s.date)}
      ${formGroup('Weight (kg) *', 's_kg', 'number', s.kg)}
      ${formGroup('Price per kg (KES) *', 's_price', 'number', s.price_per_kg)}
      ${formGroup('Customer *', 's_customer', 'text', s.customer)}
      ${formGroup('Payment method', 's_payment', 'text', s.payment_method)}
      ${formGroup('Paid?', 's_paid', 'checkbox', s.paid)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      fruit_id: document.getElementById('s_fruit_id').value,
      date: document.getElementById('s_date').value,
      kg: parseFloat(document.getElementById('s_kg').value) || 0,
      price_per_kg: parseFloat(document.getElementById('s_price').value) || 0,
      customer: document.getElementById('s_customer').value.trim(),
      payment_method: document.getElementById('s_payment').value.trim(),
      paid: document.getElementById('s_paid').checked
    };
    if (!body.fruit_id) { alert('Please select a fruit.'); return; }
    try {
      await apiCall('PUT', '/sales/' + id, body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

async function toggleSalePaid(id) {
  const s = currentData.sales.find(x => x.id === id);
  if (!s) return;
  try {
    await apiCall('PUT', '/sales/' + id, { paid: !s.paid });
    await loadAllData();
  } catch (err) { alert('Failed: ' + err.message); }
}

function confirmDeleteSale(id) {
  const s = currentData.sales.find(x => x.id === id);
  openModal('Delete Sale?',
    `<p style="color:var(--ink-soft)">Remove this sale of ${s?.kg || 0}kg ${s?.fruit_name || ''} to ${s?.customer || ''} for ${fmtPrice((s?.kg || 0) * (s?.price_per_kg || 0))}?</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/sales/' + id);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
}

// ========================
// WORKERS
// ========================
function renderWorkers() {
  const tbody = document.getElementById('workersBody');
  if (!currentData || !currentData.workers.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No workers added yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = currentData.workers.map(w => {
    const notes = w.employee_notes || {};
    const hardworking = notes.hardworking;
    const trustworthy = notes.trustworthy;
    return `
    <tr>
      <td><strong>${escapeHtml(w.name)}</strong></td>
      <td>${escapeHtml(w.role || '—')}</td>
      <td><span class="status-badge ${w.status || 'active'}">${statusLabel(w.status)}</span></td>
      <td style="max-width:220px;color:var(--ink-soft);font-size:12.5px">${escapeHtml(w.tasks || '—')}</td>
      <td style="font-size:12px">${escapeHtml(w.phone || '—')}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${hardworking ? '<span class="worker-badge hardworking" title="Most hardworking">★ Hardworking</span>' : ''}
          ${trustworthy ? '<span class="worker-badge trustworthy" title="Trustworthy">✓ Trustworthy</span>' : ''}
        </div>
      </td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${w.id}" data-section="workers" title="Edit worker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${w.id}" data-section="workers" title="Delete worker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditWorker(btn.dataset.id)));
  tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDeleteWorker(btn.dataset.id)));
}

function openAddWorker() {
  editingSection = 'workers';
  editingId = null;
  openModal('Add Worker',
    `<div class="modal-form">
      ${formGroup('Full name *', 'w_name', 'text', '', 'e.g. Joseph O.')}
      ${formGroup('Role', 'w_role', 'text', '', 'e.g. Harvest Lead')}
      ${formGroup('Status', 'w_status', 'select', 'active', '', [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ])}
      ${formGroup('What they\\'re doing', 'w_tasks', 'textarea', '', 'Current tasks')}
      ${formGroup('Phone', 'w_phone', 'text', '', 'e.g. +254 701 234567')}
      ${formGroup('Employee Notes', 'w_notes', 'textarea', '', 'Hardworking? Trustworthy? Any observations')}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Add Worker', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const notes = document.getElementById('w_notes').value.trim();
    const body = {
      name: document.getElementById('w_name').value.trim(),
      role: document.getElementById('w_role').value.trim(),
      status: document.getElementById('w_status').value,
      tasks: document.getElementById('w_tasks').value.trim(),
      phone: document.getElementById('w_phone').value.trim(),
      employee_notes: {
        hardworking: notes.toLowerCase().includes('hardworking') || notes.toLowerCase().includes('★') || notes.toLowerCase().includes('hard'),
        trustworthy: notes.toLowerCase().includes('trustworthy') || notes.toLowerCase().includes('✓') || notes.toLowerCase().includes('trust'),
        notes: notes
      }
    };
    if (!body.name) { alert('Please enter a name.'); return; }
    try {
      await apiCall('POST', '/workers', body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditWorker(id) {
  const w = currentData.workers.find(x => x.id === id);
  if (!w) return;
  const notes = w.employee_notes || {};
  const noteText = notes.notes || '';
  editingSection = 'workers';
  editingId = id;
  openModal('Edit Worker',
    `<div class="modal-form">
      ${formGroup('Full name *', 'w_name', 'text', w.name)}
      ${formGroup('Role', 'w_role', 'text', w.role)}
      ${formGroup('Status', 'w_status', 'select', w.status, '', [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ])}
      ${formGroup('What they\\'re doing', 'w_tasks', 'textarea', w.tasks)}
      ${formGroup('Phone', 'w_phone', 'text', w.phone)}
      ${formGroup('Employee Notes', 'w_notes', 'textarea', noteText)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const notes = document.getElementById('w_notes').value.trim();
    const body = {
      name: document.getElementById('w_name').value.trim(),
      role: document.getElementById('w_role').value.trim(),
      status: document.getElementById('w_status').value,
      tasks: document.getElementById('w_tasks').value.trim(),
      phone: document.getElementById('w_phone').value.trim(),
      employee_notes: {
        hardworking: notes.toLowerCase().includes('hardworking') || notes.toLowerCase().includes('hard'),
        trustworthy: notes.toLowerCase().includes('trustworthy') || notes.toLowerCase().includes('trust'),
        notes: notes
      }
    };
    if (!body.name) { alert('Please enter a name.'); return; }
    try {
      await apiCall('PUT', '/workers/' + id, body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function confirmDeleteWorker(id) {
  const w = currentData.workers.find(x => x.id === id);
  openModal('Delete Worker?',
    `<p style="color:var(--ink-soft)">Remove <strong>${escapeHtml(w?.name || '')}</strong> from your team? This cannot be undone.</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/workers/' + id);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
}

// ========================
// EMPLOYEE RECOGNITION NOTES
// ========================
function renderEmployeeNotes() {
  const container = document.getElementById('employeeNotesContainer');
  if (!container || !currentData) return;

  const workers = currentData.workers || [];
  const recognized = workers.filter(w => (w.employee_notes?.hardworking || w.employee_notes?.trustworthy));
  const unrecognised = workers.filter(w => !w.employee_notes?.hardworking && !w.employee_notes?.trustworthy);

  if (!workers.length) {
    container.innerHTML = '<p class="text-muted">No workers yet. Add workers to track recognition.</p>';
    return;
  }

  let html = '';

  // Most hardworking
  const hardworkingWorkers = workers.filter(w => w.employee_notes?.hardworking);
  if (hardworkingWorkers.length) {
    html += `<div style="margin-bottom:16px">
      <h4 style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:8px">
        <span style="color:var(--amber)">★</span> Most Hardworking
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">`;
    hardworkingWorkers.forEach(w => {
      html += `<div class="emp-note-card hardworking">
        <strong>${escapeHtml(w.name)}</strong> — ${escapeHtml(w.role || '')}
        <div style="font-size:12px;color:var(--ink-soft);margin-top:4px">${escapeHtml(w.employee_notes?.notes || '')}</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // Most trustworthy
  const trustworthyWorkers = workers.filter(w => w.employee_notes?.trustworthy);
  if (trustworthyWorkers.length) {
    html += `<div style="margin-bottom:16px">
      <h4 style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:8px">
        <span style="color:var(--green)">✓</span> Most Trustworthy
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">`;
    trustworthyWorkers.forEach(w => {
      html += `<div class="emp-note-card trustworthy">
        <strong>${escapeHtml(w.name)}</strong> — ${escapeHtml(w.role || '')}
        <div style="font-size:12px;color:var(--ink-soft);margin-top:4px">${escapeHtml(w.employee_notes?.notes || '')}</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  if (!recognized.length) {
    html += '<p class="text-muted">No recognition notes yet. Add notes to workers to mark them as hardworking or trustworthy.</p>';
  }

  container.innerHTML = html;
}

// ========================
// COSTS
// ========================
function renderCosts() {
  const tbody = document.getElementById('costsBody');
  const costs = currentData?.costs || [];
  const filtered = currentFilter === 'all' ? costs : costs.filter(c => c.category === currentFilter);
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No expenses recorded yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>${formatDate(c.date)}</td>
      <td><span class="status-badge ${c.category === 'inputs' ? 'in_stock' : c.category === 'labour' ? 'low_stock' : 'out_of_stock'}" style="text-transform:none;letter-spacing:0">${escapeHtml(c.category || 'other')}</span></td>
      <td style="color:var(--ink-soft);font-size:12.5px">${escapeHtml(c.description || '—')}</td>
      <td><strong>${fmtPrice(c.amount)}</strong></td>
      <td>
        <div class="paid-toggle ${c.paid ? 'on' : ''}" data-id="${c.id}" title="Toggle paid"></div>
        <span style="font-size:12px;margin-left:4px">${c.paid ? 'Paid' : 'Unpaid'}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${c.id}" data-section="costs" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" data-id="${c.id}" data-section="costs" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditCost(btn.dataset.id)));
  tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => confirmDeleteCost(btn.dataset.id)));
  tbody.querySelectorAll('.paid-toggle').forEach(tog => tog.addEventListener('click', () => toggleCostPaid(tog.dataset.id)));
}

let currentFilter = 'all';

function setupCostFilters() {
  document.querySelectorAll('.cost-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cost-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderCosts();
    });
  });
}

function openAddCost() {
  editingSection = 'costs';
  editingId = null;
  openModal('Add Expense',
    `<div class="modal-form">
      ${formGroup('Date', 'c_date', 'date', new Date().toISOString().slice(0, 10))}
      ${formGroup('Category *', 'c_category', 'select', '', '', [
        { value: 'inputs', label: 'Inputs — seeds, fertilizer, spray' },
        { value: 'labour', label: 'Labour — wages, stipends' },
        { value: 'transport', label: 'Transport — fuel, delivery' },
        { value: 'other', label: 'Other' }
      ])}
      ${formGroup('Description *', 'c_description', 'text', '', 'What was this expense for?')}
      ${formGroup('Amount (KES) *', 'c_amount', 'number', '', 'e.g. 4500')}
      ${formGroup('Paid?', 'c_paid', 'checkbox', false)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Add Expense', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      date: document.getElementById('c_date').value,
      category: document.getElementById('c_category').value,
      description: document.getElementById('c_description').value.trim(),
      amount: parseFloat(document.getElementById('c_amount').value) || 0,
      paid: document.getElementById('c_paid').checked
    };
    if (!body.category) { alert('Please select a category.'); return; }
    if (!body.description) { alert('Please describe the expense.'); return; }
    if (!body.amount || body.amount <= 0) { alert('Please enter an amount.'); return; }
    try {
      await apiCall('POST', '/costs', body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditCost(id) {
  const c = currentData.costs.find(x => x.id === id);
  if (!c) return;
  editingSection = 'costs';
  editingId = id;
  openModal('Edit Expense',
    `<div class="modal-form">
      ${formGroup('Date', 'c_date', 'date', c.date)}
      ${formGroup('Category *', 'c_category', 'select', c.category, '', [
        { value: 'inputs', label: 'Inputs' },
        { value: 'labour', label: 'Labour' },
        { value: 'transport', label: 'Transport' },
        { value: 'other', label: 'Other' }
      ])}
      ${formGroup('Description *', 'c_description', 'text', c.description)}
      ${formGroup('Amount (KES) *', 'c_amount', 'number', c.amount)}
      ${formGroup('Paid?', 'c_paid', 'checkbox', c.paid)}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      date: document.getElementById('c_date').value,
      category: document.getElementById('c_category').value,
      description: document.getElementById('c_description').value.trim(),
      amount: parseFloat(document.getElementById('c_amount').value) || 0,
      paid: document.getElementById('c_paid').checked
    };
    if (!body.category) { alert('Please select a category.'); return; }
    try {
      await apiCall('PUT', '/costs/' + id, body);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

async function toggleCostPaid(id) {
  const c = currentData.costs.find(x => x.id === id);
  if (!c) return;
  try {
    await apiCall('PUT', '/costs/' + id, { paid: !c.paid });
    await loadAllData();
  } catch (err) { alert('Failed: ' + err.message); }
}

function confirmDeleteCost(id) {
  const c = currentData.costs.find(x => x.id === id);
  openModal('Delete Expense?',
    `<p style="color:var(--ink-soft)">Remove this expense of <strong>${fmtPrice(c?.amount || 0)}</strong> for ${c?.description || '—'}?</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/costs/' + id);
      closeModal();
      await loadAllData();
    } catch (err) { alert('Failed: ' + err.message); }
  };
}

// ========================
// ACTIVITY PANELS
// ========================
function renderActivityPanels() {
  if (!currentData) return;
  const harvests = currentData.harvests || [];
  const sales = currentData.sales || [];
  const costs = currentData.costs || [];

  const recentHarvests = harvests.slice(-8).reverse();
  const recentSales = sales.slice(-8).reverse();
  const recentCosts = costs.slice(-8).reverse();

  const hEl = document.getElementById('recentHarvests');
  hEl.innerHTML = recentHarvests.length
    ? recentHarvests.map(h => `
      <div class="activity-item">
        <div class="activity-icon harvest"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 2 4 5 4 9c0 4 4 8 8 11 4-3 8-7 8-11 0-4-4-7-8-7z"/></svg></div>
        <div class="activity-text">
          <strong>${escapeHtml(h.fruit_name || '?')}</strong> — ${h.kg} kg harvested
          <span class="activity-meta">${formatDate(h.date)} · Quality ${h.quality}</span>
        </div>
      </div>`).join('')
    : '<p class="text-muted">No harvests recorded yet.</p>';

  const sEl = document.getElementById('recentSales');
  sEl.innerHTML = recentSales.length
    ? recentSales.map(s => `
      <div class="activity-item">
        <div class="activity-icon sale"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div class="activity-text">
          <strong>${escapeHtml(s.customer || '?')}</strong> bought ${s.kg}kg ${s.fruit_name}
          <span class="activity-meta">${formatDate(s.date)} · ${fmtPrice(s.kg * s.price_per_kg)} · ${s.paid ? 'Paid' : 'Unpaid'}</span>
        </div>
        <span class="activity-amount ${s.paid ? 'positive' : 'warning'}">${fmtPrice(s.kg * s.price_per_kg)}</span>
      </div>`).join('')
    : '<p class="text-muted">No sales recorded yet.</p>';

  const cEl = document.getElementById('recentCosts');
  cEl.innerHTML = recentCosts.length
    ? recentCosts.map(c => `
      <div class="activity-item">
        <div class="activity-icon cost"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
        <div class="activity-text">
          <strong>${escapeHtml(c.description || '?')}</strong>
          <span class="activity-meta">${formatDate(c.date)} · ${c.category || 'other'} · ${c.paid ? 'Paid' : 'Unpaid'}</span>
        </div>
        <span class="activity-amount negative">-${fmtPrice(c.amount)}</span>
      </div>`).join('')
    : '<p class="text-muted">No costs recorded yet.</p>';
}

// ========================
// SITE EDITOR
// ========================
function loadSiteForm() {
  if (!currentData?.site) return;
  const s = currentData.site;
  document.getElementById('siteTitle').value = s.title || '';
  document.getElementById('siteTagline').value = s.tagline || '';
  document.getElementById('siteStory').value = s.story || '';
  document.getElementById('sitePhone').value = s.contact?.phone || '';
  document.getElementById('siteEmail').value = s.contact?.email || '';
  document.getElementById('siteLocation').value = s.contact?.location || '';
  document.getElementById('siteHours').value = s.contact?.hours || '';
  document.getElementById('siteDirections').value = s.contact?.directions || '';
  document.getElementById('siteFacebook').value = s.social?.facebook || '';
  document.getElementById('siteInstagram').value = s.social?.instagram || '';
  document.getElementById('siteWhatsapp').value = s.social?.whatsapp || '';
  document.getElementById('siteStoreEnabled').checked = s.store_enabled !== false;
  document.getElementById('siteStoreNote').value = s.store_note || '';
  document.getElementById('siteSeoDesc').value = s.seo?.description || '';
  document.getElementById('siteSeoKeywords').value = s.seo?.keywords || '';
}

async function setupSiteEditor() {
  const saveBtn = document.getElementById('saveSiteBtn');
  if (!saveBtn) return;
  saveBtn.addEventListener('click', async () => {
    const status = document.getElementById('siteSaveStatus');
    status.textContent = 'Saving...';
    status.className = 'save-status';
    const body = {
      title: document.getElementById('siteTitle').value.trim(),
      tagline: document.getElementById('siteTagline').value.trim(),
      story: document.getElementById('siteStory').value.trim(),
      contact: {
        phone: document.getElementById('sitePhone').value.trim(),
        email: document.getElementById('siteEmail').value.trim(),
        location: document.getElementById('siteLocation').value.trim(),
        hours: document.getElementById('siteHours').value.trim(),
        directions: document.getElementById('siteDirections').value.trim()
      },
      social: {
        facebook: document.getElementById('siteFacebook').value.trim(),
        instagram: document.getElementById('siteInstagram').value.trim(),
        whatsapp: document.getElementById('siteWhatsapp').value.trim()
      },
      store_enabled: document.getElementById('siteStoreEnabled').checked,
      store_note: document.getElementById('siteStoreNote').value.trim(),
      seo: {
        description: document.getElementById('siteSeoDesc').value.trim(),
        keywords: document.getElementById('siteSeoKeywords').value.trim()
      }
    };
    try {
      await apiCall('PUT', '/site', body);
      status.textContent = '✓ Saved successfully at ' + new Date().toLocaleTimeString();
      status.className = 'save-status success';
      setTimeout(() => { status.textContent = ''; status.className = 'save-status'; }, 3000);
    } catch (err) {
      status.textContent = '✗ Save failed: ' + err.message;
      status.className = 'save-status error';
    }
  });
}

// ========================
// STOCK MANAGEMENT
// ========================
function renderStock() {
  const tbody = document.getElementById('stockBody');
  if (!currentData || !currentData.fruits.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No fruits added yet.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = currentData.fruits.map(f => {
    const delta = f.stock_kg > 0 ? '(+' + f.stock_kg + 'kg)' : '';
    return `
    <tr>
      <td><div class="fruit-cell"><span class="fruit-name">${escapeHtml(f.name)}</span>${f.variety ? `<span class="fruit-variety">${escapeHtml(f.variety)}</span>` : ''}</div></td>
      <td>${escapeHtml(f.variety || '—')}</td>
      <td class="stock-row-value ${f.status === 'in_stock' ? 'positive' : f.status === 'low_stock' ? 'warning' : ''}">${f.stock_kg} kg</td>
      <td><span class="status-badge ${f.status}">${statusLabel(f.status)}</span></td>
      <td class="price-cell">${fmtPrice(f.price)} <span class="unit">/${f.unit}</span></td>
      <td>
        <div style="display:flex;gap:4px;align-items:center">
          <button class="btn btn-ghost btn-sm stock-decrease" data-id="${f.id}" data-delta="-10" title="Decrease by 10kg">−10</button>
          <button class="btn btn-ghost btn-sm stock-decrease" data-id="${f.id}" data-delta="-5" title="Decrease by 5kg">−5</button>
          <button class="btn btn-ghost btn-sm stock-increase" data-id="${f.id}" data-delta="5" title="Increase by 5kg">+5</button>
          <button class="btn btn-ghost btn-sm stock-increase" data-id="${f.id}" data-delta="10" title="Increase by 10kg">+10</button>
        </div>
      </td>
      <td>
        <div class="actions-cell">
          <button class="edit-btn" data-id="${f.id}" data-section="fruits" title="Edit fruit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.stock-decrease').forEach(btn => btn.addEventListener('click', () => adjustStock(btn.dataset.id, parseInt(btn.dataset.delta))));
  tbody.querySelectorAll('.stock-increase').forEach(btn => btn.addEventListener('click', () => adjustStock(btn.dataset.id, parseInt(btn.dataset.delta))));
}

async function adjustStock(fruitId, deltaKg) {
  try {
    await apiCall('POST', '/stock/adjust', { fruit_id: fruitId, delta_kg: deltaKg });
    await loadAllData();
  } catch (err) {
    alert('Failed to adjust stock: ' + err.message);
  }
}

// ========================
// DASHBOARD NOTES
// ========================
let dashboardNotes = [];

async function loadDashboardNotes() {
  try {
    const res = await fetch('/api/dashboard-notes');
    if (!res.ok) throw new Error('Failed to load notes');
    dashboardNotes = await res.json();
    renderDashboardNotes();
  } catch (err) {
    console.error('Failed to load dashboard notes:', err);
  }
}

function renderDashboardNotes() {
  const container = document.getElementById('dashboardNotes');
  const empty = document.getElementById('dashboardNotesEmpty');
  if (!container) return;

  if (!dashboardNotes.length) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  container.innerHTML = dashboardNotes.map(note => `
    <div class="dashboard-note ${note.color || 'green'}">
      <div class="note-title">${escapeHtml(note.title)}</div>
      <div class="note-body">${escapeHtml(note.body)}</div>
      <div class="note-actions">
        <button class="note-edit" data-id="${note.id}">Edit</button>
        <button class="note-delete" data-id="${note.id}">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.note-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditDashboardNote(btn.dataset.id));
  });
  container.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteDashboardNote(btn.dataset.id));
  });
}

function openAddDashboardNote() {
  editingNoteId = null;
  openModal('Add Dashboard Note',
    `<div class="modal-form">
      ${formGroup('Title *', 'dn_title', 'text', '', 'e.g. This Month\\'s Goal')}
      ${formGroup('Body / Content', 'dn_body', 'textarea', '', 'What do you want to communicate?')}
      ${formGroup('Color accent', 'dn_color', 'select', 'green', '', [
        { value: 'green', label: 'Green' },
        { value: 'amber', label: 'Amber' },
        { value: 'plum', label: 'Plum' },
        { value: 'danger', label: 'Red' }
      ])}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Add Note', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      title: document.getElementById('dn_title').value.trim(),
      body: document.getElementById('dn_body').value.trim(),
      color: document.getElementById('dn_color').value
    };
    if (!body.title) { alert('Please enter a title.'); return; }
    try {
      await apiCall('POST', '/dashboard-notes', body);
      closeModal();
      await loadDashboardNotes();
    } catch (err) { alert('Failed to add note: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function openEditDashboardNote(id) {
  const note = dashboardNotes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  openModal('Edit Dashboard Note',
    `<div class="modal-form">
      ${formGroup('Title *', 'dn_title', 'text', note.title)}
      ${formGroup('Body / Content', 'dn_body', 'textarea', note.body)}
      ${formGroup('Color accent', 'dn_color', 'select', note.color || 'green', '', [
        { value: 'green', label: 'Green' },
        { value: 'amber', label: 'Amber' },
        { value: 'plum', label: 'Plum' },
        { value: 'danger', label: 'Red' }
      ])}
    </div>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Save', class: 'btn-primary', id: 'modalSave' }
    ])
  );
  document.getElementById('modalSave').onclick = async () => {
    const body = {
      title: document.getElementById('dn_title').value.trim(),
      body: document.getElementById('dn_body').value.trim(),
      color: document.getElementById('dn_color').value
    };
    if (!body.title) { alert('Please enter a title.'); return; }
    try {
      await apiCall('PUT', '/dashboard-notes/' + id, body);
      closeModal();
      await loadDashboardNotes();
    } catch (err) { alert('Failed to save: ' + err.message); }
  };
  document.getElementById('modalCancel').onclick = closeModal;
}

function confirmDeleteDashboardNote(id) {
  const note = dashboardNotes.find(n => n.id === id);
  openModal('Delete Note?',
    `<p style="color:var(--ink-soft)">Remove the note "<strong>${escapeHtml(note?.title || '—')}</strong>"?</p>`,
    modalActions([
      { label: 'Cancel', class: 'btn-ghost', id: 'modalCancel' },
      { label: 'Delete', class: 'btn-danger', id: 'modalDelete' }
    ])
  );
  document.getElementById('modalCancel').onclick = closeModal;
  document.getElementById('modalDelete').onclick = async () => {
    try {
      await apiCall('DELETE', '/dashboard-notes/' + id);
      closeModal();
      await loadDashboardNotes();
    } catch (err) { alert('Failed to delete: ' + err.message); }
  };
}

// Wire up the edit notes button
(function() {
  const editBtn = document.getElementById('editDashboardNotesBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (!dashboardNotes.length) {
        openAddDashboardNote();
        return;
      }
      const notesList = dashboardNotes.map(n =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--paper-line)">
          <div><strong>${escapeHtml(n.title)}</strong><span style="display:block;font-size:12px;color:var(--ink-soft)">${escapeHtml(n.body.slice(0, 60))}${n.body.length > 60 ? '…' : ''}</span></div>
          <button class="btn btn-ghost btn-sm" style="margin-left:8px" data-id="${n.id}">Edit</button>
        </div>`
      ).join('');
      openModal('Dashboard Notes',
        `<p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">Manage the editable notes that appear on your dashboard.</p>
         <div style="max-height:260px;overflow-y:auto;background:var(--paper);border-radius:6px;padding:4px;border:1px solid var(--rule)">${notesList || '<p class="text-muted">No notes yet.</p>'}</div>
         <div style="margin-top:12px;display:flex;gap:8px">
           <button class="btn btn-primary" id="dnAddFromList">+ Add New Note</button>
         </div>`,
        ''
      );
      document.getElementById('dnAddFromList').onclick = () => {
        closeModal();
        openAddDashboardNote();
      };
      document.querySelectorAll('#modalBody [data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          closeModal();
          openEditDashboardNote(id);
        });
      });
    });
  }
  loadDashboardNotes();
})();

// ========================
// ADD BUTTON WIRING
// ========================
function setupAddButtons() {
  const addFruitBtn = document.getElementById('addFruitBtn');
  if (addFruitBtn) addFruitBtn.addEventListener('click', openAddFruit);

  const addHarvestBtn = document.getElementById('addHarvestBtn');
  if (addHarvestBtn) addHarvestBtn.addEventListener('click', openAddHarvest);

  const addSaleBtn = document.getElementById('addSaleBtn');
  if (addSaleBtn) addSaleBtn.addEventListener('click', openAddSale);

  const addWorkerBtn = document.getElementById('addWorkerBtn');
  if (addWorkerBtn) addWorkerBtn.addEventListener('click', openAddWorker);

  const addCostBtn = document.getElementById('addCostBtn');
  if (addCostBtn) addCostBtn.addEventListener('click', openAddCost);

  const addEmployeeNoteBtn = document.getElementById('addEmployeeNoteBtn');
  if (addEmployeeNoteBtn) addEmployeeNoteBtn.addEventListener('click', () => {
    // Open the workers list and let user pick a worker to add notes to
    const workers = currentData?.workers || [];
    if (!workers.length) { alert('No workers added yet.'); return; }
    const options = workers.map(w => ({ value: w.id, label: w.name + ' — ' + (w.role || '') }));
    const selectedWorker = prompt("Enter worker name to add recognition notes:", workers[0]?.name);
    if (!selectedWorker) return;
    const worker = workers.find(w => w.name === selectedWorker);
    if (!worker) { alert('Worker not found.'); return; }
    const notes = prompt("Enter recognition notes (use 'hardworking' and/or 'trustworthy' keywords):", worker.employee_notes?.notes || '');
    if (notes === null) return;
    const body = {
      employee_notes: {
        hardworking: notes.toLowerCase().includes('hardworking') || notes.toLowerCase().includes('hard'),
        trustworthy: notes.toLowerCase().includes('trustworthy') || notes.toLowerCase().includes('trust'),
        notes: notes
      }
    };
    apiCall('PUT', '/workers/' + worker.id, body)
      .then(() => loadAllData())
      .catch(err => alert('Failed: ' + err.message));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupAddButtons();
  setupCostFilters();
  loadAllData();
});

// ========================
// GLOBAL EVENT DELEGATION
// ========================
document.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn && !e.target.closest('.modal')) {
    const section = editBtn.dataset.section;
    const id = editBtn.dataset.id;
    if (section === 'fruits') openEditFruit(id);
    else if (section === 'harvests') openEditHarvest(id);
    else if (section === 'sales') openEditSale(id);
    else if (section === 'workers') openEditWorker(id);
    else if (section === 'costs') openEditCost(id);
  }

  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn && !e.target.closest('.modal')) {
    const section = deleteBtn.dataset.section;
    const id = deleteBtn.dataset.id;
    if (section === 'fruits') confirmDeleteFruit(id);
    else if (section === 'harvests') confirmDeleteHarvest(id);
    else if (section === 'sales') confirmDeleteSale(id);
    else if (section === 'workers') confirmDeleteWorker(id);
    else if (section === 'costs') confirmDeleteCost(id);
  }
});
