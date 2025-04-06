package com.strong.familynotification.Model;

import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "users")
public class User {
    @Id
    @Indexed(unique = true)
    private String id;
    @Indexed(unique = true)
    private String username;
    private String name;
    private String password;
    private String bio;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String phone;

    private String photoId;
    private String thumbnailId;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean credentialsNonExpired;
    private boolean enabled;
    private boolean isPrivate;
    private Set<String> followRequests;
    private Set<String> followers;
    private Set<String> following;
    private String website;
    private Set<String> authorities;

}
