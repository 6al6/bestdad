/**
 * Terms and privacy popups for "Legenda: Submission form".
 * [data-terms-open] buttons open the <dialog> named in their aria-controls, and links to
 * #pogoji-sodelovanja or #politika-zasebnosti open the dialog with that data-anchor.
 * A popup closes with the X button, Esc (native) or a click on the dark backdrop.
 * In the theme editor, selecting a "Terms part" or "Privacy part" block opens its popup.
 */
(() => {
  if (window.legendaTerms) return;
  window.legendaTerms = true;

  const open = (dialog) => {
    if (dialog && !dialog.open) dialog.showModal();
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-terms-open]');
    if (opener) {
      event.preventDefault();
      open(document.getElementById(opener.getAttribute('aria-controls')));
      return;
    }

    // A link to #pogoji-sodelovanja or #politika-zasebnosti (e.g. inside the terms text) opens that popup
    const link = event.target.closest('a[href*="#"]');
    const hash = link && new URL(link.href, location.href).hash.slice(1);
    const linked = hash && document.querySelector(`dialog.legenda-terms[data-anchor="${CSS.escape(hash)}"]`);
    if (linked) {
      event.preventDefault();
      open(linked);
      return;
    }

    if (event.target.closest('[data-terms-close]')) {
      event.target.closest('dialog').close();
      return;
    }

    // The dialog's own content fills it, so a click that lands on the dialog itself is on the backdrop
    if (event.target.matches('dialog.legenda-terms')) event.target.close();
  });

  document.addEventListener('shopify:block:select', (event) => {
    open(event.target.closest('dialog.legenda-terms'));
  });
  document.addEventListener('shopify:section:deselect', (event) => {
    event.target.querySelector?.('dialog.legenda-terms[open]')?.close();
  });
})();
