package com.strong.familyfeed.Model;

import java.util.HashSet;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
@AllArgsConstructor
public class FullPost {

    private PostWithUser postWithUser;
    /** Set of user IDs who have liked this post */
    private Set<String> likes = new HashSet<>();

}
