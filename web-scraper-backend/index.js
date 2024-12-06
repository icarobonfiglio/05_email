const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Função para fazer scraping de notícias de uma página
const scrapeData = async () => {
  try {
    // URL de exemplo, substitua com a página de sua preferência
    const url = 'https://www.bbc.com/portuguese';
    
    // Fazendo a requisição HTTP
    const { data } = await axios.get(url);

    // Usando cheerio para carregar e fazer o parsing do HTML
    const $ = cheerio.load(data);
    const news = [];

    // Selecionando os títulos das notícias (modifique de acordo com o HTML da página)
    $('.gs-c-promo-heading').each((index, element) => {
      const title = $(element).text();
      news.push(title);
    });

    return news;
  } catch (error) {
    console.error('Erro ao realizar o scraping:', error);
    return [];
  }
};

// Função para enviar email com os dados do scraping
const sendEmail = async (subject, content) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: subject,
      text: content,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
  }
};

// Rota principal para executar o scraping e enviar o email
app.get('/scrape', async (req, res) => {
  const news = await scrapeData();
  if (news.length > 0) {
    const content = `Aqui estão as últimas notícias:\n\n${news.join('\n')}`;
    await sendEmail('Últimas Notícias', content);
    res.send('Email enviado com sucesso!');
  } else {
    res.send('Não foi possível obter notícias.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
