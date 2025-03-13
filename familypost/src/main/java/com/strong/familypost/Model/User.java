package com.strong.familypost.Model;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class User implements UserDetails {

    private String id;
    private String username;
    private String name;
    private String password;
    private String email;
    private String phone;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean enabled;
    private boolean isPrivate;
    private Collection<? extends GrantedAuthority> authorities;

    public User(String email, String id, String username, String name, String phone,
            boolean isPrivate, boolean isEnabled, boolean isAccountNonLocked,
            boolean isAccountNonExpired, Collection<SimpleGrantedAuthority> authorities) {
        this.email = email;
        this.id = id;
        this.username = username;
        this.name = name;
        this.phone = phone;
        this.isPrivate = isPrivate;
        this.enabled = isEnabled;
        this.accountNonLocked = isAccountNonLocked;
        this.accountNonExpired = isAccountNonExpired;
        this.authorities = authorities;
    }

}
