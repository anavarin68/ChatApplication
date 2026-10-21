
package com.substring.chat.chat_app_backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.substring.chat.chat_app_backend.config.AppConstants;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String email, String token) {

        String verificationLink =
                AppConstants.FRONT_END_BASE_URL
                        + "/verify-email?email="
                        + java.net.URLEncoder.encode(
                        email, java.nio.charset.StandardCharsets.UTF_8)
                        + "&token="
                        + java.net.URLEncoder.encode(
                        token, java.nio.charset.StandardCharsets.UTF_8);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("Verify your Chatify account");
        message.setText(
                "Welcome to Chatify!\n\n" +
                        "Click the link below to verify your email address:\n\n" +
                        verificationLink + "\n\n" +
                        "This link expires in 24 hours."
        );

        mailSender.send(message);
    }
}
