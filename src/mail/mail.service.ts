import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    // Nodemailer transporter Gmail bilan
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('smtp_user'),      // Gmail hisobingiz
        pass: this.configService.get<string>('smtp_password'),  // App Password
      },
    });
  }

  async sendSmsToMail(email: string, subject: string, text: string, html?: string) {
    try {
      await this.transporter.sendMail({
        from: `"Verification" <${this.configService.get<string>('smtp_user')}>`,
        to: email,
        subject,
        text,
        html,
      });

      return { message: `Successfully sent email to ${email}` };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        error.message || 'MailService internal server error',
      );
    }
  }

  async sendOtp(email: string) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 raqamli OTP

      await this.sendSmsToMail(
        email,
        'Verification code',
        `Your OTP is ${otp}`,
        `<div style="text-align: center; background-color: gray; color: white; font-size: 30px; margin-top: 20px">
          <h1>${otp}</h1>
        </div>`,
      );

      return { message: 'Verification code sent successfully', otp };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to send OTP',
      );
    }
  }
}
