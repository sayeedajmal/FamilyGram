package com.strong.familypost.Util;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class PostExcResponse {
    private String Message;
    private Integer Status;
    private long TimeStamp;
}