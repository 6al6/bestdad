/**
 * Click-to-play videos in "Landing: Photos + text".
 *
 * A video downloads nothing until it is first played: its URL waits in data-src.
 * Click/tap toggles play. On devices with a mouse, hovering plays and leaving pauses.
 * Only one video plays at a time, and a video pauses when it scrolls out of view.
 * Videos start muted; the speaker button in the corner turns sound on for all of them.
 * Events are delegated from the document so the clones <landing-strip> makes work too.
 */
(() => {
  if (window.landingPstVideo) return;
  window.landingPstVideo = true;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let current = null;
  // Videos start muted; once a visitor turns sound on, every video plays with sound
  let soundOn = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) pause(entry.target.closest('.landing-pst__media--video'));
    });
  });

  function play(media) {
    const video = media.querySelector('.landing-pst__video');
    if (!video || !video.dataset.src) return;
    if (current && current !== media) pause(current);

    if (!video.getAttribute('src')) {
      video.addEventListener('playing', () => media.classList.add('has-started'), { once: true });
      video.src = video.dataset.src;
    }
    setSound(media, soundOn);
    video.play().catch(() => {
      // Browsers can block sound without a click (e.g. on hover): retry muted
      if (video.muted) return pause(media);
      setSound(media, false);
      video.play().catch(() => pause(media));
    });

    current = media;
    media.classList.add('is-playing');
    media.querySelector('.landing-pst__play')?.setAttribute('aria-pressed', 'true');
    observer.observe(video);
  }

  function pause(media) {
    const video = media?.querySelector('.landing-pst__video');
    if (!video) return;
    video.pause();

    if (current === media) current = null;
    media.classList.remove('is-playing');
    media.querySelector('.landing-pst__play')?.setAttribute('aria-pressed', 'false');
    observer.unobserve(video);
  }

  function setSound(media, on) {
    const video = media.querySelector('.landing-pst__video');
    const button = media.querySelector('.landing-pst__sound');
    video.muted = !on;
    button?.setAttribute('aria-pressed', String(on));
    button?.setAttribute('aria-label', on ? 'Izklopi zvok' : 'Vklopi zvok');
  }

  document.addEventListener('click', (event) => {
    const soundButton = event.target.closest('.landing-pst__sound');
    if (soundButton) {
      soundOn = soundButton.getAttribute('aria-pressed') !== 'true';
      setSound(soundButton.closest('.landing-pst__media--video'), soundOn);
      return;
    }

    const button = event.target.closest('.landing-pst__play');
    if (!button) return;
    const media = button.closest('.landing-pst__media--video');
    media.classList.contains('is-playing') ? pause(media) : play(media);
  });

  document.addEventListener('mouseover', (event) => {
    if (!canHover.matches) return;
    const media = event.target.closest('.landing-pst__media--video');
    if (media && !media.contains(event.relatedTarget)) play(media);
  });

  document.addEventListener('mouseout', (event) => {
    if (!canHover.matches) return;
    const media = event.target.closest('.landing-pst__media--video');
    if (media && !media.contains(event.relatedTarget)) pause(media);
  });
})();
