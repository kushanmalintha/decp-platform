package com.decp.job_service.exception;

public class DuplicateSavedJobException extends RuntimeException {

    public DuplicateSavedJobException(String message) {
        super(message);
    }
}
