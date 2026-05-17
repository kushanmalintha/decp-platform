package com.decp.auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail-from:no-reply@decp.local}")
    private String fromEmail;

    public void sendPasswordResetEmail(String email, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("Reset your DECP password");
        message.setText("""
                We received a request to reset your DECP password.

                Use this link to choose a new password:
                %s

                If you did not request this, you can ignore this email.
                """.formatted(resetLink));

        mailSender.send(message);
    }
}
