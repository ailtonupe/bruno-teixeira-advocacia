/* ═══════════════════════════════════════════════════════════════
   BRUNO TEIXEIRA ADVOCACIA — JavaScript
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── NAVBAR: scroll effect + mobile toggle ─────────────────────
(function initNavbar() {
  const navbar  = document.getElementById('navbar');
  const toggle  = document.getElementById('navToggle');
  const links   = document.getElementById('navLinks');
  const navAnchors = document.querySelectorAll('.nav-link, .nav-cta');

  // Scroll: adicionar classe "scrolled"
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Fechar menu ao clicar em link
  navAnchors.forEach(anchor => {
    anchor.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', false);
    });
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
})();

// ── REVEAL ON SCROLL ──────────────────────────────────────────
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay baseado na posição do elemento no DOM
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
        const index = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${index * 0.08}s`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

// ── ACTIVE NAV LINK (scroll spy) ─────────────────────────────
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function setActive() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();

// ── FORMULÁRIO DE CONTATO ─────────────────────────────────────
(function initContactForm() {
  const form      = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnText   = document.getElementById('btnText');
  const btnLoading = document.getElementById('btnLoading');
  const successMsg = document.getElementById('formSuccess');
  const errorMsg   = document.getElementById('formError');

  // Validação individual de campo
  function validateField(id, errorId, validationFn) {
    const field = document.getElementById(id);
    const error = document.getElementById(errorId);
    if (!field) return true;

    const msg = validationFn(field.value.trim());
    if (error) error.textContent = msg;
    field.style.borderColor = msg ? '#FF6B6B' : '';
    return !msg;
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v) { return /^[\d\s\(\)\-\+]{8,20}$/.test(v); }

  const validators = {
    nome:     v => !v ? 'Por favor, informe seu nome.' : v.length < 3 ? 'Nome muito curto.' : '',
    email:    v => !v ? 'Por favor, informe seu e-mail.' : !isEmail(v) ? 'E-mail inválido.' : '',
    telefone: v => !v ? 'Por favor, informe seu telefone.' : !isPhone(v) ? 'Telefone inválido.' : '',
    mensagem: v => !v ? 'Por favor, descreva seu caso.' : v.length < 20 ? 'Mensagem muito curta (mín. 20 caracteres).' : '',
  };

  // Validação em tempo real (blur)
  ['nome', 'email', 'telefone', 'mensagem'].forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur', () => {
      validateField(id, `${id}-error`, validators[id]);
    });
    field.addEventListener('input', () => {
      const err = document.getElementById(`${id}-error`);
      if (err && err.textContent) validateField(id, `${id}-error`, validators[id]);
    });
  });

  // Máscara de telefone simples
  const telInput = document.getElementById('telefone');
  if (telInput) {
    telInput.addEventListener('input', () => {
      let v = telInput.value.replace(/\D/g, '');
      if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
      telInput.value = v.trim().replace(/-$/, '');
    });
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Validar todos os campos
    const validFields = [
      validateField('nome',     'nome-error',     validators.nome),
      validateField('email',    'email-error',     validators.email),
      validateField('telefone', 'telefone-error',  validators.telefone),
      validateField('mensagem', 'mensagem-error',  validators.mensagem),
    ];

    // Validar LGPD
    const lgpd = document.getElementById('lgpd');
    const lgpdErr = document.getElementById('lgpd-error');
    let lgpdOk = true;
    if (lgpd && !lgpd.checked) {
      if (lgpdErr) lgpdErr.textContent = 'Você precisa aceitar a Política de Privacidade.';
      lgpdOk = false;
    } else {
      if (lgpdErr) lgpdErr.textContent = '';
    }

    if (!validFields.every(Boolean) || !lgpdOk) {
      // Scroll até o primeiro erro
      const firstError = form.querySelector('[style*="FF6B6B"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Estado de carregamento
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    // Simular envio (substitua por fetch para integração real)
    try {
      await simulateFormSubmit({
        nome:     document.getElementById('nome').value.trim(),
        email:    document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        assunto:  document.getElementById('assunto').value,
        mensagem: document.getElementById('mensagem').value.trim(),
      });

      successMsg.style.display = 'block';
      form.reset();
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      errorMsg.style.display = 'block';
      console.error('Erro ao enviar formulário:', err);
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  });

  /**
   * Simula envio — substitua por sua integração real.
   * Exemplos de integração gratuita:
   *   - Formspree: fetch('https://formspree.io/f/SEU_ID', { method:'POST', body: formData })
   *   - Web3Forms: fetch('https://api.web3forms.com/submit', ...)
   *   - EmailJS: emailjs.send(...)
   */
  function simulateFormSubmit(data) {
    console.log('Dados do formulário:', data);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simula 95% de sucesso
        Math.random() > 0.05 ? resolve() : reject(new Error('Falha simulada'));
      }, 1500);
    });
  }
})();

// ── SMOOTH SCROLL para links âncora ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── ACTIVE NAV LINK: adiciona estilo visual ──────────────────
// (CSS complementar para estado ativo)
const style = document.createElement('style');
style.textContent = `
  .nav-link.active {
    color: var(--gold) !important;
  }
  .nav-link.active::after {
    width: 100% !important;
  }
`;
document.head.appendChild(style);
