package com.smartcab.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@RestController
public class CoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoreApplication.class, args);
	}

	@GetMapping("/")
	public Map<String, Object> home() {
		return Map.of(
				"service", "SmartCab Java Enterprise Backend",
				"version", "2.0.0",
				"status",  "running",
				"endpoints", Map.of(
						"trips",    "/api/trips  /api/bookings",
						"sos",      "PUT /api/trips/{id}/sos",
						"location", "POST /api/location/share  GET /api/location/track/{linkId}",
						"evidence", "POST /api/evidence/upload  GET /api/evidence",
						"drivers",  "/api/drivers  /api/drivers/random",
						"users",    "/api/users  /api/users/register"
				)
		);
	}
}
