package com.strong.familyauth.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.strong.familyauth.Model.OtpEntity;
import com.strong.familyauth.Repository.OtpRepository;
import com.strong.familyauth.Util.UserException;

@Service
public class EmailService {

        @Autowired
        private JavaMailSender mailSender;

        @Autowired
        private OtpRepository otpRepository;

        public void sendOtpEmail(String to) throws UserException {
                String otp = String.valueOf(100000 + new Random().nextInt(900000)); // 6-digit OTP
                Instant expiryTime = Instant.now().plusSeconds(180); // 3 minutes expiry

                // Check if an OTP already exists for the email
                OtpEntity otpEntity =new OtpEntity(to,otp,expiryTime);

                otpRepository.save(otpEntity); // Save the updated OTP

                String subject = "📩 Your FamilyGram OTP – Complete Your Signup!";
                String body = "Dear User,\n\n"
                                + "Welcome to FamilyGram – where moments turn into memories! 🎉\n\n"
                                + "To complete your signup, please use the following One-Time Password (OTP):\n\n"
                                + "🔑 Your OTP: " + otp + "\n\n"
                                + "This OTP is valid for **3 minutes**. Please do not share this code with anyone.\n\n"
                                + "If you did not request this, please ignore this email.\n\n"
                                + "We’re excited to have you on board! 🌟\n\n"
                                + "Best Regards,\n"
                                + "The FamilyGram Team\n"
                                + "📧 support@familygram.com";

                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
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
