package com.rehman.finance.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends OTP emails over SMTP (Brevo). Throws on failure — the caller
 * (EmailOutboxScheduler) is responsible for catching and updating the
 * outbox row status. The OTP code is never logged.
 */
@Slf4j
@Service
public class EmailSenderService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public EmailSenderService(
            JavaMailSender mailSender,
            @Value("${app.mail.from-address}") String fromAddress,
            @Value("${app.mail.from-name}") String fromName) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void sendOtpEmail(String toEmail, String otpCode, String type) {
        String subject = switch (type) {
            case "REGISTER_VERIFICATION" -> "Verify your email — Personal Finance Tracker";
            case "PASSWORD_RESET" -> "Reset your password — Personal Finance Tracker";
            default -> "Your verification code — Personal Finance Tracker";
        };

        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(buildBody(type, otpCode), true);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build OTP email for " + toEmail, e);
        }
        mailSender.send(message);
        log.info("OTP email sent to user email={}, type={}", toEmail, type);
    }

    private String buildBody(String type, String otpCode) {
        String headline = "REGISTER_VERIFICATION".equals(type)
                ? "Verify your email address"
                : "Reset your password";
        String instruction = "REGISTER_VERIFICATION".equals(type)
                ? "Use the code below to confirm your email address and activate your account."
                : "Use the code below to choose a new password for your account.";

        return """
                <!DOCTYPE html>
                <html lang="en">
                <body style="margin:0;padding:0;background-color:#0a0e17;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0e17;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" style="max-width:440px;background-color:#121824;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px 32px;">
                          <tr>
                            <td align="center" style="color:#f0c04f;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">
                              Personal Finance Tracker
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top:20px;color:#eaf1fb;font-size:20px;font-weight:bold;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top:12px;color:#9aa8bf;font-size:14px;line-height:1.6;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top:24px;">
                              <span style="display:inline-block;padding:16px 36px;background:#0f1521;border:1px solid rgba(240,192,79,0.45);border-radius:10px;color:#f9dd8e;font-size:28px;font-weight:bold;letter-spacing:8px;">
                                %s
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top:24px;color:#66748c;font-size:12px;">
                              This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(headline, instruction, otpCode);
    }
}