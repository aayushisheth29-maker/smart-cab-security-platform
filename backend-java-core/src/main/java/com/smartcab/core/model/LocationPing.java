package com.smartcab.core.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "location_pings", indexes = {
    @Index(name = "idx_pings_trip", columnList = "trip_id"),
    @Index(name = "idx_pings_share", columnList = "share_link_id")
})
public class LocationPing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "share_link_id")
    private ShareLink shareLink;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(length = 30)
    private String source = "rider";

    @Column(nullable = false)
    private Instant recordedAt = Instant.now();

    public LocationPing() {}

    public LocationPing(double lat, double lng, String source) {
        this.lat = lat;
        this.lng = lng;
        this.source = source;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public ShareLink getShareLink() { return shareLink; }
    public void setShareLink(ShareLink shareLink) { this.shareLink = shareLink; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
