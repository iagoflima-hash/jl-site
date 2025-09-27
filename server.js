const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// =====================
// CONFIGURAÇÃO CORS (produção)
// =====================
const allowedOrigins = [
  'https://jl-site.onrender.com', // substitua pelo seu domínio no Render
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // permite requisições sem origem (ex: Postman)
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'CORS não permitido!';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// =====================
// MIDDLEWARES
// =====================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// MONGODB (versão atualizada)
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB conectado!"))
.catch((err) => console.log("Erro ao conectar DB:", err));

// =====================
// MODEL
// =====================
const ContatoSchema = new mongoose.Schema({
  nome: String,
  mensagem: String,
  retornoTipo: String,
  retornoValor: String,
  data: { type: Date, default: Date.now }
});
const Contato = mongoose.model('Contato', ContatoSchema);

// =====================
// NODEMAILER CONFIG
// =====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// =====================
// ROTA PARA FORMULÁRIO
// =====================
app.post('/api/contato', async (req, res) => {
  try {
    const { nome, mensagem, retornoTipo, retornoValor } = req.body;

    // Salvar no MongoDB
    const novoContato = new Contato({ nome, mensagem, retornoTipo, retornoValor });
    await novoContato.save();

    // Enviar email para os destinatários
    const mailOptions = {
      from: `"Site JL Assessoria" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Novo contato de ${nome}`,
      html: `
        <h2>Você recebeu uma nova mensagem pelo site</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Mensagem:</strong> ${mensagem}</p>
        <p><strong>Forma de contato:</strong> ${retornoTipo}</p>
        <p><strong>Contato fornecido:</strong> ${retornoValor}</p>
        <p><em>Data: ${new Date().toLocaleString()}</em></p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error("Erro ao enviar email:", error);
      else console.log("Email enviado:", info.response);
    });

    res.status(200).json({ message: "Recebemos sua mensagem! Em breve entraremos em contato." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ocorreu um erro ao enviar sua mensagem." });
  }
});

// =====================
// SERVIR FRONT-END
// =====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================
// INICIAR SERVIDOR EM TODAS AS INTERFACES
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
