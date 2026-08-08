package com.smartcab.core.repository;

import com.smartcab.core.model.Cab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CabRepository extends JpaRepository<Cab, Long> {
    Optional<Cab> findByVehicleNumber(String vehicleNumber);
    List<Cab> findByDriverId(Long driverId);
}
