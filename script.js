/* ============================================
   VOBIUS LABS - Scroll-Driven Video Controller
   ============================================ */

(function () {
  'use strict';

  const video = document.getElementById('scrollVideo');
  const videoContainer = document.getElementById('videoContainer');
  const scrollSpacer = document.getElementById('scrollSpacer');
  const progressFill = document.getElementById('progressFill');
  const contentBlocks = document.querySelectorAll('.content-block');

  // Configuration
  const SCROLL_MULTIPLIER = 800; // vh - total scroll height as % of viewport
  const FRAME_RATE = 30; // Target video frame rate for smooth seeking

  let videoReady = false;
  let ticking = false;
  let lastScrollProgress = -1;

  // ---- Initialize ----
  function init() {
    // Set scroll spacer height
    scrollSpacer.style.height = `${SCROLL_MULTIPLIER}vh`;

    // Video error handler - fallback to gradient background
    video.addEventListener('error', onVideoError);
    video.querySelector('source').addEventListener('error', onVideoError);

    // Wait for video metadata
    video.addEventListener('loadedmetadata', onVideoReady);

    // If already loaded
    if (video.readyState >= 1) {
      onVideoReady();
    }

    // Start scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial update
    requestAnimationFrame(update);
  }

  function onVideoReady() {
    videoReady = true;
    // Ensure video is paused - we control playback via scroll
    video.pause();
    // Force first frame
    try {
      video.currentTime = 0;
    } catch (e) {
      // iOS Safari may throw on early seek
    }
    update();
  }

  function onVideoError() {
    videoReady = false;
    videoContainer.classList.add('video-fallback');
  }

  // ---- Scroll Handler ----
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function update() {
    ticking = false;

    const scrollTop = window.scrollY || window.pageYOffset;
    const maxScroll = scrollSpacer.offsetHeight - window.innerHeight;
    const scrollProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);

    // Update progress bar
    progressFill.style.width = `${scrollProgress * 100}%`;

    // Update video frame
    if (videoReady && video.duration) {
      const targetTime = scrollProgress * video.duration;

      // Only seek if we've moved enough (reduces jank)
      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        try {
          video.currentTime = targetTime;
        } catch (e) {
          // iOS Safari may throw on currentTime seek
        }
      }
    }

    // Update content blocks visibility
    updateContentBlocks(scrollProgress);

    lastScrollProgress = scrollProgress;
  }

  // ---- Content Block Fade Controller ----
  function updateContentBlocks(progress) {
    contentBlocks.forEach((block) => {
      const start = parseFloat(block.dataset.start);
      const end = parseFloat(block.dataset.end);

      // Fade-in and fade-out zones (10% of the block's range on each side)
      const range = end - start;
      const fadeZone = range * 0.2;

      let opacity = 0;

      if (progress >= start && progress <= end) {
        // Within the block's active range
        if (progress < start + fadeZone) {
          // Fading in
          opacity = (progress - start) / fadeZone;
        } else if (progress > end - fadeZone) {
          // Fading out
          opacity = (end - progress) / fadeZone;
        } else {
          // Fully visible
          opacity = 1;
        }
      }

      // Apply
      opacity = Math.min(Math.max(opacity, 0), 1);

      if (opacity > 0.01) {
        block.classList.add('visible');
        block.style.opacity = opacity;
        // Subtle parallax on the inner content
        const innerProgress = (progress - start) / range;
        const translateY = (1 - innerProgress) * 30 - 15; // -15 to +15px
        block.querySelector('.content-inner').style.transform = `translateY(${translateY}px)`;
      } else {
        block.classList.remove('visible');
        block.style.opacity = 0;
      }
    });
  }

  // ---- Smooth Scroll Hint (auto-scroll on load for discoverability) ----
  // Uncomment below to add a subtle auto-scroll hint on first load
  /*
  function autoScrollHint() {
    if (window.scrollY === 0) {
      window.scrollTo({ top: 50, behavior: 'smooth' });
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 800);
    }
  }
  setTimeout(autoScrollHint, 2000);
  */

  // ---- Kick off ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
