# API Design

## Overview

The Smart Cab Security Platform uses REST APIs to enable communication between the frontend, backend, and database.

---

## User APIs

### Register User

POST /api/users/register

Registers a new passenger.

### Login User

POST /api/users/login

Authenticates the passenger.

### Get User Profile

GET /api/users/profile

Returns user information.

---

## Cab APIs

### Get Available Cabs

GET /api/cabs

Displays nearby available cabs.

### Book Cab

POST /api/cabs/book

Creates a new booking.

### Cancel Booking

DELETE /api/cabs/cancel

Cancels an existing booking.

---

## Trip APIs

### Start Trip

POST /api/trip/start

Begins the trip.

### End Trip

POST /api/trip/end

Completes the trip.

### Live Location

GET /api/trip/location

Returns current GPS location.

---

## Emergency APIs

### SOS Alert

POST /api/emergency/sos

Sends emergency alert.

### Route Deviation

POST /api/emergency/deviation

Detects route deviation.

### Notify Emergency Contacts

POST /api/emergency/notify

Sends ride details and live location.

---

## Admin APIs

GET /api/admin/users

GET /api/admin/drivers

GET /api/admin/alerts

DELETE /api/admin/block-user
