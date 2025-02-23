package com.strong.familyauth.Util;

import org.springframework.http.HttpStatus;

public class UserException extends Exception {
    private HttpStatus status;

    public UserException() {
        super();
        this.status = HttpStatus.BAD_REQUEST;
    }

    public UserException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public UserException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public UserException(String message, Throwable throwable) {
        super(message, throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public UserException(Throwable throwable) {
        super(throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public HttpStatus getStatus() {
        return status;
    }
}