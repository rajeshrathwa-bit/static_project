/* ============================================================
   Nexus — Landing page interactivity (vanilla JS, no build step)
   Sections: mobile menu / navbar scroll / reveal / FAQ /
             theme toggle / counters / year / CTA form
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ----------------------------------------------------------
     1. Mobile menu
  ---------------------------------------------------------- */
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    const iconMenu = menuBtn.querySelector(".icon-menu");
    const iconClose = menuBtn.querySelector(".icon-close");

    const setMenu = (open) => {
      mobileMenu.classList.toggle("show", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      if (iconMenu) iconMenu.classList.toggle("hidden", open);
      if (iconClose) iconClose.classList.toggle("hidden", !open);
    };

    menuBtn.addEventListener("click", () => {
      setMenu(!mobileMenu.classList.contains("show"));
    });

    // Close when a link inside the menu is clicked (delegation)
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     2. Navbar scroll state
  ---------------------------------------------------------- */
  const navbar = document.getElementById("navbar");

  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     3. Scroll reveal (IntersectionObserver + fallback)
  ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ----------------------------------------------------------
     4. FAQ accordion (single-open)
  ---------------------------------------------------------- */
  const faqList = document.querySelector(".faq-list") || document;

  faqList.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-question");
    if (!btn) return;

    const item = btn.closest(".faq-item");
    if (!item) return;

    const willOpen = !item.classList.contains("open");

    // Close all other open items
    document.querySelectorAll(".faq-item.open").forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove("open");
        const openBtn = openItem.querySelector(".faq-question");
        if (openBtn) openBtn.setAttribute("aria-expanded", "false");
      }
    });

    item.classList.toggle("open", willOpen);
    btn.setAttribute("aria-expanded", String(willOpen));
  });

  /* ----------------------------------------------------------
     5. Dark mode
  ---------------------------------------------------------- */
  const themeToggles = document.querySelectorAll(
    "#theme-toggle, #theme-toggle-mobile"
  );
  const root = document.documentElement;
  const THEME_KEY = "nexus-theme";

  const iconSun = document.querySelector(".icon-sun");
  const iconMoon = document.querySelector(".icon-moon");

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    root.classList.toggle("dark", isDark);
    if (iconSun) iconSun.classList.toggle("hidden", isDark);
    if (iconMoon) iconMoon.classList.toggle("hidden", !isDark);
    themeToggles.forEach((btn) =>
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      )
    );
  };

  // Initial theme: localStorage > prefers-color-scheme > light
  const storedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(storedTheme || (prefersDark ? "dark" : "light"));

  themeToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.classList.contains("dark") ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  });

  /* ----------------------------------------------------------
     6. Animated counters
  ---------------------------------------------------------- */
  const formatNumber = (value, el) => {
    const format = el.dataset.format;
    const suffix = el.dataset.suffix || "";
    let out;

    if (format === "comma") {
      out = Math.round(value).toLocaleString("en-US");
    } else {
      out = String(Math.round(value));
    }
    return out + suffix;
  };

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;

    const duration = 1500;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = formatNumber(target * eased, el);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target, el);
      }
    };

    requestAnimationFrame(step);
  };

  const counters = document.querySelectorAll("[data-count]");

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => {
        el.textContent = formatNumber(0, el);
        counterObserver.observe(el);
      });
    } else {
      counters.forEach((el) => {
        el.textContent = formatNumber(parseFloat(el.dataset.count) || 0, el);
      });
    }
  }

  /* ----------------------------------------------------------
     7. Footer year
  ---------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------
     8. Pricing email CTA form
  ---------------------------------------------------------- */
  const ctaForm =
    document.getElementById("cta-form") || document.querySelector("form");

  if (ctaForm) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Existing hidden success element (if markup provides one)
    let successEl = ctaForm.querySelector(".form-success");

    ctaForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = ctaForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : "";

      if (!emailRe.test(email)) {
        if (emailInput) {
          emailInput.classList.add("border-red-500");
          emailInput.focus();
        }
        return;
      }

      if (emailInput) emailInput.classList.remove("border-red-500");

      if (successEl) {
        successEl.classList.remove("hidden");
        ctaForm.reset();
      } else {
        const div = document.createElement("div");
        div.className =
          "form-success w-full rounded-xl bg-emerald-500/10 border border-emerald-500/40 px-6 py-5 text-center";
        div.setAttribute("role", "status");
        div.innerHTML =
          '<p class="font-semibold text-emerald-400">You\'re on the list!</p>' +
          '<p class="mt-1 text-sm text-slate-400">Check your inbox for a confirmation email.</p>';
        ctaForm.replaceWith(div);
        successEl = div;
      }
    });
  }
});
