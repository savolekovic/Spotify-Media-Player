package com.example.spotifymediaplayer.repository;

import com.example.spotifymediaplayer.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for CRUD operations on {@link UserToken} entities.
 * Provides helpers to find and delete token records by session id.
 */
@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    /** Find token record by associated HTTP session id */
    Optional<UserToken> findBySessionId(String sessionId);
    /** Delete token record for a given HTTP session id */
    void deleteBySessionId(String sessionId);
}