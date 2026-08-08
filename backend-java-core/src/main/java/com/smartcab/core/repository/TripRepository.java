package com.smartcab.core.repository;

import com.smartcab.core.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findTop50ByOrderByCreatedAtDesc();
    List<Trip> findByStatus(String status);
    List<Trip> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Trip> findByDriverIdOrderByCreatedAtDesc(Long driverId);
}
