// Digital Farm System — Public Site JS

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Fetch and render fruit catalog
  fetchFruits();

  // Order form handler
  const orderForm = document.getElementById('orderFormEl');
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrder);
  }
});

async function fetchFruits() {
  const grid = document.getElementById('fruitGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/fruits');
    if (!res.ok) throw new Error('Failed to load fruits');
    const fruits = await res.json();

    if (fruits.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-soft)">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;opacity:0.4"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <p>No fruits listed yet. Check back soon — harvest is always coming!</p>
        </div>`;
      return;
    }

    grid.innerHTML = fruits.map(fruit => {
      const stockClass = fruit.status || 'in_stock';
      const stockLabel = fruit.status === 'in_stock' ? 'In stock' :
                         fruit.status === 'low_stock' ? `Only ${fruit.stock_kg}kg left` :
                         'Out of stock';
      const outOfStock = fruit.status === 'out_of_stock';

      return `
        <div class="fruit-card">
          <div class="fruit-card-header">
            <div>
              <div class="fruit-name">${escapeHtml(fruit.name)}</div>
              ${fruit.variety ? `<div class="fruit-variety">${escapeHtml(fruit.variety)}</div>` : ''}
            </div>
            <div class="fruit-price">
              ${formatPrice(fruit.price)}
              <small>/ ${escapeHtml(fruit.unit || 'kg')}</small>
            </div>
          </div>
          <div class="fruit-stock ${stockClass}">
            <span class="stock-dot ${stockClass}"></span>
            ${escapeHtml(stockLabel)}
          </div>
          ${fruit.notes ? `<div class="fruit-notes">${escapeHtml(fruit.notes)}</div>` : ''}
          <div class="fruit-actions">
            <a href="https://wa.me/254700123456?text=I'm%20interested%20in%20${encodeURIComponent(fruit.name + (fruit.variety ? ' ' + fruit.variety : '') + ' — ' + (fruit.stock_kg ? fruit.stock_kg + 'kg available at ' + formatPrice(fruit.price) + '/' + (fruit.unit || 'kg') : ''))}" 
               class="btn btn-primary btn-sm ${outOfStock ? 'btn-ghost' : ''}"
               ${outOfStock ? 'style="opacity:0.5;pointer-events:none"' : ''}>
              ${outOfStock ? 'Out of stock' : 'Order via WhatsApp'}
            </a>
            <a href="#contact" class="btn btn-ghost btn-sm">View contact</a>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-soft)">
        <p>Unable to load fruit catalog right now. Please refresh or call us on +254 700 123456.</p>
      </div>`;
    console.error('Failed to load fruits:', err);
  }
}

async function handleOrder(e) {
  e.preventDefault();
  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const email = document.getElementById('orderEmail').value.trim();
  const items = document.getElementById('orderItems').value.trim();
  const delivery = document.getElementById('orderDelivery').value.trim();
  const notes = document.getElementById('orderNotes').value.trim();

  if (!name || !phone || !items) {
    alert('Please fill in your name, phone, and what you would like to order.');
    return;
  }

  let message = `Hello! I'd like to order fresh fruit from Mama Njeri's Farm.\n\n`;
  message += `Name: ${name}\n`;
  message += `Phone: ${phone}\n`;
  if (email) message += `Email: ${email}\n`;
  message += `\nI would like:\n${items}\n`;
  if (delivery) message += `\nDelivery address: ${delivery}\n`;
  if (notes) message += `\nNotes: ${notes}\n`;
  message += `\n\nPlease confirm availability and arrange delivery. Thank you!`;

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/254700123456?text=${encoded}`, '_blank');

  // Optimistic feedback
  const btn = orderForm.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = 'Opening WhatsApp...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
  }, 2000);
}

// Helpers
function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return 'KES ' + Number(amount).toLocaleString('en-KE');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
