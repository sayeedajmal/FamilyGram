package com.strong.familyauth.Util;

public class UserException extends Exception {

    public UserException() {
        super();
    }

    public UserException(String Message) {
        super(Message);
    }

    public UserException(String Message, Throwable throwable) {
        super(Message, throwable);
    }

    public UserException(Throwable throwable) {
        super(throwable);
    }

}