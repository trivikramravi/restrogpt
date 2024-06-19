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

  async sendMail(subject: string, failedItems: any[] = [], requiredItems: string[] = []) {
    let html = '';

    if (failedItems.length > 0 || requiredItems.length > 0) {
      html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Item Status</title>
</head>
<body>
    <h1>Item Status Notification</h1>
    ${failedItems.length > 0 ? `
      ${failedItems.map(item => item.name ? `
        ${item.toppings.length === 0 ? `<p>The item <strong>${item.name}</strong> is not found.</p>` : ''}
        ${item.toppings.length > 0 ? `
          <p>The following toppings for the item <strong>${item.name}</strong> are not found:</p>
          <ul>
            ${item.toppings.map(topping => `<li>${topping}</li>`).join('')}
          </ul>
        ` : ''}
      ` : '').join('')}` : ''}
    ${requiredItems.length > 0 ? `
      <p>The following items did not have mandatory toppings:</p>
      <ul>
        ${requiredItems.map(item => `<li>${item}</li>`).join('')}
      </ul>
    ` : ''}
</body>
</html>
`;
    }

    const mailOptions = {
      from: '"Restogpt" <restogpt@orderbyte.io>',
      to: "ravitest2@yopmail.com",
      subject,
      html,
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
