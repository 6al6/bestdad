/**
 * <landing-strip>: endless, always moving row of photos for "Landing: Photo strip".
 *
 * The photo blocks are rendered once. This element clones them (aria-hidden) until the
 * row is wider than the screen plus one full set, then the CSS animation slides the row
 * by exactly one set width, so the loop is seamless.
 */
class LandingStrip extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.landing-strip__track');
    if (!this.track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.originals = [...this.track.children];
    this.speed = Number(this.dataset.speed) || 40; // px per second
    this.lastWidth = 0;

    this.build();
    this.resizeObserver = new ResizeObserver(() => {
      if (Math.abs(this.clientWidth - this.lastWidth) < 2) return;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.build(), 150);
    });
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    clearTimeout(this.resizeTimer);
  }

  build() {
    this.track.querySelectorAll('[data-clone]').forEach((clone) => clone.remove());

    const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
    const setWidth = this.originals.reduce((sum, item) => sum + item.getBoundingClientRect().width + gap, 0);
    if (!setWidth) return;

    this.lastWidth = this.clientWidth;
    const copies = Math.ceil(this.clientWidth / setWidth) + 1;
    for (let i = 0; i < copies; i++) {
      this.originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.dataset.clone = '';
        this.track.append(clone);
      });
    }

    this.style.setProperty('--strip-set', `${setWidth}px`);
    this.style.setProperty('--strip-duration', `${setWidth / this.speed}s`);
    this.classList.add('is-running');
  }
}

if (!customElements.get('landing-strip')) {
  customElements.define('landing-strip', LandingStrip);
}
