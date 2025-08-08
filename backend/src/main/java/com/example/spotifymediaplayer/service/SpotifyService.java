package com.example.spotifymediaplayer.service;

import com.example.spotifymediaplayer.config.SpotifyConfig;
import com.example.spotifymediaplayer.dto.SpotifyTokenResponse;
import com.example.spotifymediaplayer.entity.UserToken;
import com.example.spotifymediaplayer.repository.UserTokenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class SpotifyService {
    
    @Autowired
    private SpotifyConfig spotifyConfig;
    
    @Autowired
    private UserTokenRepository tokenRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public String generateAuthUrl(String sessionId) {
        String scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing " +
                       "playlist-modify-public playlist-modify-private user-library-read user-library-modify";
        
        return spotifyConfig.getAuthUrl() + 
               "?client_id=" + spotifyConfig.getClientId() +
               "&response_type=code" +
               "&redirect_uri=" + spotifyConfig.getRedirectUri() +
               "&scope=" + scopes.replace(" ", "%20") +
               "&state=" + sessionId;
    }
    
    public String exchangeCodeForToken(String code, String sessionId) {
        try {
            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String auth = spotifyConfig.getClientId() + ":" + spotifyConfig.getClientSecret();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encodedAuth);
            
            // Prepare request body
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "authorization_code");
            body.add("code", code);
            body.add("redirect_uri", spotifyConfig.getRedirectUri());
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            // Make token exchange request
            ResponseEntity<SpotifyTokenResponse> response = restTemplate.postForEntity(
                spotifyConfig.getTokenUrl(), 
                request, 
                SpotifyTokenResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                SpotifyTokenResponse tokenResponse = response.getBody();
                
                // Add explicit null checks to prevent potential null pointer access
                if (tokenResponse != null && tokenResponse.getAccessToken() != null && tokenResponse.getExpiresIn() != null) {
                    // Save token to database
                    LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn());
                    UserToken userToken = new UserToken(sessionId, tokenResponse.getAccessToken(), 
                                                       tokenResponse.getRefreshToken(), expiresAt);
                    
                    // Remove existing token for this session
                    tokenRepository.deleteBySessionId(sessionId);
                    tokenRepository.save(userToken);
                    
                    return tokenResponse.getAccessToken();
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    public String getValidAccessToken(String sessionId) {
        Optional<UserToken> tokenOpt = tokenRepository.findBySessionId(sessionId);
        
        if (tokenOpt.isPresent()) {
            UserToken userToken = tokenOpt.get();
            
            // Check if token is still valid
            if (userToken.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(5))) {
                return userToken.getAccessToken();
            } else {
                // Token is expired, try to refresh
                return refreshAccessToken(userToken);
            }
        }
        
        return null;
    }
    
    private String refreshAccessToken(UserToken userToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String auth = spotifyConfig.getClientId() + ":" + spotifyConfig.getClientSecret();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encodedAuth);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("refresh_token", userToken.getRefreshToken());
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<SpotifyTokenResponse> response = restTemplate.postForEntity(
                spotifyConfig.getTokenUrl(), 
                request, 
                SpotifyTokenResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                SpotifyTokenResponse tokenResponse = response.getBody();
                
                // Add explicit null checks to prevent potential null pointer access
                if (tokenResponse != null && tokenResponse.getAccessToken() != null && tokenResponse.getExpiresIn() != null) {
                    // Update token in database
                    userToken.setAccessToken(tokenResponse.getAccessToken());
                    userToken.setExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                    if (tokenResponse.getRefreshToken() != null) {
                        userToken.setRefreshToken(tokenResponse.getRefreshToken());
                    }
                    tokenRepository.save(userToken);
                    
                    return tokenResponse.getAccessToken();
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    public JsonNode makeSpotifyApiCall(String sessionId, String endpoint, HttpMethod method, Object body) {
        String accessToken = getValidAccessToken(sessionId);
        if (accessToken == null) {
            return null;
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Object> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                spotifyConfig.getApiBaseUrl() + endpoint,
                method,
                request,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.readTree(response.getBody());
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null;
    }
    
    public void logout(String sessionId) {
        try {
            tokenRepository.deleteBySessionId(sessionId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public void clearAllTokens() {
        try {
            tokenRepository.deleteAll();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}