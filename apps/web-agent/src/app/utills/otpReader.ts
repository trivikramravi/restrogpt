import { Injectable, Logger } from '@nestjs/common';
const imaps = require('imap-simple');
//const { simpleParser } = require('mailparser');
const { encode, decode } = require('html-entities');
const cheerio = require('cheerio');
const qp = require('quoted-printable');
@Injectable()
export class OtpService {

  async getOTPFromEmail() {
    try {
        const config = {
            imap: {
              user: process.env.EMAIL_ADDRESS,
              password: process.env.EMAIL_PASSWORD,
              host: 'imap.gmail.com',
              port: 993,
              tls: true,
              tlsOptions: { rejectUnauthorized: false },
              authTimeout: 3000
            }
          };

      const connection = await imaps.connect({ imap: config.imap });
      await connection.openBox('INBOX');
  
      const searchCriteria = [['FROM', 'admin@uber.com'], ['SUBJECT', 'Welcome to Uber']];
      const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
  
      const messages = await connection.search(searchCriteria, fetchOptions);
  
      if (messages.length === 0) {
        console.log('No new OTP emails found.');
        await connection.end();
        return null;
      }
  
      const message = messages[0];
      let OTP = null;
  
      for (const part of message.parts) {
        if (part.which === 'TEXT') {
          const decodedHtmlEntities = decode(part.body);
          const decodedHtml = qp.decode(decodedHtmlEntities);
  
          // Load HTML into Cheerio
          const $ = cheerio.load(decodedHtml);
  
          // Select the <td> element containing the verification code
          OTP = $('td').filter(function () {
            return $(this).text().trim().match(/^\d{4}$/);
          }).text().trim();
  
          if (OTP) break;
        }
      }
  
      console.log(`OTP fetched: ${OTP}`);
      await connection.end();
      return OTP;
    } catch (error) {
      console.error('Error fetching OTP from email:', error);
      return null;
    }
  }
}