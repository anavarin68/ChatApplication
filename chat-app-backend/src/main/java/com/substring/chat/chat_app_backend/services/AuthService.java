
package com.substring.chat.chat_app_backend.services;

import com.substring.chat.chat_app_backend.config.VerificationTokenUtil;
import com.substring.chat.chat_app_backend.entities.User;
import com.substring.chat.chat_app_backend.payload.LoginRequest;
import com.substring.chat.chat_app_backend.payload.RegisterRequest;
import com.substring.chat.chat_app_backend.repositories.UserRepository;
import com.substring.chat.chat_app_backend.services.EmailService;
import com.substring.chat.chat_app_backend.services.JwtService;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenUtil tokenUtil;
    private final EmailService emailService;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            VerificationTokenUtil tokenUtil,
            EmailService emailService,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenUtil = tokenUtil;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public String register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        String rawToken = tokenUtil.generateToken();

        User user = new User();

        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);

        // Store only the token hash in MongoDB.
        user.setVerificationToken(
                passwordEncoder.encode(rawToken));

        user.setVerificationTokenExpiry(
                Instant.now().plus(24, ChronoUnit.HOURS));

        userRepository.save(user);

        emailService.sendVerificationEmail(email, rawToken);

        return "Registration successful. Please check your email to verify your account.";
    }


    public String verifyEmail(String email, String token) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase()
        ).orElseThrow(() ->
                new IllegalArgumentException("Invalid verification link.")
        );

        if (user.isEmailVerified()) {
            return "Email is already verified.";
        }

        if (user.getVerificationToken() == null
                || !passwordEncoder.matches(
                token, user.getVerificationToken())) {
            throw new IllegalArgumentException(
                    "Invalid verification token."
            );
        }

        if (user.getVerificationTokenExpiry() == null
                || user.getVerificationTokenExpiry().isBefore(Instant.now())) {
            throw new IllegalArgumentException(
                    "Verification token has expired."
            );
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);

        userRepository.save(user);

        return "Email verified successfully. You can now log in.";
    }


    public String login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password."
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {
            throw new IllegalArgumentException(
                    "Invalid email or password."
            );
        }

        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException(
                    "Please verify your email before logging in."
            );
        }

        return jwtService.generateToken(user.getEmail());
    }


}
