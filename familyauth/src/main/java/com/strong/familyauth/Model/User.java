package com.strong.familyauth.Model;

import java.util.Collection;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Data;

@Data
@Document(collection = "users")
public class User implements UserDetails {
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
    private boolean enabled;
    private boolean privacy;
    private Set<String> followRequests;
    private boolean credentialsNonExpired;
    private Set<String> followers;
    private Set<String> following;
    private String website;
    private Collection<? extends GrantedAuthority> authorities;

}
