package com.strong.familyauth.Model;

import lombok.Data;

@Data
public class Profile {
    private String id;
    private String username;
    private String name;
    private String bio;
    private String email;
    private String phone;
    private String photoId;
    private boolean isPrivate;
    private String website;
    private int followerCount;
    private int followingCount;
}
