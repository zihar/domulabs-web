/* ============================================================
   DomuLabs — Modern · vanilla JS (no dependencies)
   ============================================================ */
(function () {
	"use strict";

	const $ = (sel, ctx) => (ctx || document).querySelector(sel);
	const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* ---------- Year ---------- */
	const yearEl = $("#year");
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	/* ---------- Sticky nav state ---------- */
	const nav = $("#nav");
	const onScroll = () => {
		nav.classList.toggle("is-scrolled", window.scrollY > 8);
		backToTop.classList.toggle("is-visible", window.scrollY > 600);
	};

	/* ---------- Mobile drawer ---------- */
	const navToggle = $("#navToggle");
	const navLinks = $("#navLinks");
	const closeDrawer = () => {
		nav.classList.remove("is-open");
		navToggle.setAttribute("aria-expanded", "false");
	};
	navToggle.addEventListener("click", () => {
		const open = nav.classList.toggle("is-open");
		navToggle.setAttribute("aria-expanded", String(open));
	});
	navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) closeDrawer(); });
	document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

	/* ---------- Scrollspy ---------- */
	const navAnchors = $$('#navLinks a[href^="#"]:not(.btn)');
	const sections = navAnchors
		.map((a) => $(a.getAttribute("href")))
		.filter(Boolean);
	const spy = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const id = entry.target.id;
				navAnchors.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
			}
		});
	}, { rootMargin: "-45% 0px -50% 0px" });
	sections.forEach((s) => spy.observe(s));

	/* ---------- Reveal on scroll ---------- */
	const reveals = $$(".reveal");
	if (reduceMotion) {
		reveals.forEach((el) => el.classList.add("is-visible"));
	} else {
		const revObs = new IntersectionObserver((entries, obs) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
		reveals.forEach((el) => revObs.observe(el));
	}

	/* ---------- Count-up ---------- */
	const counters = $$("[data-count]");
	const runCount = (el) => {
		const target = parseInt(el.dataset.count, 10);
		const suffix = el.dataset.suffix || "";
		if (reduceMotion) { el.textContent = target + suffix; return; }
		const duration = 1400;
		const start = performance.now();
		const tick = (now) => {
			const p = Math.min((now - start) / duration, 1);
			const eased = 1 - Math.pow(1 - p, 3);
			el.textContent = Math.round(target * eased) + suffix;
			if (p < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	};
	const countObs = new IntersectionObserver((entries, obs) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) { runCount(entry.target); obs.unobserve(entry.target); }
		});
	}, { threshold: 0.6 });
	counters.forEach((el) => countObs.observe(el));

	/* ---------- Portfolio filter (animated) ---------- */
	const filters = $$(".filter");
	const works = $$(".work");
	const clearFx = (w) => { w.classList.remove("is-leaving", "is-entering"); w.style.transitionDelay = ""; };

	filters.forEach((btn) => {
		btn.addEventListener("click", () => {
			if (btn.classList.contains("is-active")) return;
			filters.forEach((b) => b.classList.remove("is-active"));
			btn.classList.add("is-active");
			const cat = btn.dataset.filter;
			const matches = (w) => cat === "all" || w.dataset.cat === cat;

			if (reduceMotion) {
				works.forEach((w) => w.classList.toggle("is-hidden", !matches(w)));
				return;
			}

			// Phase 1 — fade & scale out the items currently on screen
			works.forEach(clearFx);
			works.filter((w) => !w.classList.contains("is-hidden")).forEach((w) => w.classList.add("is-leaving"));

			// Phase 2 — swap visibility, then stagger the matching items back in
			window.setTimeout(() => {
				works.forEach((w) => { clearFx(w); w.classList.toggle("is-hidden", !matches(w)); });
				works.filter(matches).forEach((w, i) => {
					w.classList.add("is-entering");
					requestAnimationFrame(() => requestAnimationFrame(() => {
						w.style.transitionDelay = (i * 45) + "ms";
						w.classList.remove("is-entering");
					}));
				});
				window.setTimeout(() => works.forEach((w) => { w.style.transitionDelay = ""; }), 900);
			}, 300);
		});
	});

	/* ---------- Lightbox ---------- */
	const lightbox = $("#lightbox");
	if (lightbox) {
		const lightboxImg = $("#lightboxImg");
		const lightboxCap = $("#lightboxCaption");
		const lightboxClose = $("#lightboxClose");
		let lastFocused = null;
		const openLightbox = (src, title) => {
			lightboxImg.src = src;
			lightboxImg.alt = title || "";
			lightboxCap.textContent = title || "";
			lightbox.classList.add("is-open");
			lightbox.setAttribute("aria-hidden", "false");
			document.body.style.overflow = "hidden";
			lightboxClose.focus();
		};
		const hideLightbox = () => {
			lightbox.classList.remove("is-open");
			lightbox.setAttribute("aria-hidden", "true");
			document.body.style.overflow = "";
			if (lastFocused) lastFocused.focus();
		};
		$$(".work__zoom").forEach((btn) => {
			btn.addEventListener("click", () => {
				lastFocused = btn;
				openLightbox(btn.dataset.full, btn.dataset.title);
			});
		});
		lightboxClose.addEventListener("click", hideLightbox);
		lightbox.addEventListener("click", (e) => { if (e.target === lightbox) hideLightbox(); });
		document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox.classList.contains("is-open")) hideLightbox(); });
	}

	/* ---------- FAQ: close others (accordion) ---------- */
	const faqItems = $$("#faqList .faq__item");
	faqItems.forEach((item) => {
		item.addEventListener("toggle", () => {
			if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
		});
	});

	/* ---------- Contact form (Web3Forms) ---------- */
	// Get a free access key at https://web3forms.com (linked to zihar.mehta@gmail.com).
	const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";
	const form = $("#contactForm");
	if (form) {
		const note = $("#formNote");
		const submitBtn = form.querySelector("button[type='submit']");
		const setInvalid = (input, bad) => input.closest(".field").classList.toggle("is-invalid", bad);
		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			note.className = "form-note";
			const name = form.elements["name"];
			const email = form.elements["email"];
			const message = form.elements["message"];
			const subjectInput = form.elements["subject"];

			let ok = true;
			[name, email, message].forEach((f) => {
				const bad = !f.value.trim();
				setInvalid(f, bad);
				if (bad) ok = false;
			});
			if (email.value.trim() && !emailRe.test(email.value.trim())) { setInvalid(email, true); ok = false; }

			if (!ok) { note.textContent = "Please fill in the required fields correctly."; note.classList.add("is-error"); return; }

			const payload = {
				access_key: WEB3FORMS_ACCESS_KEY,
				subject: subjectInput.value.trim() || ("Project inquiry from " + name.value.trim()),
				from_name: "DomuLabs Website",
				name: name.value.trim(),
				email: email.value.trim(),
				replyto: email.value.trim(),
				message: message.value.trim(),
				botcheck: form.elements["botcheck"] ? form.elements["botcheck"].checked : false
			};

			const btnLabel = submitBtn ? submitBtn.textContent : "";
			if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
			note.textContent = "Sending your message…";

			try {
				const res = await fetch("https://api.web3forms.com/submit", {
					method: "POST",
					headers: { "Content-Type": "application/json", Accept: "application/json" },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (res.ok && data.success) {
					note.textContent = "Thanks! Your message has been sent — we'll get back to you soon.";
					note.classList.add("is-success");
					form.reset();
				} else {
					note.textContent = (data && data.message) || "Something went wrong. Please try again or email us directly.";
					note.classList.add("is-error");
				}
			} catch (err) {
				note.textContent = "Network error. Please try again or email us directly.";
				note.classList.add("is-error");
			} finally {
				if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnLabel; }
			}
		});

		form.querySelectorAll("input, textarea").forEach((f) => {
			f.addEventListener("input", () => f.closest(".field").classList.remove("is-invalid"));
		});
	}

	/* ---------- Scroll progress bar + hero parallax ---------- */
	const progress = document.createElement("div");
	progress.className = "scroll-progress";
	document.body.appendChild(progress);
	const heroGrid = $(".hero__grid");
	let ticking = false;
	const onScrollFx = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			const doc = document.documentElement;
			const max = doc.scrollHeight - doc.clientHeight;
			progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
			if (heroGrid && !reduceMotion && window.scrollY < window.innerHeight) {
				heroGrid.style.transform = "translateY(" + window.scrollY * 0.18 + "px)";
			}
			ticking = false;
		});
	};
	window.addEventListener("scroll", onScrollFx, { passive: true });
	onScrollFx();

	/* ---------- Cursor spotlight on cards ---------- */
	if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
		$$(".card").forEach((card) => {
			card.addEventListener("pointermove", (e) => {
				const r = card.getBoundingClientRect();
				card.style.setProperty("--mx", (e.clientX - r.left) + "px");
				card.style.setProperty("--my", (e.clientY - r.top) + "px");
			});
		});

		/* ---------- 3D tilt on portfolio cards ---------- */
		$$(".work").forEach((el) => {
			el.addEventListener("pointermove", (e) => {
				const r = el.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width - 0.5;
				const py = (e.clientY - r.top) / r.height - 0.5;
				el.style.transform = "perspective(820px) rotateX(" + (-py * 6) + "deg) rotateY(" + (px * 6) + "deg) translateY(-5px)";
			});
			el.addEventListener("pointerleave", () => { el.style.transform = ""; });
		});
	}

	/* ---------- Back to top ---------- */
	const backToTop = $("#backToTop");
	backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();
})();
