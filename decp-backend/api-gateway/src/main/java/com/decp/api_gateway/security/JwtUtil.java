package com.decp.api_gateway.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil {

    private final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    private final String SECRET = dotenv.get("JWT_SECRET");
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public void validateToken(String token) {
        Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}
