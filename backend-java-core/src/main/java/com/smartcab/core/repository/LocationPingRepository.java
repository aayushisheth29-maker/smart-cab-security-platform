package com.smartcab.core.repository;

import com.smartcab.core.model.LocationPing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationPingRepository extends JpaRepository<LocationPing, Long> {
    List<LocationPing> findTop20ByShareLinkIdOrderByRecordedAtDesc(Long shareLinkId);
    List<LocationPing> findTop20ByTripIdOrderByRecordedAtDesc(Long tripId);
}
