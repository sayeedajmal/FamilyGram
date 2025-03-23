package com.strong.familyauth.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.strong.familyauth.Model.OtpEntity;
import com.strong.familyauth.Repository.OtpRepository;
import com.strong.familyauth.Util.UserException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

        @Autowired
        private JavaMailSender mailSender;

        @Autowired
        private OtpRepository otpRepository;

        public void sendOtpEmail(String to) throws UserException {
                String otp = String.valueOf(100000 + new Random().nextInt(900000));
                Instant expiryTime = Instant.now().plusSeconds(180);

                OtpEntity otpEntity = new OtpEntity(to, otp, expiryTime);
                otpRepository.save(otpEntity); // Save the updated OTP

                String subject = "📩 Your FamilyGram OTP – Complete Your Signup!";
                String body = "<html><body>"
                                + "<p>Dear User,</p>"
                                + "<p>Welcome to FamilyGram – where moments turn into memories! 🎉</p>"
                                + "<p>To complete your signup, please use the following One-Time Password (OTP):</p>"
                                + "<p><strong>🔑 Your OTP: " + otp + "</strong></p>"
                                + "<p>This OTP is valid for <strong>3 minutes</strong>. Please do not share this code with anyone.</p>"
                                + "<p>If you did not request this, please ignore this email.</p>"
                                + "<p>We’re excited to have you on board! 🌟</p>"
                                + "<p>Best Regards,</p>"
                                + "<p>The FamilyGram Team</p>"
                                + "<p>📧 sayeedajmala06@icloud.com</p>"
                                + "</body></html>";

                MimeMessage message = mailSender.createMimeMessage();
                try {
                        MimeMessageHelper helper = new MimeMessageHelper(message, true);
                        helper.setTo(to);
                        helper.setSubject(subject);
                        helper.setText(body, true);

                        // Send the email
                        mailSender.send(message);
                } catch (MessagingException e) {
                        throw new UserException("Error sending OTP email", e);
                }
        }

        // send email for follow request
        public void sendFollowRequestEmail(String to, String from, String imageUrl) throws UserException {
                String subject = "📩 You have a new follow request!";
                String body = "<html><body>"
                                + "<p>Dear User,</p>"
                                + "<p>You have a new follow request from <b>" + from + "</b>!</p>"
                                + "<p><img src='" + imageUrl + "' alt='Profile Image' width='100' height='100' /></p>"
                                + "<p>To accept or reject this request, please visit your FamilyGram profile.</p>"
                                + "<p>If you did not request this, please ignore this email.</p>"
                                + "<p>We’re excited to have you on board! 🌟</p>"
                                + "<p>Best Regards,</p>"
                                + "<p>The FamilyGram Team</p>"
                                + "<p>📧 sayeedajmala06@icloud.com</p>"
                                + "</body></html>";

                MimeMessage message = mailSender.createMimeMessage();
                try {
                        MimeMessageHelper helper = new MimeMessageHelper(message, true);
                        helper.setTo(to);
                        helper.setSubject(subject);
                        helper.setText(body, true);

                        // Send the email
                        mailSender.send(message);
                } catch (MessagingException e) {
                        throw new UserException("Error sending follow request email", e);
                }
        }

        public boolean validateOtp(String email, String otp) {
                Optional<OtpEntity> otpEntityOptional = otpRepository.findByEmail(email);

                if (otpEntityOptional.isPresent()) {
                        OtpEntity otpEntity = otpEntityOptional.get();

                        // Check if OTP matches
                        if (otpEntity.getOtp().equals(otp)) {

                                // Check if OTP is expired
                                if (otpEntity.getExpiryTime().isAfter(Instant.now())) {
                                        otpRepository.delete(otpEntity); // OTP used, remove from DB
                                        return true; // OTP is valid
                                } else {
                                        otpRepository.delete(otpEntity); // OTP expired, remove from DB
                                        return false; // Expired OTP
                                }
                        }
                }
                return false; // OTP does not exist or incorrect
        }

}
