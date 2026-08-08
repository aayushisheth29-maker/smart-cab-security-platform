package com.smartcab.core.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String driverName;

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String licenseNumber;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating = BigDecimal.valueOf(4.5);

    @Column(length = 255)
    private String photoUrl;

    public Driver() {}

    public Driver(String driverName, String phone, String licenseNumber, BigDecimal rating, String photoUrl) {
        this.driverName = driverName;
        this.phone = phone;
        this.licenseNumber = licenseNumber;
        this.rating = rating;
        this.photoUrl = photoUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
