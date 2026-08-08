package com.smartcab.core.service;

import org.springframework.stereotype.Service;

@Service
public class FareCalculatorService {

    private static final double BASE_FARE = 50.0;
    private static final double RATE_PER_KM = 12.0;

    public double calculateFare(double distanceKm) {
        if (distanceKm <= 0) return BASE_FARE;
        return BASE_FARE + (distanceKm * RATE_PER_KM);
    }
}
