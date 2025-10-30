document.addEventListener("DOMContentLoaded", function () {
  const MODAL_DURATION_MS = 60000; // 60 segundos de exibição
  const MODAL_FADE_MS = 600;       // mesma duração do fade do CSS

  const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.startsWith("192.168.");
  const backendUrl = isLocal ? "http://localhost:5000" : window.location.origin;

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
    index = (i + slides.length) % slides.length;
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

    slider.style.cursor = 'pointer';
    slider.addEventListener('click', () => {
      const contatoSection = document.querySelector('.contato-secao');
      if (contatoSection) contatoSection.scrollIntoView({ behavior: 'smooth' });
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
  // MODAL CENTRAL
  // ===========================
  const modalOverlay = document.getElementById('modal-central');
  const fecharModalBtn = modalOverlay?.querySelector('.fechar-modal');

  function fecharModalCentral() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('show');
    setTimeout(() => { modalOverlay.style.display = 'none'; }, MODAL_FADE_MS);
  }

  function mostrarModalCentral(mensagem, sucesso = true) {
    if (!modalOverlay) return;
    const modalText = modalOverlay.querySelector('h3');
    const modalSubtext = modalOverlay.querySelector('#modal-subtext');
    const iconeConfirmacao = modalOverlay.querySelector('.icone-confirmacao');

    modalText.textContent = mensagem;

    if (sucesso) {
      iconeConfirmacao.textContent = '✔';
      iconeConfirmacao.style.color = 'green';
      modalSubtext.textContent = "Em breve entraremos em contato com você.";
      modalSubtext.style.display = 'block';
    } else {
      iconeConfirmacao.textContent = '❌';
      iconeConfirmacao.style.color = 'red';
      modalSubtext.textContent = "";
      modalSubtext.style.display = 'none';
    }

    modalOverlay.style.display = 'flex';
    requestAnimationFrame(() => modalOverlay.classList.add('show'));
    clearTimeout(modalOverlay._timer);
    modalOverlay._timer = setTimeout(() => fecharModalCentral(), MODAL_DURATION_MS);
  }

  fecharModalBtn?.addEventListener('click', fecharModalCentral);
  modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) fecharModalCentral(); });

  // ===========================
  // ENVIO FORMULÁRIO COM reCAPTCHA v3
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
        // ✅ reCAPTCHA v3
        await grecaptcha.ready(async function() {
          const token = await grecaptcha.execute('6LcMrPsrAAAAAFhWYtlCAQ1QxDyYBtTUYej6QBzs', {action: 'submit'});
          data.token = token;

          const response = await fetch(`${backendUrl}/api/contato`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!response.ok) throw new Error('Erro no envio');

          // Mostra modal de sucesso
          form.reset();
          campoRetorno.innerHTML = '';
          if (formulario) formulario.style.display = 'none';
          if (checkboxForm) checkboxForm.checked = false;
          botoes.forEach(b => b.classList.remove("ativo"));

          mostrarModalCentral("Mensagem enviada com sucesso!", true);
        });
      } catch (err) { 
        console.error(err); 
        mostrarModalCentral("Erro ao enviar, tente novamente.", false); 
      }
    });
  }

  // ===========================
  // COOKIES
  // ===========================
  const cookieBanner = document.getElementById("cookie-banner");
  const aceitarBtn = document.getElementById("aceitar-cookies");
  const recusarBtn = document.getElementById("recusar-cookies");

  function mostrarBanner() { if (!localStorage.getItem("cookiesChoice")) cookieBanner?.classList.add("show"); }
  aceitarBtn?.addEventListener("click", () => { localStorage.setItem("cookiesChoice", "aceitar"); cookieBanner.classList.remove("show"); });
  recusarBtn?.addEventListener("click", () => { localStorage.setItem("cookiesChoice", "recusar"); cookieBanner.classList.remove("show"); });

  mostrarBanner();
});
