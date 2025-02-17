package com.strong.familyauth.Model;

import java.util.Collection;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Data;

@Data
@Document(collection = "users")
public class User implements UserDetails{
    @Id
    @Indexed(unique = true)
    private String username;
    private String name;
    private String password;
    private String bio;
    @Indexed(unique = true)
    private String email;
    @Indexed(unique = true)
    private String phone;
    private String photoUrl;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean enabled;
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
            return null;
    }
}
