package com.example.spotifymediaplayer.controller;

import com.example.spotifymediaplayer.service.SpotifyService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/spotify")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class SpotifyController {
    
    @Autowired
    private SpotifyService spotifyService;
    
    @GetMapping("/auth-url")
    public ResponseEntity<Map<String, String>> getAuthUrl(HttpSession session) {
        String sessionId = session.getId();
        String authUrl = spotifyService.generateAuthUrl(sessionId);
        
        return ResponseEntity.ok(Map.of("authUrl", authUrl, "sessionId", sessionId));
    }
    
    @PostMapping("/exchange-token")
    public ResponseEntity<Map<String, Object>> exchangeToken(
            @RequestBody Map<String, String> request,
            HttpSession session) {
        
        String code = request.get("code");
        String sessionId = session.getId();
        
        String accessToken = spotifyService.exchangeCodeForToken(code, sessionId);
        
        if (accessToken != null) {
            return ResponseEntity.ok(Map.of("success", true, "accessToken", accessToken));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Token exchange failed"));
        }
    }
    
    @GetMapping("/current-playback")
    public ResponseEntity<JsonNode> getCurrentPlayback(HttpSession session) {
        JsonNode response = spotifyService.makeSpotifyApiCall(session.getId(), "/me/player", HttpMethod.GET, null);
        
        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            // Return 401 Unauthorized if no valid token
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
    
    @PostMapping("/play")
    public ResponseEntity<Map<String, Object>> play(HttpSession session) {
        spotifyService.makeSpotifyApiCall(session.getId(), "/me/player/play", HttpMethod.PUT, null);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> pause(HttpSession session) {
        spotifyService.makeSpotifyApiCall(session.getId(), "/me/player/pause", HttpMethod.PUT, null);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/next")
    public ResponseEntity<Map<String, Object>> nextTrack(HttpSession session) {
        spotifyService.makeSpotifyApiCall(session.getId(), "/me/player/next", HttpMethod.POST, null);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/previous")
    public ResponseEntity<Map<String, Object>> previousTrack(HttpSession session) {
        spotifyService.makeSpotifyApiCall(session.getId(), "/me/player/previous", HttpMethod.POST, null);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @GetMapping("/search")
    public ResponseEntity<JsonNode> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "track") String type,
            @RequestParam(defaultValue = "10") int limit,
            HttpSession session) {
        
        String endpoint = String.format("/search?q=%s&type=%s&limit=%d", 
                                       q.replace(" ", "%20"), type, limit);
        
        JsonNode response = spotifyService.makeSpotifyApiCall(session.getId(), endpoint, HttpMethod.GET, null);
        
        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            // Return 401 Unauthorized if no valid token
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
    
    @PostMapping("/add-to-queue")
    public ResponseEntity<Map<String, Object>> addToQueue(
            @RequestBody Map<String, String> request,
            HttpSession session) {
        
        String trackUri = request.get("uri");
        String endpoint = "/me/player/queue?uri=" + trackUri;
        
        spotifyService.makeSpotifyApiCall(session.getId(), endpoint, HttpMethod.POST, null);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        spotifyService.logout(session.getId());
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/debug/clear-all-tokens")
    public ResponseEntity<Map<String, Object>> clearAllTokens() {
        spotifyService.clearAllTokens();
        return ResponseEntity.ok(Map.of("success", true, "message", "All tokens cleared"));
    }
    
    @GetMapping("/callback")
    public ResponseEntity<String> callback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpSession session) {
        
        if (error != null) {
            return ResponseEntity.ok("<html><body><h1>Authorization Error</h1><p>Error: " + error + "</p><script>window.close();</script></body></html>");
        }
        
        try {
            // Exchange code for token
            String accessToken = spotifyService.exchangeCodeForToken(code, session.getId());
            
            if (accessToken != null) {
                return ResponseEntity.ok("<html><body><h1>Success!</h1><p>You have been successfully authenticated with Spotify.</p><script>window.close(); window.opener.location.reload();</script></body></html>");
            } else {
                return ResponseEntity.ok("<html><body><h1>Authentication Failed</h1><p>Failed to exchange code for token.</p><script>window.close();</script></body></html>");
            }
        } catch (Exception e) {
            return ResponseEntity.ok("<html><body><h1>Error</h1><p>An error occurred: " + e.getMessage() + "</p><script>window.close();</script></body></html>");
        }
    }
    
    @PostMapping("/debug/force-unauthorized")
    public ResponseEntity<Map<String, Object>> forceUnauthorized(HttpSession session) {
        spotifyService.logout(session.getId());
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true, "message", "Forced logout"));
    }
    
    @GetMapping("/devices")
    public ResponseEntity<JsonNode> getDevices(HttpSession session) {
        JsonNode response = spotifyService.makeSpotifyApiCall(session.getId(), "/me/player/devices", HttpMethod.GET, null);
        
        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            // Return 401 Unauthorized if no valid token
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}