package com.decp.auth_service.service;

public final class PasswordPolicy {

    private PasswordPolicy() {
    }

    public static String validate(String password) {
        if (password == null || password.isBlank()) {
            return "Password is required.";
        }

        if (password.length() < 8) {
            return "Password must be at least 8 characters long.";
        }

        boolean hasUppercase = password.matches(".*[A-Z].*");
        boolean hasLowercase = password.matches(".*[a-z].*");
        boolean hasNumber = password.matches(".*\\d.*");
        boolean hasSymbol = password.matches(".*[^A-Za-z0-9].*");

        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
            return "Password must include uppercase, lowercase, numbers, and symbols.";
        }

        return null;
    }
}
