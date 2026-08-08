package com.smartcab.core.controller;

import com.smartcab.core.model.LocationPing;
import com.smartcab.core.model.ShareLink;
import com.smartcab.core.model.Trip;
import com.smartcab.core.repository.LocationPingRepository;
import com.smartcab.core.repository.ShareLinkRepository;
import com.smartcab.core.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Live tracking + shareable-link endpoints.
 *  - POST /api/location/share  -> create a shareable link for a trip
 *  - GET  /api/location/track/{linkId} -> fetch the latest data behind a link
 *  - POST /api/location/{linkId}/ping -> push a fresh GPS ping (called by rider)
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/location")
public class LocationController {

    @Autowired private ShareLinkRepository shareLinkRepository;
    @Autowired private LocationPingRepository pingRepository;
    @Autowired private TripRepository tripRepository;

    @PostMapping("/share")
    public ResponseEntity<ShareLink> share(@RequestBody Map<String, Object> body) {
        ShareLink s = new ShareLink();

        // linkId — accept from body or generate
        String linkId = body.get("linkId") == null ? null : body.get("linkId").toString();
        if (linkId == null || linkId.isBlank()) {
            linkId = "RIDE_" + System.currentTimeMillis() + "_"
                    + Long.toString(System.nanoTime(), 36);
        }
        s.setLinkId(linkId);
        s.setRiderName(str(body, "riderName", "Rider"));
        s.setDriverName(str(body, "driverName", "Driver"));
        s.setDriverLicense(str(body, "driverLicense", null));
        s.setCarPlate(str(body, "carPlate", null));
        s.setPickup(str(body, "pickup", null));
        s.setDropoff(str(body, "dropoff", null));
        s.setCurrentLat(dblOrNull(body, "currentLocation.lat"));
        s.setCurrentLng(dblOrNull(body, "currentLocation.lng"));
        s.setStatus(str(body, "status", "ON_ROUTE"));
        s.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));

        // If the rider passed a bookingId, link to the trip
        if (body.get("bookingId") != null) {
            try {
                Long tripId = Long.parseLong(body.get("bookingId").toString());
                tripRepository.findById(tripId).ifPresent(s::setTrip);
            } catch (NumberFormatException ignored) {}
        }

        return ResponseEntity.ok(shareLinkRepository.save(s));
    }

    @GetMapping("/track/{linkId}")
    public ResponseEntity<?> track(@PathVariable String linkId) {
        Optional<ShareLink> opt = shareLinkRepository.findByLinkId(linkId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ShareLink s = opt.get();
        if (s.getExpiresAt() != null && s.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.status(410).body(Map.of("error", "Link expired"));
        }
        return ResponseEntity.ok(s);
    }

    @PostMapping("/track/{linkId}/ping")
    public ResponseEntity<?> ping(@PathVariable String linkId, @RequestBody Map<String, Object> body) {
        Optional<ShareLink> opt = shareLinkRepository.findByLinkId(linkId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ShareLink s = opt.get();

        Double lat = dblOrNull(body, "lat");
        Double lng = dblOrNull(body, "lng");
        if (lat == null) lat = dblOrNull(body, "currentLocation.lat");
        if (lng == null) lng = dblOrNull(body, "currentLocation.lng");
        if (lat == null || lng == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "lat/lng required"));
        }

        s.setCurrentLat(lat);
        s.setCurrentLng(lng);
        shareLinkRepository.save(s);

        LocationPing ping = new LocationPing(lat, lng, "rider");
        ping.setShareLink(s);
        if (s.getTrip() != null) ping.setTrip(s.getTrip());
        pingRepository.save(ping);

        return ResponseEntity.ok(Map.of("ok", true, "linkId", linkId, "lat", lat, "lng", lng));
    }

    @GetMapping("/track/{linkId}/pings")
    public ResponseEntity<List<LocationPing>> pings(@PathVariable String linkId) {
        Optional<ShareLink> opt = shareLinkRepository.findByLinkId(linkId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(pingRepository.findTop20ByShareLinkIdOrderByRecordedAtDesc(opt.get().getId()));
    }

    private String str(Map<String, Object> b, String k, String def) {
        Object v = b == null ? null : b.get(k);
        return v == null ? def : v.toString();
    }

    @SuppressWarnings("unchecked")
    private Double dblOrNull(Map<String, Object> b, String dotted) {
        if (b == null) return null;
        Object cur = b;
        for (String part : dotted.split("\\.")) {
            if (cur instanceof Map<?, ?> m) cur = m.get(part);
            else return null;
            if (cur == null) return null;
        }
        if (cur instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(cur.toString()); } catch (Exception e) { return null; }
    }
}
