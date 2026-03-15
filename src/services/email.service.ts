import resend from '../config/resend';
import ApiError from '../utils/apiError';

class EmailService {
  private readonly from = `FITQ <${process.env.RESEND_FROM_EMAIL}>`;

  async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    const { error } = await resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Your FITQ verification code',
      html: this.otpTemplate(this.escape(name), otp),
    });
    if (error) throw new ApiError(500, 'Failed to send verification email');
  }

  async sendPasswordResetEmail(email: string, name: string, otp: string): Promise<void> {
    const { error } = await resend.emails.send({
      from: this.from,
      to: [email],
      subject: 'Reset your FITQ password',
      html: this.resetTemplate(this.escape(name), otp),
    });
    if (error) throw new ApiError(500, 'Failed to send reset email');
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private otpTemplate(name: string, otp: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 16px;background:#0f0f0f;font-family:-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:40px;">
    <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#6C3FF5;">FITQ</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:#fff;">Verify your email</h1>
    <p style="margin:0 0 24px;color:#aaa;font-size:15px;">Hey ${name}, welcome to FITQ! Use this code to verify your account:</p>
    <div style="background:#6C3FF5;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#fff;">${otp}</span>
    </div>
    <p style="margin:0;color:#555;font-size:13px;">This code expires in 5 minutes. Never share it with anyone.</p>
  </div>
</body>
</html>`;
  }

  private resetTemplate(name: string, otp: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 16px;background:#0f0f0f;font-family:-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:40px;">
    <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#6C3FF5;">FITQ</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:#fff;">Reset your password</h1>
    <p style="margin:0 0 24px;color:#aaa;font-size:15px;">Hey ${name}, use this code to reset your FITQ password:</p>
    <div style="background:#6C3FF5;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#fff;">${otp}</span>
    </div>
    <p style="margin:0;color:#555;font-size:13px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>`;
  }
}

export default new EmailService();
