package com.smartcab.core.service;

import com.smartcab.core.model.*;
import com.smartcab.core.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class TripService {

    @Autowired private TripRepository tripRepository;
    @Autowired private DriverRepository driverRepository;
    @Autowired private CabRepository cabRepository;
    @Autowired private EmergencyAlertRepository alertRepository;
    @Autowired private FareCalculatorService fareCalculator;

    private final Random random = new Random();

    /** Create a new trip, auto-assigning a random driver + their cab. */
    @Transactional
    public Trip createTrip(String riderName, String pickup, String dropoff, double distanceKm) {
        Trip t = new Trip();
        t.setRiderName(riderName == null || riderName.isBlank() ? "Aayushi S." : riderName);
        t.setPickupLocation(pickup);
        t.setDropoffLocation(dropoff);
        t.setDistanceKm(distanceKm);
        t.setFare(fareCalculator.calculateFare(distanceKm));
        t.setStatus(Trip.STATUS_PENDING);
        t.setStartTime(java.time.Instant.now());

        // Auto-assign a random driver + their first cab (or skip if DB empty)
        List<Driver> drivers = driverRepository.findAll();
        if (!drivers.isEmpty()) {
            Driver d = drivers.get(random.nextInt(drivers.size()));
            t.setDriver(d);
            List<Cab> cabs = cabRepository.findByDriverId(d.getId());
            if (!cabs.isEmpty()) t.setCab(cabs.get(0));
        }

        return tripRepository.save(t);
    }

    @Transactional
    public Trip triggerSOS(Long tripId) {
        Trip t = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found: " + tripId));
        t.setStatus(Trip.STATUS_DANGER);

        EmergencyAlert alert = new EmergencyAlert();
        alert.setTrip(t);
        alert.setStatus(EmergencyAlert.STATUS_ACTIVE);
        alert.setLat(t.getCurrentLat());
        alert.setLng(t.getCurrentLng());
        alert.setNote("SOS triggered by rider " + t.getRiderName());
        alertRepository.save(alert);

        return tripRepository.save(t);
    }

    public Optional<Trip> get(Long id) { return tripRepository.findById(id); }
    public List<Trip> recent() { return tripRepository.findTop50ByOrderByCreatedAtDesc(); }
}
