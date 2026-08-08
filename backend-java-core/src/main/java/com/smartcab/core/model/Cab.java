package com.smartcab.core.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cabs")
public class Cab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String vehicleNumber;

    @Column(length = 50)
    private String vehicleType;   // Sedan, SUV, Mini, Hatchback, Bike

    @Column(length = 50)
    private String carModel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    public Cab() {}

    public Cab(String vehicleNumber, String vehicleType, String carModel, Driver driver) {
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.carModel = carModel;
        this.driver = driver;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getCarModel() { return carModel; }
    public void setCarModel(String carModel) { this.carModel = carModel; }
    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }
}
