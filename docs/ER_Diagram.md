# ER Diagram

## Overview

The Entity Relationship (ER) Diagram represents the database structure of the Smart Cab Safety System. It identifies the main entities, their attributes, and the relationships between them. The ER Diagram serves as the foundation for database design and ensures that all project modules are connected efficiently.

## Main Entities

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

### Emergency Alert

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

* A User can book multiple Trips.
* A Driver can be assigned to one or more Cabs.
* A Cab is assigned to Trips.
* A Trip can generate an Emergency Alert when the SOS feature is activated.
* The Admin manages Users, Drivers, and monitors Emergency Alerts.

**See:** ER Diagram
<img width="1536" height="1024" alt="ChatGPT Image Jul 11, 2026, 10_34_18 PM" src="https://github.com/user-attachments/assets/51d2120c-6877-457a-a6e2-82d95578bbe2" />
