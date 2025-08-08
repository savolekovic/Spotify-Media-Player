package com.example.spotifymediaplayer.repository;

import com.example.spotifymediaplayer.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findBySessionId(String sessionId);
    void deleteBySessionId(String sessionId);
}