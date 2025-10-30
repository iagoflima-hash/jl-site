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
    grecaptcha.ready(async function() {
      const token = await grecaptcha.execute('6LcMrPsrAAAAAFhWYtlCAQ1QxDyYBtTUYej6QBzs', {action: 'submit'});
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
