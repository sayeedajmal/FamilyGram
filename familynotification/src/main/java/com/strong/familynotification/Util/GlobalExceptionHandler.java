package com.strong.familynotification.Util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotifException.class)
    public ResponseEntity<?> handleException(NotifException exception) {
        NotifExcResponse response = new NotifExcResponse();
        response.setMessage(exception.getMessage());
        response.setStatus(HttpStatus.CONFLICT.value());
        response.setTimeStamp(System.currentTimeMillis());
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);

    }
}