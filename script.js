document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const form = document.querySelector('.apply');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Заявка отправлена! Мы свяжемся в Discord.');
      form.reset();
    });
  }
});


