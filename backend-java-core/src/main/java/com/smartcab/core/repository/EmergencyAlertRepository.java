package com.smartcab.core.repository;

import com.smartcab.core.model.EmergencyAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {
    List<EmergencyAlert> findByTripIdOrderByTriggeredAtDesc(Long tripId);
    List<EmergencyAlert> findByStatus(String status);
}
