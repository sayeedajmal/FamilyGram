package com.strong.familyauth.Model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "otp_store")
@Data
@AllArgsConstructor
public class OtpEntity {

    @Id
    private String email;
    private String otp;
    private Instant expiryTime;

}
