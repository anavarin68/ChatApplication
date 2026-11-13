package com.substring.chat.chat_app_backend.services;

import com.substring.chat.chat_app_backend.config.AppConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Sends verification emails through Brevo's HTTP API.
 * (Render's free tier blocks SMTP, so JavaMailSender cannot be used there.)
 */
@Service
public class EmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${mail.from}")
    private String fromEmail;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public void sendVerificationEmail(String email, String token) {

        String verificationLink =
                AppConstants.FRONT_END_BASE_URL
                        + "/verify-email?email="
                        + java.net.URLEncoder.encode(email, StandardCharsets.UTF_8)
                        + "&token="
                        + java.net.URLEncoder.encode(token, StandardCharsets.UTF_8);

        String text = "Welcome to Chatify!\n\n"
                + "Click the link below to verify your email address:\n\n"
                + verificationLink + "\n\n"
                + "This link expires in 24 hours.";

        String json = "{"
                + "\"sender\":{\"name\":\"Chatify\",\"email\":\"" + esc(fromEmail) + "\"},"
                + "\"to\":[{\"email\":\"" + esc(email) + "\"}],"
                + "\"subject\":\"Verify your Chatify account\","
                + "\"textContent\":\"" + esc(text) + "\""
                + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BREVO_URL))
                .timeout(Duration.ofSeconds(20))
                .header("api-key", apiKey)
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException(
                        "Brevo error " + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Email sending interrupted", e);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    private static String esc(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
