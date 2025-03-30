package com.strong.familynotification.Util;

import org.springframework.http.HttpStatus;

public class NotifException extends Exception {
    private HttpStatus status;

    public NotifException() {
        super();
        this.status = HttpStatus.BAD_REQUEST;
    }

    public NotifException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public NotifException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public NotifException(String message, Throwable throwable) {
        super(message, throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public NotifException(Throwable throwable) {
        super(throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public HttpStatus getStatus() {
        return status;
    }
}