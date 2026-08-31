# Test Cases

## Week 7 - Testing and Bug Fixing

## 1. Overview

Testing was performed to verify the major functional modules of the Smart Cab Security Platform and to ensure proper communication between the frontend and Python FastAPI backend.

The testing focused on:

- User Registration and Login
- Ride Booking
- Fare Calculation
- Driver Assignment
- Live GPS Tracking
- Live Location Sharing
- SOS Emergency
- Emergency Contacts
- Live Guard and Video Streaming
- Evidence Recording
- API Communication
- Error Handling

Testing was mainly performed using manual functional testing and end-to-end browser testing.

---

## 2. Testing Environment

### Frontend
- React
- Vite
- React Router
- React Leaflet
- Leaflet
- Tailwind CSS

### Backend
- Python
- FastAPI
- REST APIs

### Testing Environment
- Web Browser
- Desktop/Laptop
- Mobile device for GPS and camera testing
- Deployed frontend and backend services

---

## 3. Test Case Table

| Test ID | Module | Test Scenario | Expected Result |
|--------|--------|---------------|-----------------|
| TC-01 | Registration | Enter valid user details and register | User registration should complete successfully |
| TC-02 | Registration | Submit registration with missing fields | Validation should prevent incomplete submission |
| TC-03 | Login | Enter valid email and password | User should be authenticated successfully |
| TC-04 | Login | Enter invalid login details | Authentication should fail with an appropriate response |
| TC-05 | Ride Booking | Enter pickup and drop-off locations | Locations should be accepted and ride options displayed |
| TC-06 | Fare Calculation | Request fare estimate for a selected distance and cab type | Fare breakdown and total fare should be returned |
| TC-07 | Driver Assignment | Confirm a ride | A driver should be assigned and driver details displayed |
| TC-08 | Trip Creation | Confirm booking with valid ride information | Trip/booking should be created successfully |
| TC-09 | Live Location | Start live location sharing | A unique live tracking link should be generated |
| TC-10 | GPS Tracking | Send GPS coordinates to the backend | Current location should be updated |
| TC-11 | Tracking Page | Open a valid shared tracking link | Rider, driver, route and location information should be displayed |
| TC-12 | Tracking Refresh | Wait for tracking updates | Location information should refresh automatically |
| TC-13 | Invalid Tracking Link | Open an unknown or inactive tracking link | Waiting/inactive state should be displayed instead of fake data |
| TC-14 | SOS | Trigger emergency alert | Emergency information should be sent to the backend |
| TC-15 | Emergency Contacts | Add an emergency contact | Contact should be stored and available for emergency sharing |
| TC-16 | Emergency Contacts | Remove an emergency contact | Selected contact should be removed successfully |
| TC-17 | Live Guard | Enable camera access | Camera feed should be displayed when permission is granted |
| TC-18 | Live Video | Start live video streaming | Video chunks should be uploaded to the backend |
| TC-19 | Live Video Tracking | Open tracking link while video is active | Latest available video chunk should be displayed |
| TC-20 | Evidence | Record evidence video | Recorded video should be available for preview/download |
| TC-21 | Share Link | Copy generated tracking link | Link should be copied successfully |
| TC-22 | Social Sharing | Share tracking link through available options | Share options such as WhatsApp, SMS, Email and Telegram should be available |
| TC-23 | Backend Health | Open backend health endpoint | Backend should return a healthy status |
| TC-24 | API Error Handling | Send invalid API data | API should return an appropriate error response |
| TC-25 | Responsive UI | Open application on different screen sizes | Interface should remain usable and readable |

---

## 4. End-to-End Live Tracking Test

The complete live tracking workflow was tested as follows:

1. Start the Python FastAPI backend.
2. Open the Smart Cab frontend.
3. Register or log in as a user.
4. Select pickup and drop-off locations.
5. Confirm the ride.
6. Verify assigned driver and vehicle details.
7. Open the Live Guard feature.
8. Allow camera and location permissions.
9. Add an emergency contact.
10. Generate the live tracking link.
11. Copy or share the generated link.
12. Open the tracking link in another browser tab/device.
13. Verify rider and driver information.
14. Verify the current GPS position on the map.
15. Send updated location information.
16. Verify that the tracking page refreshes automatically.
17. Verify the live video feed when Live Guard is active.

---

## 5. API Testing

The Python FastAPI backend provides REST endpoints for the major application modules.

Important API areas tested include:

- Authentication
- Users
- Drivers
- Trips
- Bookings
- Pricing
- Location Sharing
- Location Tracking
- Emergency Alerts
- Evidence
- AI Route Checking
- Live Video Streaming

The backend also provides a health endpoint:

`GET /api/health`

This endpoint is used to verify that the backend service is running and responding.

---

## 6. Error Handling Tests

The following error conditions were considered during testing:

- Invalid login credentials
- Missing registration information
- Invalid booking information
- Invalid API request data
- Backend unavailable
- Invalid tracking link
- Camera permission denied
- GPS permission denied
- Missing live video chunks
- Unavailable tracking information

The frontend provides fallback states for unavailable tracking data and backend connection problems.

---

## 7. Testing Result

Testing was focused on functional verification of the major Smart Cab modules.

The most important end-to-end workflow tested was:

**User → Ride Booking → Driver Assignment → Live Guard → Location Sharing → Tracking Link → GPS Updates → Live Video**

The testing process helped identify and address issues related to API validation, tracking persistence, map updates, video playback, and backend integration.

---

## 8. Conclusion

Week 7 testing helped verify the functional behavior of the Smart Cab Security Platform and identify issues affecting the live tracking and security features.

Bug fixes and improvements were applied to improve:

- API reliability
- GPS tracking
- Live tracking persistence
- Map behavior
- Video streaming
- Error handling
- Frontend-backend communication

Further testing can be performed during deployment and final system evaluation.
