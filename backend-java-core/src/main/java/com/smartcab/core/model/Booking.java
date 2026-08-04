package com.smartcab.core.model;

public class Booking {
    private Long id;
    private String riderName;
    private String pickupLocation;
    private String dropoffLocation;
    private double distanceKm;
    private double fare;
    private String status;

    public Booking() {}

    public Booking(String riderName, String pickupLocation, String dropoffLocation) {
        this.riderName = riderName;
        this.pickupLocation = pickupLocation;
        this.dropoffLocation = dropoffLocation;
        this.status = "REQUESTED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRiderName() { return riderName; }
    public void setRiderName(String riderName) { this.riderName = riderName; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getDropoffLocation() { return dropoffLocation; }
    public void setDropoffLocation(String dropoffLocation) { this.dropoffLocation = dropoffLocation; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public double getFare() { return fare; }
    public void setFare(double fare) { this.fare = fare; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}