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

/**
 * Service encapsulating Spotify OAuth and Web API calls.
 *
 * Responsibilities:
 * - Build the authorization URL with required scopes
 * - Exchange authorization code for tokens and persist them per session
 * - Auto-refresh access tokens using the stored refresh token
 * - Make authenticated Web API calls and return parsed JSON
 */
@Service
public class SpotifyService {
    
    @Autowired
    private SpotifyConfig spotifyConfig;
    
    @Autowired
    private UserTokenRepository tokenRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Builds the Spotify authorization URL using the configured client and redirect.
     * The provided sessionId is used as the OAuth "state" to correlate the callback.
     *
     * @param sessionId current HTTP session id
     * @return fully-qualified Spotify authorization URL
     */
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
    
    /**
     * Exchanges an authorization code for access and refresh tokens and persists them.
     * Overwrites any existing tokens for the same session.
     *
     * @param code OAuth authorization code from Spotify callback
     * @param sessionId current session id
     * @return access token on success; null on failure
     */
    public String exchangeCodeForToken(String code, String sessionId) {
        try {
            // Prepare request headers with Client Credentials in Basic auth
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String auth = spotifyConfig.getClientId() + ":" + spotifyConfig.getClientSecret();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encodedAuth);
            
            // Prepare request body per Spotify token spec
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
                    // Persist tokens with expiry
                    LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn());
                    UserToken userToken = new UserToken(sessionId, tokenResponse.getAccessToken(), 
                                                       tokenResponse.getRefreshToken(), expiresAt);
                    
                    // Remove existing token for this session then save
                    tokenRepository.deleteBySessionId(sessionId);
                    tokenRepository.save(userToken);
                    
                    return tokenResponse.getAccessToken();
                }
            }
            
        } catch (Exception e) {
            // Swallowing exceptions keeps controller responses consistent (null indicates failure)
            e.printStackTrace();
        }
        
        return null;
    }
    
    /**
     * Returns a valid access token for the given session.
     * Refreshes the token if the stored one expires within the next 5 minutes.
     *
     * @param sessionId current session id
     * @return valid access token or null if unavailable
     */
    public String getValidAccessToken(String sessionId) {
        Optional<UserToken> tokenOpt = tokenRepository.findBySessionId(sessionId);
        
        if (tokenOpt.isPresent()) {
            UserToken userToken = tokenOpt.get();
            
            // Check if token is still valid with a small buffer to avoid race conditions
            if (userToken.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(5))) {
                return userToken.getAccessToken();
            } else {
                // Token is expired or near expiry, try to refresh
                return refreshAccessToken(userToken);
            }
        }
        
        return null;
    }
    
    /**
     * Refreshes the access token using the stored refresh token.
     * Updates the persisted token and returns the new access token.
     *
     * @param userToken persisted token record for current session
     * @return new access token or null on failure
     */
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
    
    /**
     * Makes an authenticated request to the Spotify Web API.
     * If there is no valid access token for the session, returns null.
     *
     * @param sessionId session id used to look up tokens
     * @param endpoint  Spotify API endpoint path, starting with '/'
     * @param method    HTTP method to use
     * @param body      request body (may be null)
     * @return parsed JSON body on success; null otherwise
     */
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
    
    /**
     * Deletes any stored tokens for the given session.
     *
     * @param sessionId current session id
     */
    public void logout(String sessionId) {
        try {
            tokenRepository.deleteBySessionId(sessionId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Debug helper that purges all stored tokens in the repository.
     * Not intended for production use.
     */
    public void clearAllTokens() {
        try {
            tokenRepository.deleteAll();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}