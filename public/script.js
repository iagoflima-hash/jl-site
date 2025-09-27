document.addEventListener("DOMContentLoaded", function () {
  const MODAL_DURATION_MS = 60000; 
  const MODAL_FADE_MS = 600;       

  // URL do backend (ajuste para produção depois)
  const backendUrl = 'http://192.168.0.35:5000';

  // ===========================
  // SLIDER DE IMAGENS
  // ===========================
  const slider = document.querySelector(".slider");
  const slides = document.querySelectorAll(".slider img");
  const dots = document.querySelectorAll(".dot");
  let index = 0;
  let timeoutId;
  let pausaUsuario = false;

  function showSlide(i) {
    if (!slider || slides.length === 0) return;
    if (i >= slides.length) index = 0;
    else if (i < 0) index = slides.length - 1;
    else index = i;

    slider.style.transform = `translateX(${-index * 100}%)`;
    if (dots) dots.forEach((dot, idx) => dot.classList.toggle("active", idx === index));

    if (!pausaUsuario) startSlideTimer();
  }

  function startSlideTimer(delayCustom = null) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => showSlide(index + 1), delayCustom || 10000);
  }

  function stopSlideTimer() {
    clearTimeout(timeoutId);
  }

  if (slider) {
    slider.addEventListener("mouseenter", () => { stopSlideTimer(); startSlideTimer(5000); });
    slider.addEventListener("mouseleave", () => { if (!pausaUsuario) startSlideTimer(); });

    let startX = 0;
    slider.addEventListener("touchstart", e => startX = e.touches[0].clientX);
    slider.addEventListener("touchend", e => {
      const endX = e.changedTouches[0].clientX;
      if (endX - startX > 50) showSlide(index - 1);
      else if (startX - endX > 50) showSlide(index + 1);
    });
  }

  if (dots) {
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        pausaUsuario = true;
        showSlide(i);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { pausaUsuario = false; startSlideTimer(); }, 30000);
      });
    });
  }

  showSlide(0);

  // ===========================
  // CLIQUE NA SEGUNDA IMAGEM DO SLIDER
  // ===========================
  if (slides[1]) {
    slides[1].style.cursor = 'pointer';
    slides[1].addEventListener('click', () => {
        const contatoSection = document.querySelector('.contato-secao');
        if (contatoSection) {
            contatoSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
  }

  // ===========================
  // FORMULÁRIO COM CHECKBOX
  // ===========================
  const checkboxForm = document.getElementById("mostrar-form");
  const formulario = document.getElementById("formulario-contato");

  if (checkboxForm && formulario) {
    formulario.style.display = checkboxForm.checked ? "block" : "none";
    checkboxForm.addEventListener("change", () => {
      formulario.style.display = checkboxForm.checked ? "block" : "none";
    });
  }

  const perguntaCheckbox = document.querySelector(".contato-pergunta input[type='checkbox']");
  const perguntaLabel = document.querySelector(".contato-pergunta");

  if (perguntaCheckbox && perguntaLabel) {
    perguntaLabel.addEventListener("click", e => {
      if (e.target !== perguntaCheckbox) {
        perguntaCheckbox.checked = !perguntaCheckbox.checked;
        if (formulario) formulario.style.display = perguntaCheckbox.checked ? "block" : "none";
      }
    });
  }

  // ===========================
  // BOTÕES DE RETORNO
  // ===========================
  const botoes = document.querySelectorAll(".retorno-btn");
  const campoRetorno = document.getElementById("campo-retorno");

  if (botoes && campoRetorno) {
    botoes.forEach(botao => {
      botao.addEventListener("click", () => {
        botoes.forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");

        campoRetorno.innerHTML = "";

        let placeholder = "", typeInput = "text";
        if (botao.dataset.tipo === "email") { placeholder = "Digite aqui seu e-mail"; typeInput = "email"; }
        else if (botao.dataset.tipo === "whatsapp") { placeholder = "Digite aqui seu WhatsApp"; typeInput = "tel"; }
        else if (botao.dataset.tipo === "telefone") { placeholder = "Digite aqui seu telefone fixo"; typeInput = "tel"; }

        campoRetorno.innerHTML = `<input type="${typeInput}" name="${botao.dataset.tipo}" placeholder="${placeholder}" required />`;
      });
    });
  }

  // ===========================
  // VALIDAÇÕES
  // ===========================
  const validarEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarTelefone = tel => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(tel);

  // ===========================
  // ENVIO FORMULÁRIO
  // ===========================
  const form = document.querySelector('#formulario-contato form');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const retornoBtn = document.querySelector(".retorno-btn.ativo");
      const data = {
        nome: form.nome.value.trim(),
        mensagem: form.mensagem.value.trim(),
        retornoTipo: retornoBtn ? retornoBtn.dataset.tipo : "",
        retornoValor: document.querySelector('#campo-retorno input') ? document.querySelector('#campo-retorno input').value.trim() : ""
      };

      if (!data.nome || !data.mensagem || !data.retornoTipo || !data.retornoValor) {
        alert("Por favor, preencha todos os campos e escolha uma forma de contato.");
        return;
      }

      if (data.retornoTipo === "email" && !validarEmail(data.retornoValor)) { alert("Por favor, digite um e-mail válido."); return; }
      if ((data.retornoTipo === "telefone" || data.retornoTipo === "whatsapp") && !validarTelefone(data.retornoValor)) { alert("Por favor, digite um telefone válido (com DDD)."); return; }

      try {
        const response = await fetch(`${backendUrl}/api/contato`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok) {
          mostrarModalCentral();
          form.reset();
          campoRetorno.innerHTML = '';
          if (formulario) formulario.style.display = 'none';
          if (checkboxForm) checkboxForm.checked = false;
          botoes.forEach(b => b.classList.remove("ativo"));
        } else alert(result.message || 'Erro ao enviar.');
      } catch (err) { console.error(err); alert('Erro ao enviar, tente novamente.'); }
    });
  }

  // ===========================
  // MODAL CENTRAL
  // ===========================
  const modalOverlay = document.getElementById('modal-central');
  const fecharModal = modalOverlay?.querySelector('.fechar-modal');

  function mostrarModalCentral() {
    if (!modalOverlay) return;
    modalOverlay.style.display = 'flex';
    modalOverlay.classList.add('show');
    if (modalOverlay._timer) clearTimeout(modalOverlay._timer);
    modalOverlay._timer = setTimeout(() => {
      modalOverlay.classList.remove('show');
      setTimeout(() => modalOverlay.style.display = 'none', MODAL_FADE_MS);
    }, MODAL_DURATION_MS);
  }

  if (fecharModal) fecharModal.addEventListener('click', () => {
    modalOverlay.classList.remove('show');
    setTimeout(() => modalOverlay.style.display = 'none', MODAL_FADE_MS);
    if (modalOverlay._timer) clearTimeout(modalOverlay._timer);
  });

  if (modalOverlay) modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('show');
      setTimeout(() => modalOverlay.style.display = 'none', MODAL_FADE_MS);
      if (modalOverlay._timer) clearTimeout(modalOverlay._timer);
    }
  });

  // ===========================
  // MOBILE MENU
  // ===========================
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    const menuToggle = document.querySelector(".hamburger");
    const mobileMenu = document.querySelector(".mobile-menu");
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener("click", () => mobileMenu.classList.toggle("active"));
      mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => mobileMenu.classList.remove("active"));
      });
    }
  }
});
