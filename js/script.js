// ==========================================================================
// MottoCake Creative Preloader Engine (Senior Developer)
// ==========================================================================
(function initMottoCakePreloader() {
    const preloader = document.getElementById('mk-preloader');
    if (!preloader) return;

    // Show ONLY on the very first homepage visit in this session
    let hasSeenPreloader = false;
    try {
        hasSeenPreloader = sessionStorage.getItem('mk_preloader_seen') === 'true';
    } catch (error) {
        console.warn('Preloader state could not be read from session storage.', error);
    }

    if (hasSeenPreloader) {
        preloader.style.display = 'none';
        document.body.classList.remove('mk-loading');
        return;
    }

    // Flag as seen so all future visits / page navigations skip it
    try {
        sessionStorage.setItem('mk_preloader_seen', 'true');
    } catch (error) {
        console.warn('Preloader state could not be saved to session storage.', error);
    }
    document.body.classList.add('mk-loading');

    const startTime = performance.now();
    const minDuration = 1250; // smooth presentation duration (ms)
    let isFinished = false;

    function triggerReveal() {
        if (isFinished) return;
        isFinished = true;

        const elapsed = performance.now() - startTime;
        const delay = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
            // Stage 1: Soft scale & fade inner elements
            preloader.classList.add('mk-stage-exit');

            // Stage 2: Curtain upward sweep (Awwwards-style cubic-bezier)
            setTimeout(() => {
                preloader.classList.add('mk-curtain-up');
                document.body.classList.remove('mk-loading');

                // Stage 3: Clean up and hide
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 850);
            }, 280);
        }, delay);
    }

    // Event Listeners
    if (document.readyState === 'complete') {
        triggerReveal();
    } else {
        window.addEventListener('load', triggerReveal);
    }

    // Fallback safety timeout (max 2.6s) in case an external script hangs
    setTimeout(() => {
        triggerReveal();
    }, 2600);

    // Handle browser Back/Forward (bfcache)
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            preloader.style.display = 'none';
            document.body.classList.remove('mk-loading');
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const mobileBtn = document.querySelector('.mobile-nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileBtn.setAttribute('aria-expanded', nav.classList.contains('active') ? 'true' : 'false');

            // Toggle icon
            const icon = mobileBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });

    // Close mobile menu when clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (nav && mobileBtn && nav.classList.contains('active')) {
            const isClickInsideMenu = nav.contains(e.target);
            const isClickOnToggle = mobileBtn.contains(e.target);

            if (!isClickInsideMenu && !isClickOnToggle) {
                nav.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        }
    });

    // Sticky Header Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Dynamic Form Subject & AJAX Submission
    const contactForms = document.querySelectorAll('.contact-form');
    contactForms.forEach(form => {
        const nameInput = form.querySelector('input[name="name"]');
        const subjectInput = form.querySelector('input[name="subject"]');

        if (nameInput && subjectInput) {
            const originalSubject = subjectInput.value;
            const subjectPrefix = form.dataset.subjectPrefix || 'Tortenanfrage von:';
            nameInput.addEventListener('input', (e) => {
                const name = e.target.value.trim();
                if (name) {
                    subjectInput.value = `${subjectPrefix} ${name}`;
                } else {
                    subjectInput.value = originalSubject;
                }
            });
        }

        // Handle Form Submission via AJAX to ensure redirect works
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            const feedback = form.querySelector('[data-form-feedback]');
            submitBtn.innerText = 'Wird gesendet...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const object = {};
            formData.forEach((value, key) => {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    object[key] = Array.isArray(object[key]) ? [...object[key], value] : [object[key], value];
                } else {
                    object[key] = value;
                }
            });
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
                .then(async (response) => {
                    const result = await response.json();
                    if (response.ok && result.success) {
                        // Redirect manually on success
                        window.location.href = "thanks.html";
                    } else {
                        throw new Error(result.message || 'Die Anfrage konnte nicht gesendet werden.');
                    }
                })
                .catch(error => {
                    console.error('Contact form submission failed.', error);
                    const message = "Senden fehlgeschlagen. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per WhatsApp.";
                    if (feedback) {
                        feedback.textContent = message;
                    } else {
                        alert(message);
                    }
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    });

    // Gallery Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');

                galleryCards.forEach(card => {
                    const category = card.getAttribute('data-category');

                    if (filter === 'all' || filter === category) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // Restrict guests input to positive whole numbers only
    const guestsInput = document.getElementById('guests');
    if (guestsInput) {
        guestsInput.addEventListener('keydown', (e) => {
            // Allow control keys (Backspace, Tab, Escape, Enter, Arrow keys, etc.)
            const allowedKeys = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
            ];
            if (e.metaKey || e.ctrlKey || allowedKeys.includes(e.key)) {
                return;
            }
            // Block anything that is not a numeric digit (0-9)
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Clean any non-digit characters on input (handles paste/drag & drop)
        guestsInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
});
