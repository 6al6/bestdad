/**
 * <landing-excerpts>: "Show more" / "Hide" toggle for the "Landing: Book excerpts" section.
 * Excerpts after the first few are rendered with [hidden]; the button shows them all,
 * then switches to its "less" label and hides them again on the next click.
 */
class LandingExcerpts extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-more]');
    if (!this.button) return;

    this.label = this.button.querySelector('span');
    this.extra = [...this.querySelectorAll('[data-excerpt][hidden]')];
    this.button.setAttribute('aria-expanded', 'false');
    this.button.addEventListener('click', () => (this.expanded ? this.collapse() : this.expand()));
  }

  get expanded() {
    return this.button.getAttribute('aria-expanded') === 'true';
  }

  expand() {
    this.extra.forEach((item) => {
      item.hidden = false;
    });
    this.setState(true);
    this.extra[0]?.querySelector('h3')?.focus({ preventScroll: true });
  }

  collapse() {
    this.extra.forEach((item) => {
      item.hidden = true;
    });
    this.setState(false);
    // The text above the button just got shorter, so bring the button back into view if it left the screen
    if (this.button.getBoundingClientRect().top < 0) {
      this.button.scrollIntoView({ block: 'center' });
    }
  }

  setState(expanded) {
    this.button.setAttribute('aria-expanded', String(expanded));
    this.label.textContent = expanded ? this.button.dataset.lessLabel : this.button.dataset.moreLabel;
  }
}

if (!customElements.get('landing-excerpts')) {
  customElements.define('landing-excerpts', LandingExcerpts);
}
