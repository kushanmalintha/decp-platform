package com.decp.job_service.exception;

public class InvalidJobOperationException extends RuntimeException {
    public InvalidJobOperationException(String message) {
        super(message);
    }
}
