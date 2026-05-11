package com.decp.job_service.exception;

public class InvalidApplicationStatusTransitionException extends RuntimeException {

    public InvalidApplicationStatusTransitionException(String message) {
        super(message);
    }
}
