package com.smartcab.core.repository;

import com.smartcab.core.model.LocationShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LocationShareRepository extends JpaRepository<LocationShare, Long> {
    Optional<LocationShare> findByLinkId(String linkId);
}