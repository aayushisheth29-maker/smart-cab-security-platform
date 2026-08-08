package com.smartcab.core.controller;

import com.smartcab.core.model.EmergencyAlert;
import com.smartcab.core.model.Trip;
import com.smartcab.core.repository.EmergencyAlertRepository;
import com.smartcab.core.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    @Autowired private EmergencyAlertRepository alertRepository;
    @Autowired private TripRepository tripRepository;

    @PostMapping
    public ResponseEntity<EmergencyAlert> trigger(@RequestBody Map<String, Object> body) {
        EmergencyAlert a = new EmergencyAlert();

        if (body.get("tripId") != null) {
            try {
                Long tripId = Long.parseLong(body.get("tripId").toString());
                tripRepository.findById(tripId).ifPresent(t -> {
                    a.setTrip(t);
                    t.setStatus(Trip.STATUS_DANGER);
                    tripRepository.save(t);
                });
            } catch (NumberFormatException ignored) {}
        }

        a.setLat(toDouble(body.get("lat")));
        a.setLng(toDouble(body.get("lng")));
        a.setNote(body.get("note") == null ? null : body.get("note").toString());
        return ResponseEntity.ok(alertRepository.save(a));
    }

    @GetMapping
    public List<EmergencyAlert> list() { return alertRepository.findAll(); }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<EmergencyAlert> resolve(@PathVariable Long id) {
        return alertRepository.findById(id)
                .map(a -> {
                    a.setStatus(EmergencyAlert.STATUS_RESOLVED);
                    a.setResolvedAt(Instant.now());
                    return ResponseEntity.ok(alertRepository.save(a));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Double toDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        if (o == null) return null;
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
    }
}
