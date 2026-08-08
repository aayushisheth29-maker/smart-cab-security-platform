package com.smartcab.core.controller;

import com.smartcab.core.model.Trip;
import com.smartcab.core.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Trip (booking) endpoints. The path /api/bookings is kept as an alias of
 * /api/trips so the existing React frontend keeps working unchanged.
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class TripController {

    @Autowired
    private TripService tripService;

    @GetMapping({"/trips", "/bookings"})
    public List<Trip> list() {
        return tripService.recent();
    }

    @GetMapping({"/trips/{id}", "/bookings/{id}"})
    public ResponseEntity<Trip> get(@PathVariable Long id) {
        return tripService.get(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping({"/trips", "/bookings"})
    public Trip create(@RequestBody Map<String, Object> body) {
        String rider   = str(body, "riderName", "Aayushi S.");
        String pickup  = str(body, "pickupLocation", "");
        String dropoff = str(body, "dropoffLocation", "");
        double km      = dbl(body, "distanceKm", 10.0);
        return tripService.createTrip(rider, pickup, dropoff, km);
    }

    @PutMapping({"/trips/{id}/sos", "/bookings/{id}/sos"})
    public ResponseEntity<Trip> sos(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tripService.triggerSOS(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String str(Map<String, Object> b, String k, String def) {
        Object v = b == null ? null : b.get(k);
        return v == null ? def : v.toString();
    }

    private double dbl(Map<String, Object> b, String k, double def) {
        Object v = b == null ? null : b.get(k);
        if (v instanceof Number n) return n.doubleValue();
        if (v == null) return def;
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return def; }
    }
}
