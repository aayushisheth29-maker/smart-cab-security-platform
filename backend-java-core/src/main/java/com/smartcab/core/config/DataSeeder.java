package com.smartcab.core.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcab.core.model.Cab;
import com.smartcab.core.model.Driver;
import com.smartcab.core.model.Trip;
import com.smartcab.core.model.User;
import com.smartcab.core.repository.CabRepository;
import com.smartcab.core.repository.DriverRepository;
import com.smartcab.core.repository.TripRepository;
import com.smartcab.core.repository.UserRepository;
import com.smartcab.core.service.FareCalculatorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

/**
 * Seeds the database from /database/*.json on first start. If the tables
 * are already populated, it does nothing. Safe to run on every boot.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired private UserRepository    userRepository;
    @Autowired private DriverRepository  driverRepository;
    @Autowired private CabRepository     cabRepository;
    @Autowired private TripRepository    tripRepository;
    @Autowired private FareCalculatorService fareCalculator;

    private final ObjectMapper json = new ObjectMapper();

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("DataSeeder: DB already populated (users={}). Skipping seed.",
                    userRepository.count());
            return;
        }

        Path dataDir = locateDataDir();
        if (dataDir == null) {
            log.warn("DataSeeder: could not find /database folder. Skipping seed.");
            return;
        }
        log.info("DataSeeder: seeding from {}", dataDir.toAbsolutePath());

        // ---- USERS ----
        Map<Long, User> userMap = new HashMap<>();
        try {
            JsonNode arr = json.readTree(Paths.get(dataDir.toString(), "Users.json").toFile());
            for (JsonNode n : arr) {
                User u = new User(
                        text(n, "Full_Name", "Unknown"),
                        text(n, "Email", null),
                        text(n, "Phone", null),
                        text(n, "Password", null),
                        text(n, "Address", null)
                );
                u = userRepository.save(u);
                if (n.has("User_ID")) userMap.put(n.get("User_ID").asLong(), u);
            }
            log.info("Seeded {} users", userMap.size());
        } catch (Exception e) {
            log.warn("Users.json not seeded: {}", e.getMessage());
        }

        // ---- DRIVERS ----
        Map<Long, Driver> driverMap = new HashMap<>();
        try {
            JsonNode arr = json.readTree(Paths.get(dataDir.toString(), "Drivers.json").toFile());
            for (JsonNode n : arr) {
                Driver d = new Driver(
                        text(n, "Driver_Name", "Driver"),
                        text(n, "Phone", null),
                        text(n, "License_Number", null),
                        n.has("Rating") ? BigDecimal.valueOf(n.get("Rating").asDouble()) : BigDecimal.valueOf(4.5),
                        null
                );
                d = driverRepository.save(d);
                if (n.has("Driver_ID")) driverMap.put(n.get("Driver_ID").asLong(), d);
            }
            log.info("Seeded {} drivers", driverMap.size());
        } catch (Exception e) {
            log.warn("Drivers.json not seeded: {}", e.getMessage());
        }

        // ---- CABS ----
        try {
            JsonNode arr = json.readTree(Paths.get(dataDir.toString(), "Cab.json").toFile());
            int n = 0;
            for (JsonNode c : arr) {
                Long driverId = c.has("Driver_ID") ? c.get("Driver_ID").asLong() : null;
                Driver d = driverId == null ? null : driverMap.get(driverId);
                if (d == null) continue;     // skip orphans
                Cab cab = new Cab(
                        text(c, "Vehicle_Number", "XX00XX0000"),
                        text(c, "Vehicle_Type", "Sedan"),
                        "White " + text(c, "Vehicle_Type", "Sedan"),
                        d
                );
                cabRepository.save(cab);
                n++;
            }
            log.info("Seeded {} cabs", n);
        } catch (Exception e) {
            log.warn("Cab.json not seeded: {}", e.getMessage());
        }

        // ---- TRIPS ----
        try {
            JsonNode arr = json.readTree(Paths.get(dataDir.toString(), "Trip.json").toFile());
            int n = 0;
            for (JsonNode t : arr) {
                Long userId = t.has("User_ID") ? t.get("User_ID").asLong() : null;
                Long cabId  = t.has("Cab_ID")  ? t.get("Cab_ID").asLong()  : null;
                User user   = userId == null ? null : userMap.get(userId);
                Trip trip = new Trip();
                trip.setUser(user);
                trip.setRiderName(user != null ? user.getFullName() : "Rider");
                trip.setPickupLocation(text(t, "Pickup_Location", ""));
                trip.setDropoffLocation(text(t, "Drop_Location", ""));
                trip.setFare(t.has("Fare") ? t.get("Fare").asDouble() : 0);
                trip.setDistanceKm(deriveDistance(trip.getPickupLocation(), trip.getDropoffLocation()));
                if (trip.getFare() == 0) {
                    trip.setFare(fareCalculator.calculateFare(trip.getDistanceKm()));
                }
                trip.setStatus(mapStatus(text(t, "Trip_Status", "COMPLETED")));
                if (cabId != null) {
                    cabRepository.findById(cabId).ifPresent(cab -> {
                        trip.setCab(cab);
                        trip.setDriver(cab.getDriver());
                    });
                }
                if (t.has("Start_Time") && !t.get("Start_Time").isNull()) {
                    trip.setStartTime(Instant.parse(t.get("Start_Time").asText() + "Z"));
                }
                if (t.has("End_Time") && !t.get("End_Time").isNull()) {
                    trip.setEndTime(Instant.parse(t.get("End_Time").asText() + "Z"));
                }
                tripRepository.save(trip);
                n++;
            }
            log.info("Seeded {} trips", n);
        } catch (Exception e) {
            log.warn("Trip.json not seeded: {}", e.getMessage());
        }
    }

    /** Find /database. Tries the working dir, the parent, then two levels up. */
    private Path locateDataDir() {
        String[] candidates = { "./database", "../database", "../../database" };
        for (String c : candidates) {
            Path p = Paths.get(c);
            if (Files.isDirectory(p)) return p;
        }
        // Also check classpath (when packaged as a jar)
        try {
            var url = getClass().getResource("/database");
            if (url != null) return Paths.get(url.toURI());
        } catch (Exception ignored) {}
        return null;
    }

    private String text(JsonNode n, String field, String def) {
        return n.has(field) && !n.get(field).isNull() ? n.get(field).asText() : def;
    }

    private double deriveDistance(String pickup, String dropoff) {
        if (pickup == null || dropoff == null) return 8.0;
        // crude default — the seeded fare is what matters
        return Math.max(3.0, Math.min(40.0, (pickup.length() + dropoff.length()) * 0.5));
    }

    private String mapStatus(String s) {
        if (s == null) return Trip.STATUS_COMPLETED;
        return switch (s.toLowerCase()) {
            case "ongoing"  -> Trip.STATUS_ACTIVE;
            case "pending"  -> Trip.STATUS_PENDING;
            case "cancelled", "canceled" -> Trip.STATUS_CANCELLED;
            case "danger"   -> Trip.STATUS_DANGER;
            default         -> Trip.STATUS_COMPLETED;
        };
    }
}
