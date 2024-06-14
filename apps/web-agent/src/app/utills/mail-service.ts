import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger: Logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'AKIA4CHAGTHXCMBLSXJC',
        pass: 'BHHkWH3HfKLlABcABmkqRHb0N7FDybkCWACZtsndxoJC',
      },
      tls: {
        rejectUnauthorized: false, // Add this if you encounter SSL certificate errors
      },
    });
  }

  async sendMail(subject: string, text: string) {
    const mailOptions = {
      from:'"Restogpt" <restogpt@orderbyte.io>', //this.configService.get<string>('SENDER_MAIL'),
      to: "ravitest2@yopmail.com",//this.configService.get<string>('RECIVER_MAIL'),
      subject,
      text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
}
