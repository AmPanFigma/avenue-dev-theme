/* Side cart drawer — vanilla JS using Shopify AJAX Cart API.
   Handles open/close, add, quantity change, remove, and live re-render. */
(function () {
  const drawer = document.getElementById('CartDrawer');
  if (!drawer) return;

  const itemsEl    = drawer.querySelector('[data-cart-items]');
  const emptyEl    = drawer.querySelector('[data-cart-empty]');
  const footerEl   = drawer.querySelector('[data-cart-footer]');
  const subtotalEl = drawer.querySelector('[data-cart-subtotal]');
  const routineEl  = drawer.querySelector('[data-cart-routine]');
  const upsellEl   = drawer.querySelector('[data-cart-upsell]');
  const recommendUrl = drawer.getAttribute('data-recommend-url');

  const money = (cents) =>
    (window.Shopify && Shopify.formatMoney)
      ? Shopify.formatMoney(cents, window.theme && theme.moneyFormat)
      : '$' + (cents / 100).toFixed(2);

  /* ---------- open / close ---------- */
  function openCart()  { drawer.classList.add('is-open');  drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeCart() { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

  /* ---------- render ---------- */
  function updateCounts(count) {
    document.querySelectorAll('[data-ajax-cart-bind="item_count"]').forEach((el) => {
      // header markup is "Cart (n)" — replace just the number node
      el.textContent = count;
    });
  }

  function renderCart(cart) {
    updateCounts(cart.item_count);

    if (cart.item_count === 0) {
      itemsEl.innerHTML = '';
      emptyEl.hidden = false;
      footerEl.hidden = true;
      if (routineEl) routineEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    footerEl.hidden = false;
    subtotalEl.textContent = money(cart.total_price);

    itemsEl.innerHTML = cart.items.map((item) => {
      const img = item.image
        ? item.image.replace(/(\.[^.]+)(\?.*)?$/, '_200x$1$2')
        : 'https://placehold.net/600x600.png';
      const variant = (item.variant_title && item.variant_title !== 'Default Title')
        ? `<p class="cart-item__variant">${item.variant_title}</p>` : '';
      return `
        <div class="cart-item" data-line-key="${item.key}">
          <a class="cart-item__media" href="${item.url}">
            <img class="cart-item__img" src="${img}" alt="${item.product_title}">
          </a>
          <div class="cart-item__details">
            <h3 class="cart-item__title"><a href="${item.url}">${item.product_title}</a></h3>
            ${variant}
            <p class="cart-item__price">${money(item.final_line_price)}</p>
            <div class="cart-item__qty">
              <span class="cart-item__qty-label">Quantity :</span>
              <button type="button" data-qty-down aria-label="Decrease quantity">&minus;</button>
              <input type="number" min="0" value="${item.quantity}" data-qty-input aria-label="Quantity">
              <button type="button" data-qty-up aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-remove>Remove</button>
          </div>
        </div>`;
    }).join('');

    // Recommendation ("Complete your routine") based on the first cart item
    loadRoutine(cart.items[0] && cart.items[0].product_id);
  }

  let lastRoutineFor = null;
  function loadRoutine(productId) {
    if (!routineEl || !upsellEl || !recommendUrl || !productId) return;
    if (lastRoutineFor === productId) return; // already loaded for this product
    lastRoutineFor = productId;
    const url = recommendUrl + '?section_id=product-upsell&product_id=' + productId + '&limit=1';
    fetch(url)
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const content = doc.querySelector('[data-upsell-content]');
        if (content && content.innerHTML.trim()) {
          upsellEl.innerHTML = content.innerHTML;
          routineEl.hidden = false;
        } else {
          routineEl.hidden = true;
        }
      })
      .catch(() => { routineEl.hidden = true; });
  }

  /* ---------- API calls ---------- */
  function getCart() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then((r) => r.json());
  }

  function refresh() {
    return getCart().then(renderCart);
  }

  function addToCart(body, btn) {
    // Optimistic: open the drawer right away so it feels instant.
    openCart();
    drawer.classList.add('is-loading');
    if (btn) {
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.classList.add('is-loading');
      btn.disabled = true;
      btn.textContent = 'Adding…';
    }
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) { throw new Error(data.description || 'Could not add to cart'); }
        return refresh();
      })
      .then(() => {
        if (!btn) return;
        btn.classList.remove('is-loading');
        btn.classList.add('is-added');
        btn.textContent = 'Added ✓';
        setTimeout(() => {
          btn.classList.remove('is-added');
          btn.disabled = false;
          btn.textContent = btn.dataset.label;
        }, 1800);
      })
      .catch((err) => {
        alert(err.message);
        if (btn) { btn.classList.remove('is-loading'); btn.disabled = false; btn.textContent = btn.dataset.label; }
      })
      .finally(() => drawer.classList.remove('is-loading'));
  }

  function changeLine(key, quantity) {
    drawer.classList.add('is-loading');
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    })
      .then((r) => r.json())
      .then(renderCart)
      .finally(() => drawer.classList.remove('is-loading'));
  }

  /* ---------- event delegation ---------- */
  // Open triggers (header link uses .cart-open)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cart-open')) { e.preventDefault(); openCart(); }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); closeCart(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  // Quantity + remove inside the drawer
  drawer.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const key = row.dataset.lineKey;
    const input = row.querySelector('[data-qty-input]');
    if (e.target.closest('[data-remove]'))   return changeLine(key, 0);
    if (e.target.closest('[data-qty-up]'))   return changeLine(key, parseInt(input.value, 10) + 1);
    if (e.target.closest('[data-qty-down]')) return changeLine(key, Math.max(0, parseInt(input.value, 10) - 1));
  });
  drawer.addEventListener('change', (e) => {
    if (!e.target.matches('[data-qty-input]')) return;
    const row = e.target.closest('.cart-item');
    changeLine(row.dataset.lineKey, Math.max(0, parseInt(e.target.value, 10) || 0));
  });

  /* ---------- product forms ---------- */
  // Any <form action="/cart/add"> on the page submits via AJAX and opens the drawer.
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form.matches('form[action*="/cart/add"]')) return;
    e.preventDefault();
    const fd = new FormData(form);
    const body = { id: fd.get('id'), quantity: parseInt(fd.get('quantity'), 10) || 1 };
    addToCart(body);
  });

  // Quick-add buttons on product cards (need data-variant-id)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-variant-id]');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    addToCart({ id: btn.dataset.variantId, quantity: 1 }, btn);
  });

  // expose for other scripts if needed
  window.CartDrawer = { open: openCart, close: closeCart, refresh, addToCart };

  // initial fill
  refresh();
})();
