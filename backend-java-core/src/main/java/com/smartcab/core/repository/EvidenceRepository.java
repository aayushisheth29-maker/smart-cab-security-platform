package com.smartcab.core.repository;

import com.smartcab.core.model.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {
    Optional<Evidence> findByEvidenceId(String evidenceId);
    List<Evidence> findByTripIdOrderByCreatedAtDesc(Long tripId);
    List<Evidence> findTop20ByOrderByCreatedAtDesc();
}
