package com.strong.familynotification.Util;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class NotifExcResponse {
    private String Message;
    private Integer Status;
    private long TimeStamp;
}