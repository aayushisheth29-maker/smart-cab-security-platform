# Class Diagram

## Smart Cab Security Platform

The class diagram represents the main classes used in the Smart Cab Security Platform and their relationships.

### Main Classes

1. User
   - userId
   - name
   - email
   - phoneNumber

2. Driver
   - driverId
   - vehicleNumber
   - licenseNumber

3. Cab
   - cabId
   - cabNumber
   - cabStatus

4. Trip
   - tripId
   - source
   - destination
   - tripStatus

5. EmergencyAlert
   - alertId
   - alertTime
   - alertStatus

### Relationships

- User books Trip
- Driver drives Cab
- Cab is assigned to Trip
- Trip generates EmergencyAlert
- EmergencyAlert is monitored by Admin

### Diagram
<img width="1536" height="1024" alt="ChatGPT Image Jul 7, 2026, 11_17_52 PM" src="https://github.com/user-attachments/assets/3dd2905c-70b7-4a7a-800f-9d30ee7ebcdd" />
