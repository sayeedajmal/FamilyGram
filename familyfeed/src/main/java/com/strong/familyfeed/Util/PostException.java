package com.strong.familyfeed.Util;

import org.springframework.http.HttpStatus;

public class PostException extends Exception {
    private HttpStatus status;

    public PostException() {
        super();
        this.status = HttpStatus.BAD_REQUEST;
    }

    public PostException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public PostException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public PostException(String message, Throwable throwable) {
        super(message, throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public PostException(Throwable throwable) {
        super(throwable);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public HttpStatus getStatus() {
        return status;
    }
}