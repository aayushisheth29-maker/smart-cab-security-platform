# Database Schema

## Overview

The database schema defines the structure of the Smart Cab Safety System database. It includes the tables, primary keys, foreign keys, and relationships required to manage users, drivers, cabs, trips, emergency alerts, and administrators.

## Tables

### User

* User_ID (Primary Key)
* Full_Name
* Email
* Phone
* Password
* Address

### Driver

* Driver_ID (Primary Key)
* Driver_Name
* Phone
* License_Number
* Rating

### Cab

* Cab_ID (Primary Key)
* Vehicle_Number
* Vehicle_Type
* Driver_ID (Foreign Key)

### Trip

* Trip_ID (Primary Key)
* User_ID (Foreign Key)
* Cab_ID (Foreign Key)
* Pickup_Location
* Drop_Location
* Fare
* Trip_Status
* Start_Time
* End_Time

### Emergency_Alert

* Alert_ID (Primary Key)
* Trip_ID (Foreign Key)
* User_ID (Foreign Key)
* Alert_Time
* Alert_Status

### Admin

* Admin_ID (Primary Key)
* Admin_Name
* Email
* Password

## Relationships

* User_ID references Trip.
* Driver_ID references Cab.
* Cab_ID references Trip.
* Trip_ID references Emergency_Alert.
* User_ID references Emergency_Alert.

The database schema is designed to maintain data integrity, reduce redundancy, and support efficient management of cab bookings, trips, emergency alerts, and administrative operations.
