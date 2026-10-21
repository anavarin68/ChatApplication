
package com.substring.chat.chat_app_backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class MessageEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int NONCE_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public MessageEncryptionService(
            @Value("${message.encryption.key}") String base64Key) {

        byte[] keyBytes = Base64.getDecoder().decode(base64Key);

        if (keyBytes.length != 32) {
            throw new IllegalArgumentException(
                    "Message encryption key must be 32 bytes (256 bits).");
        }

        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }

        try {
            byte[] nonce = new byte[NONCE_LENGTH];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    secretKey,
                    new GCMParameterSpec(TAG_LENGTH_BITS, nonce));

            byte[] ciphertext = cipher.doFinal(
                    plaintext.getBytes(StandardCharsets.UTF_8));

            // Store nonce and ciphertext together as Base64.
            byte[] combined = new byte[nonce.length + ciphertext.length];

            System.arraycopy(nonce, 0, combined, 0, nonce.length);
            System.arraycopy(
                    ciphertext, 0, combined, nonce.length, ciphertext.length);

            return "enc:v1:" +
                    Base64.getEncoder().encodeToString(combined);

        } catch (Exception e) {
            throw new IllegalStateException("Message encryption failed.", e);
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null) {
            return null;
        }

        if (!encryptedText.startsWith("enc:v1:")) {
            // Temporary compatibility with messages stored before encryption.
            return encryptedText;
        }

        try {
            byte[] combined = Base64.getDecoder().decode(
                    encryptedText.substring("enc:v1:".length()));

            if (combined.length <= NONCE_LENGTH) {
                throw new IllegalArgumentException("Invalid encrypted message.");
            }

            byte[] nonce = new byte[NONCE_LENGTH];
            byte[] ciphertext = new byte[combined.length - NONCE_LENGTH];

            System.arraycopy(combined, 0, nonce, 0, NONCE_LENGTH);
            System.arraycopy(
                    combined, NONCE_LENGTH,
                    ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    secretKey,
                    new GCMParameterSpec(TAG_LENGTH_BITS, nonce));

            byte[] plaintext = cipher.doFinal(ciphertext);

            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Message decryption failed. Check the key and stored data.", e);
        }
    }
}
