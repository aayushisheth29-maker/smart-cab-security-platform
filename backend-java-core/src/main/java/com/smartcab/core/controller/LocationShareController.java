package com.smartcab.core.controller;

import com.smartcab.core.model.LocationShare;
import com.smartcab.core.repository.LocationShareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = "*")
public class LocationShareController {

    @Autowired
    private LocationShareRepository locationShareRepository;

    @PostMapping("/share")
    public ResponseEntity<Map<String, Object>> createShareableLink(@RequestBody LocationShare locationShare) {
        try {
            // Set expiry time (24 hours from now)
            LocalDateTime expiryTime = LocalDateTime.now().plusHours(24);
            locationShare.setExpiresAt(expiryTime);

            // Save to database
            LocationShare savedShare = locationShareRepository.save(locationShare);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("linkId", savedShare.getLinkId());
            response.put("message", "Shareable link created successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/track/{linkId}")
    public ResponseEntity<LocationShare> getTrackingData(@PathVariable String linkId) {
        Optional<LocationShare> locationShareOpt = locationShareRepository.findByLinkId(linkId);

        if (locationShareOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LocationShare locationShare = locationShareOpt.get();

        // Check if link has expired
        if (locationShare.getExpiresAt() != null && 
            locationShare.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).build();
        }

        return ResponseEntity.ok(locationShare);
    }
}