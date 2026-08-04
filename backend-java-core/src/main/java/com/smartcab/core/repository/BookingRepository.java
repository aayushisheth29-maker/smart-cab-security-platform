package com.smartcab.core.repository;

import com.smartcab.core.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Spring automatically handles database queries (save, find, delete)!
}