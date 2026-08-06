package com.rehman.finance.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends OTP emails via Brevo's Transactional Email HTTP API
 * (POST https://api.brevo.com/v3/smtp/email) using Spring's RestClient —
 * Render's free tier blocks outbound SMTP ports. Throws on failure — the
 * caller (EmailOutboxScheduler) is responsible for catching and updating
 * the outbox row status. The OTP code and the Brevo API key are never logged.
 */
@Slf4j
@Service
public class EmailSenderService {

    private final RestClient brevoRestClient;
    private final String apiKey;
    private final String fromAddress;
    private final String fromName;

    public EmailSenderService(
            RestClient brevoRestClient,
            @Value("${app.mail.brevo-api-key}") String apiKey,
            @Value("${app.mail.from-address}") String fromAddress,
            @Value("${app.mail.from-name}") String fromName) {
        this.brevoRestClient = brevoRestClient;
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void sendOtpEmail(String toEmail, String otpCode, String type) {
        String subject = switch (type) {
            case "REGISTER_VERIFICATION" -> "Verify your email — Personal Finance Tracker";
            case "PASSWORD_RESET" -> "Reset your password — Personal Finance Tracker";
            default -> "Your verification code — Personal Finance Tracker";
        };

        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", fromName, "email", fromAddress),
                "to", List.of(Map.of("email", toEmail)),
                "subject", subject,
                "htmlContent", buildBody(type, otpCode)
        );

        // Non-2xx responses throw here (RestClientResponseException /
        // ResourceAccessException) — the scheduler catches and records them.
        brevoRestClient.post()
                .uri("/v3/smtp/email")
                .header("api-key", apiKey)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
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