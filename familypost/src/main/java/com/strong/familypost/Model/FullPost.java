package com.strong.familypost.Model;

import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class FullPost {
    private Post post;
    private Set<String> likes;
}
