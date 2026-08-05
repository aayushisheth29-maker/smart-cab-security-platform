package com.smartcab.core.controller;

import com.smartcab.core.model.Booking;
import com.smartcab.core.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*") // Allows React to talk to Java
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    // 1. Get all bookings (For your React Dashboard)
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // 2. Create a new booking (For your React Form)
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        return bookingRepository.save(booking);
    }

    // 3. 🚨 SOS EMERGENCY ENDPOINT (For your Red Button!)
    @PutMapping("/{id}/sos")
    public Booking triggerSOS(@PathVariable Long id) {
        // Find the specific cab ride by its ID
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found!"));
        
        // Change the status to DANGER!
        booking.setStatus("DANGER");
        
        // Save the updated cab ride back to the database
        return bookingRepository.save(booking);
    }
}