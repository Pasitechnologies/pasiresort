(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.querySelector('.primary-nav');
  const backToTop = document.querySelector('#back-to-top');

  // Keep the header useful after the opening hero and expose a quick return path.
  const updateScrollUI = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('scrolled', scrolled);
    backToTop.classList.toggle('visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    primaryNav.classList.toggle('open', open);
  });
  primaryNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('open');
  }));
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Progressive scroll reveals; the page stays fully visible if observers are unavailable.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Booking form is an enquiry demonstration only: it never checks availability or confirms a stay.
  const bookingForm = document.querySelector('#booking-form');
  const checkIn = document.querySelector('#check-in');
  const checkOut = document.querySelector('#check-out');
  const bookingMessage = document.querySelector('#booking-message');
  const today = new Date();
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  checkIn.min = todayISO;
  checkOut.min = todayISO;
  checkIn.addEventListener('change', () => {
    checkOut.min = checkIn.value || todayISO;
    if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = '';
  });
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    bookingMessage.textContent = '';
    if (!bookingForm.reportValidity()) return;
    if (checkIn.value < todayISO) {
      checkIn.setCustomValidity('Please choose today or a future date.');
      checkIn.reportValidity();
      checkIn.setCustomValidity('');
      return;
    }
    if (!checkOut.value || checkOut.value <= checkIn.value) {
      checkOut.setCustomValidity('Check-out must be after check-in.');
      checkOut.reportValidity();
      checkOut.setCustomValidity('');
      return;
    }
    const formData = new FormData(bookingForm);
    const prettyDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    bookingMessage.textContent = `Thanks — your enquiry for ${formData.get('room')} (${formData.get('guests')} guest${formData.get('guests') === '1' ? '' : 's'}, ${prettyDate(checkIn.value)} to ${prettyDate(checkOut.value)}) is ready. This demo has not checked availability or confirmed a reservation.`;
  });
  document.querySelectorAll('[data-room]').forEach((link) => link.addEventListener('click', () => {
    const roomSelect = bookingForm.elements.room;
    roomSelect.value = link.dataset.room;
  }));

  // Contact and newsletter submissions provide honest local demo feedback only.
  const contactForm = document.querySelector('#contact-form');
  const contactMessage = document.querySelector('#contact-message');
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    contactMessage.textContent = '';
    if (!contactForm.reportValidity()) return;
    const email = contactForm.elements.email;
    if (!email.validity.valid) {
      email.reportValidity();
      return;
    }
    contactMessage.textContent = 'Thank you for your note. This is a demonstration form; your message has not been sent.';
    contactForm.reset();
  });
  const newsletterForm = document.querySelector('#newsletter-form');
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('#newsletter-email');
    const message = document.querySelector('#newsletter-message');
    if (!email.reportValidity()) return;
    message.textContent = 'Thanks for your interest. This demo does not store email addresses or send newsletters.';
    newsletterForm.reset();
  });
  document.querySelector('#copyright-year').textContent = new Date().getFullYear();

  // Accessible image viewer with wrapping previous/next controls and keyboard escape support.
  const galleryItems = [...document.querySelectorAll('.gallery-item')];
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  const lightboxCount = document.querySelector('#lightbox-count');
  let activeImageIndex = 0;
  const showGalleryImage = (index) => {
    activeImageIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeImageIndex];
    const image = item.querySelector('img');
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.alt;
    lightboxCount.textContent = `${String(activeImageIndex + 1).padStart(2, '0')} / ${String(galleryItems.length).padStart(2, '0')}`;
  };
  const openGallery = (index = 0) => {
    showGalleryImage(index);
    if (!lightbox.open) lightbox.showModal();
  };
  galleryItems.forEach((item, index) => item.addEventListener('click', () => openGallery(index)));
  document.querySelector('#open-gallery').addEventListener('click', () => openGallery(0));
  document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  document.querySelector('.lightbox-prev').addEventListener('click', () => showGalleryImage(activeImageIndex - 1));
  document.querySelector('.lightbox-next').addEventListener('click', () => showGalleryImage(activeImageIndex + 1));
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showGalleryImage(activeImageIndex - 1);
    if (event.key === 'ArrowRight') showGalleryImage(activeImageIndex + 1);
  });

  // Room details use a native dialog, with each card supplying its own content.
  const roomDialog = document.querySelector('#room-dialog');
  const roomDialogImage = document.querySelector('#room-dialog-image');
  const roomDialogTitle = document.querySelector('#room-dialog-title');
  const roomDialogDescription = document.querySelector('#room-dialog-description');
  const roomDialogLink = document.querySelector('#room-dialog-link');
  document.querySelectorAll('.room-details').forEach((button) => button.addEventListener('click', () => {
    roomDialogTitle.textContent = button.dataset.title;
    roomDialogDescription.textContent = button.dataset.description;
    roomDialogImage.src = button.dataset.image;
    roomDialogImage.alt = `${button.dataset.title} accommodation`;
    roomDialogLink.dataset.room = button.dataset.title;
    roomDialog.showModal();
  }));
  document.querySelector('.dialog-close').addEventListener('click', () => roomDialog.close());
  roomDialog.addEventListener('click', (event) => { if (event.target === roomDialog) roomDialog.close(); });
  roomDialogLink.addEventListener('click', () => {
    bookingForm.elements.room.value = roomDialogLink.dataset.room;
    roomDialog.close();
  });

  // A small, keyboard-friendly testimonial carousel; all supplied reviews are sample content.
  const reviews = [
    { quote: '“The kind of place that makes you forget to check your phone. Beautifully considered, warm at every turn, and impossible to leave in a hurry.”', name: 'Avery M.', detail: 'A sample guest note · Demonstration content', initial: 'A' },
    { quote: '“We came to celebrate and somehow found exactly the quiet we needed. The gardens, the food, the little details — all of it felt thoughtful.”', name: 'Jordan & Sam', detail: 'A sample guest note · Demonstration content', initial: 'J' },
    { quote: '“A gentle, welcoming stay from the first hello. We left already dreaming about finding our way back.”', name: 'Taylor R.', detail: 'A sample guest note · Demonstration content', initial: 'T' }
  ];
  let reviewIndex = 0;
  const renderReview = () => {
    const review = reviews[reviewIndex];
    document.querySelector('#testimonial-quote').textContent = review.quote;
    document.querySelector('#reviewer-name').textContent = review.name;
    document.querySelector('#reviewer-detail').textContent = review.detail;
    document.querySelector('#reviewer-avatar').textContent = review.initial;
    document.querySelector('#testimonial-count').innerHTML = `${String(reviewIndex + 1).padStart(2, '0')} <i>/ ${String(reviews.length).padStart(2, '0')}</i>`;
  };
  document.querySelector('#testimonial-prev').addEventListener('click', () => {
    reviewIndex = (reviewIndex - 1 + reviews.length) % reviews.length;
    renderReview();
  });
  document.querySelector('#testimonial-next').addEventListener('click', () => {
    reviewIndex = (reviewIndex + 1) % reviews.length;
    renderReview();
  });
})();
