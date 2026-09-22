/**
 * <landing-product>: gallery thumbnails, variant price updates and ajax add to cart
 * for the "Landing: Product" section.
 *
 * Cart contract (same as the theme's quick buy): POST to theme.routes.cart_add_url, then
 * dispatch `shapes:cart:afteradditem` on <body> so the cart drawer refreshes and opens.
 */
class LandingProduct extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.button = this.querySelector('button[type="submit"]');
    this.buttonLabel = this.button?.querySelector('span');
    this.labels = this.querySelector('.landing-product__button')?.dataset;
    this.errorEl = this.querySelector('[data-error]');
    this.variantSelect = this.querySelector('select[name="id"]');

    this.querySelector('[data-thumbs]')?.addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-index]');
      if (thumb) this.showImage(Number(thumb.dataset.index));
    });
    this.variantSelect?.addEventListener('change', () => this.updateVariant());
    this.form?.addEventListener('submit', (event) => this.addToCart(event));
  }

  showImage(index) {
    this.querySelectorAll('.landing-product__image').forEach((image, i) => {
      image.classList.toggle('is-active', i === index);
    });
    this.querySelectorAll('[data-index]').forEach((thumb) => {
      const active = Number(thumb.dataset.index) === index;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', String(active));
    });
  }

  updateVariant() {
    const option = this.variantSelect.selectedOptions[0];
    const { price, compare, savings, available } = option.dataset;
    const onSale = Boolean(compare);

    this.querySelector('[data-price]').textContent = price;

    const compareEl = this.querySelector('[data-compare]');
    compareEl.textContent = compare;
    compareEl.hidden = !onSale;

    const badge = this.querySelector('[data-badge]');
    badge.textContent = badge.dataset.template.replace('[amount]', savings);
    badge.hidden = !onSale;

    this.querySelectorAll('[data-sale-only]').forEach((el) => {
      el.hidden = !onSale;
    });

    const inStock = available === 'true';
    this.button.disabled = !inStock;
    this.buttonLabel.textContent = inStock ? this.labels.labelAdd : this.labels.labelSoldOut;
  }

  async addToCart(event) {
    event.preventDefault();
    if (this.button.disabled) return;

    const modalCart = window.theme?.settings?.cartType === 'modal';
    const body = new FormData(this.form);
    if (modalCart) {
      body.append('sections', 'cart-items,cart-footer,cart-item-count');
      body.append('sections_url', window.location.pathname);
    }

    this.button.disabled = true;
    this.errorEl.textContent = '';

    try {
      const response = await fetch(window.theme.routes.cart_add_url, {
        method: 'POST',
        body,
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/javascript' },
      });
      const data = await response.json();

      if (data.status) {
        this.errorEl.textContent = data.description || data.message || window.theme.strings.cartError;
        return;
      }

      if (modalCart) {
        document.body.dispatchEvent(
          new CustomEvent('shapes:cart:afteradditem', {
            bubbles: true,
            detail: { response: data, sourceId: this.form.id },
          })
        );
      } else {
        window.location.href = window.theme.routes.cart_url;
      }
    } catch (error) {
      console.error(error);
      this.errorEl.textContent = window.theme.strings.cartError;
    } finally {
      this.button.disabled = false;
    }
  }
}

if (!customElements.get('landing-product')) {
  customElements.define('landing-product', LandingProduct);
}
