package com.strong.familypost.Util;

public class ResponseWrapper<T> {
    private int status;
    private String message;
    private T data;

    public ResponseWrapper(int status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }
}
