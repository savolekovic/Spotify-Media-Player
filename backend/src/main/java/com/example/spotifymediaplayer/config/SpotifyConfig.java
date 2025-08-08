package com.example.spotifymediaplayer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * Centralized configuration for Spotify OAuth and Web API endpoints.
 *
 * Values are sourced from application properties or environment variables.
 * Note: clientSecret must be provided. clientId and redirectUri have sensible defaults
 * for local development.
 */
@Configuration
@Component
public class SpotifyConfig {
    
    @Value("${spotify.client.id:2c4bd3a5174e4a2b8791221489ac5360}")
    private String clientId;
    
    @Value("${spotify.client.secret}")
    private String clientSecret;
    
    @Value("${spotify.redirect.uri:https://localhost:3000}")
    private String redirectUri;
    
    private final String authUrl = "https://accounts.spotify.com/authorize";
    private final String tokenUrl = "https://accounts.spotify.com/api/token";
    private final String apiBaseUrl = "https://api.spotify.com/v1";
    
    // Getters
    public String getClientId() { return clientId; }
    public String getClientSecret() { return clientSecret; }
    public String getRedirectUri() { return redirectUri; }
    public String getAuthUrl() { return authUrl; }
    public String getTokenUrl() { return tokenUrl; }
    public String getApiBaseUrl() { return apiBaseUrl; }
}