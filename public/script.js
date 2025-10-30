// ==================== CONFIGURAÇÕES ====================
const backendUrl = "https://jl-backend.onrender.com";

// ==================== ELEMENTOS ====================
const checkboxForm = document.getElementById("mostrar-form");
const formulario = document.getElementById("formulario-contato");
const botoes = document.querySelectorAll(".retorno-btn");
const campoRetorno = document.getElementById("campo-retorno");
const form = document.getElementById("form-contato");

// ==================== MOSTRAR / ESCONDER FORMULÁRIO ====================
if (checkboxForm && formulario) {
  checkboxForm.addEventListener("change", () => {
    formulario.style.display = checkboxForm.checked ? "flex" : "none";
  });
}

// ==================== BOTÕES DE RETORNO ====================
botoes.forEach(btn => {
  btn.addEventListener("click", () => {
    botoes.forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");

    const tipo = btn.dataset.tipo;
    let placeholder = "";

    if (tipo === "email") placeholder = "Digite seu e-mail";
    if (tipo === "telefone") placeholder = "Digite seu telefone com DDD";
    if (tipo === "whatsapp") placeholder = "Digite seu WhatsApp com DDD";

    campoRetorno.innerHTML = `
      <label>${placeholder}</label>
      <input type="text" placeholder="${placeholder}" required>
    `;
  });
});

// ==================== VALIDAÇÕES ====================
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarTelefone(telefone) {
  const numeros = telefone.replace(/\D/g, "");
  return numeros.length >= 10 && numeros.length <= 11;
}

// ==================== MODAL CENTRAL ====================
function mostrarModalCentral(mensagem, sucesso = true) {
  const modal = document.createElement("div");
  modal.classList.add("modal-central");
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.background = "#fff";
  modal.style.padding = "20px 30px";
  modal.style.borderRadius = "10px";
  modal.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
  modal.style.textAlign = "center";
  modal.style.zIndex = "9999";
  modal.style.color = sucesso ? "#2e7d32" : "#c62828";
  modal.style.fontSize = "16px";
  modal.innerHTML = `
    <p>${mensagem}</p>
    <button style="
      margin-top: 10px;
      padding: 6px 14px;
      background: ${sucesso ? '#2e7d32' : '#c62828'};
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    ">OK</button>
  `;
  document.body.appendChild(modal);

  modal.querySelector("button").addEventListener("click", () => modal.remove());
  setTimeout(() => modal.remove(), 4000);
}

// ==================== ENVIO DO FORMULÁRIO ====================
form.addEventListener('submit', async e => {
  e.preventDefault();

  const retornoBtn = document.querySelector(".retorno-btn.ativo");
  const data = {
    nome: form.nome.value.trim(),
    mensagem: form.mensagem.value.trim(),
    retornoTipo: retornoBtn ? retornoBtn.dataset.tipo : "",
    retornoValor: document.querySelector('#campo-retorno input') 
      ? document.querySelector('#campo-retorno input').value.trim() 
      : ""
  };

  if (!data.nome || !data.mensagem || !data.retornoTipo || !data.retornoValor) {
    alert("Por favor, preencha todos os campos e escolha uma forma de contato.");
    return;
  }

  if (data.retornoTipo === "email" && !validarEmail(data.retornoValor)) { 
    alert("Por favor, digite um e-mail válido."); 
    return; 
  }

  if ((data.retornoTipo === "telefone" || data.retornoTipo === "whatsapp") && !validarTelefone(data.retornoValor)) { 
    alert("Por favor, digite um telefone válido (com DDD)."); 
    return; 
  }

  try {
    // ✅ reCAPTCHA v3 com await — corrigido
    await grecaptcha.ready(async () => {
      const token = await grecaptcha.execute('6LcMrPsrAAAAAFhWYtlCAQ1QxDyYBtTUYej6QBzs', { action: 'submit' });
      data.token = token;

      const response = await fetch(`${backendUrl}/api/contato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        form.reset();
        campoRetorno.innerHTML = '';
        if (formulario) formulario.style.display = 'none';
        if (checkboxForm) checkboxForm.checked = false;
        botoes.forEach(b => b.classList.remove("ativo"));

        mostrarModalCentral("Mensagem enviada com sucesso!", true);
      } else {
        mostrarModalCentral("Erro ao enviar, tente novamente.", false);
      }
    });
  } catch (err) {
    console.error(err);
    mostrarModalCentral("Erro ao enviar, tente novamente.", false);
  }
});
