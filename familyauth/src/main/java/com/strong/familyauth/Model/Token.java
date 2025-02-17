package com.strong.familyauth.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "tokens")
public class Token {

    @Id
    @Indexed(unique = true)
    private String _id;

    @Indexed(unique = true)
    private String accessToken;

    @Indexed(unique = true)
    private String refreshToken;

    private boolean loggedOut;

    @DBRef
    private User user;

}