package com.smartcab.core.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "emergency_alerts", indexes = {
    @Index(name = "idx_alerts_trip", columnList = "trip_id")
})
public class EmergencyAlert {

    public static final String STATUS_ACTIVE   = "ACTIVE";
    public static final String STATUS_RESOLVED = "RESOLVED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 30)
    private String status = STATUS_ACTIVE;

    @Column
    private Double lat;

    @Column
    private Double lng;

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private Instant triggeredAt = Instant.now();

    @Column
    private Instant resolvedAt;

    public EmergencyAlert() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Instant getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(Instant triggeredAt) { this.triggeredAt = triggeredAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
