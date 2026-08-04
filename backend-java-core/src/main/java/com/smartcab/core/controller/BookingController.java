package com.smartcab.core.controller;

import com.smartcab.core.model.Booking;
import com.smartcab.core.service.FareCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@CrossOrigin(origins = "*") // Allows your React frontend to connect cleanly
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private FareCalculatorService fareCalculatorService;

    private final List<Booking> bookings = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong();

    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        booking.setId(idCounter.incrementAndGet());
        double fare = fareCalculatorService.calculateFare(booking.getDistanceKm());
        booking.setFare(fare);
        bookings.add(booking);
        return booking;
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookings;
    }
}