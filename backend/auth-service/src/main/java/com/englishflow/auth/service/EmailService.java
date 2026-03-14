package com.englishflow.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MetricsService metricsService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8081}")
    private String backendUrl;

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendActivationEmail(String to, String firstName, String activationToken) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        // Pointer vers le backend pour afficher la page activation-success
        context.setVariable("activationLink", backendUrl + "/auth/activate?token=" + activationToken);
        
        String htmlContent = templateEngine.process("activation-email", context);
        
        try {
            sendHtmlEmail(to, "Activate Your Jungle in English Account", htmlContent);
            log.info("Activation email sent to: {}", to);
            metricsService.recordEmailSent();
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException e) {
            log.error("Failed to send activation email to: {}", to, e);
            metricsService.recordEmailFailed();
            return CompletableFuture.failedFuture(
                new com.englishflow.auth.exception.EmailSendException("Failed to send activation email to: " + to, e)
            );
        }
    }

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendPasswordResetEmail(String to, String firstName, String resetToken) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        context.setVariable("resetLink", frontendUrl + "/reset-password?token=" + resetToken);
        
        String htmlContent = templateEngine.process("password-reset-email", context);
        
        try {
            sendHtmlEmail(to, "Reset Your Password - Jungle in English", htmlContent);
            log.info("Password reset email sent to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", to, e);
            return CompletableFuture.failedFuture(
                new com.englishflow.auth.exception.EmailSendException("Failed to send password reset email to: " + to, e)
            );
        }
    }

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendWelcomeEmail(String to, String firstName) {
        try {
            Context context = new Context();
            context.setVariable("firstName", firstName);
            
            String htmlContent = templateEngine.process("welcome-email", context);
            
            sendHtmlEmail(to, "Welcome to Jungle in English! 🎉", htmlContent);
            log.info("Welcome email sent to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", to, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendAccountCreatedEmail(String to, String firstName, String email, String password, String role, String activationToken) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        context.setVariable("email", email);
        context.setVariable("password", password);
        context.setVariable("role", role);
        context.setVariable("activationLink", backendUrl + "/auth/activate?token=" + activationToken);
        
        String htmlContent = templateEngine.process("account-created-email", context);
        
        try {
            sendHtmlEmail(to, "Your Jungle in English Account - Login Credentials", htmlContent);
            log.info("Account created email sent to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException e) {
            log.error("Failed to send account created email to: {}", to, e);
            return CompletableFuture.failedFuture(
                new com.englishflow.auth.exception.EmailSendException("Failed to send account created email to: " + to, e)
            );
        }
    }

    @Async("emailTaskExecutor")
    public CompletableFuture<Void> sendInvitationEmail(String to, String role, String invitationToken) {
        log.info("Preparing to send invitation email to: {}", to);
        Context context = new Context();
        context.setVariable("role", role);
        context.setVariable("invitationLink", frontendUrl + "/accept-invitation?token=" + invitationToken);
        
        log.info("Processing email template...");
        String htmlContent = templateEngine.process("invitation-email", context);
        
        try {
            log.info("Sending invitation email...");
            sendHtmlEmail(to, "You're Invited to Join Jungle in English! 🎉", htmlContent);
            log.info("✅ Invitation email sent successfully to: {}", to);
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException e) {
            log.error("❌ Failed to send invitation email to: {}", to, e);
            log.error("Error details: {}", e.getMessage());
            return CompletableFuture.failedFuture(
                new com.englishflow.auth.exception.EmailSendException("Failed to send invitation email to: " + to, e)
            );
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
    }
}
