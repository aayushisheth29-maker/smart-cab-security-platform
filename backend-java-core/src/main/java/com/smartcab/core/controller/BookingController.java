package com.smartcab.core.controller;

import com.smartcab.core.model.Booking;
import com.smartcab.core.repository.BookingRepository;
import com.smartcab.core.service.FareCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FareCalculatorService fareCalculatorService;

    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        double fare = fareCalculatorService.calculateFare(booking.getDistanceKm());
        booking.setFare(fare);
        booking.setStatus("REQUESTED");
        // Saves record directly into the SQL Database
        return bookingRepository.save(booking);
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        // Fetches all records directly from the SQL Database
        return bookingRepository.findAll();
    }
}