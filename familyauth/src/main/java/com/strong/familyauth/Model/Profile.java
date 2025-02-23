package com.strong.familyauth.Model;

import lombok.Data;

@Data
public class Profile {
    private String username;
    private String name;
    private String bio;
    private String email;
    private String phone;
    private String photoUrl;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean enabled;
    private boolean isPrivate;
    private int followerCount;
    private int followingCount;
}
