package com.decp.job_service.exception;

public class DuplicateJobApplicationException extends RuntimeException {

    public DuplicateJobApplicationException(String message) {
        super(message);
    }
}
