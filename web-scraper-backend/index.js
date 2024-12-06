const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config();

class NewsScraper {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupRoutes();
  }

  async scrapeNews(url = 'https://www.bbc.com/portuguese') {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const news = [];

      $('.gs-c-promo-heading').each((_, element) => {
        const title = $(element).text().trim();
        if (title) news.push(title);
      });

      return news.slice(0, 10); // Limita para 10 notícias
    } catch (error) {
      console.error('Erro no scraping:', error.message);
      return [];
    }
  }

  async sendEmailNotification(news) {
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
        subject: 'Últimas Notícias',
        text: this.formatNewsContent(news),
      };

      await transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso!');
    } catch (error) {
      console.error('Falha no envio de email:', error.message);
    }
  }

  formatNewsContent(news) {
    return news.length > 0 
      ? `Aqui estão as últimas notícias:\n\n${news.map((item, index) => `${index + 1}. ${item}`).join('\n')}` 
      : 'Nenhuma notícia encontrada.';
  }

  setupRoutes() {
    this.app.get('/scrape', async (req, res) => {
      try {
        const news = await this.scrapeNews();
        
        if (news.length > 0) {
          await this.sendEmailNotification(news);
          res.status(200).send('Notícias capturadas e email enviado com sucesso!');
        } else {
          res.status(404).send('Não foi possível obter notícias.');
        }
      } catch (error) {
        res.status(500).send('Erro interno no processamento das notícias');
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor iniciado na porta ${this.port}`);
    });
  }
}

const scraper = new NewsScraper();
scraper.start();