# Bug Fixing

## Week 7 - Bug Fixing and Improvements

## 1. Overview

During Week 7, testing of the Smart Cab Security Platform identified several issues related to backend communication, live GPS tracking, video streaming, API validation, and application reliability.

The identified issues were analyzed and fixes were implemented to improve the stability and reliability of the system.

---

## 2. Major Bugs and Fixes

### Bug 1: Live Tracking Links Lost After Backend Restart

#### Problem
Live tracking links were stored in memory. When the backend service restarted, previously created tracking links could be lost.

This was especially important because the deployed backend may restart or sleep.

#### Fix
Live tracking information was added with disk persistence and can also be persisted to the configured database.

The backend reloads previously stored share links when the application starts.

#### Result
Previously created tracking information can survive backend restarts when persistence storage is available.

---

### Bug 2: Booking ID Validation Error

#### Problem
The frontend could send a numeric booking ID while the backend expected a string value.

This could result in a `422 Unprocessable Content` validation error.

#### Fix
The backend `ShareLinkCreate` model was updated to accept both string and integer booking IDs.

Extra fields are also allowed so that the API can remain compatible with frontend changes.

#### Result
Booking information can be accepted more reliably when creating live tracking links.

---

### Bug 3: Tracking Map Did Not Follow the Moving Vehicle

#### Problem
Updating the coordinates of the vehicle did not automatically move the map view.

The React Leaflet map reads its initial center only during mounting.

#### Fix
A `RecenterOnMove` component was added to access the Leaflet map instance and update the map view whenever the vehicle coordinates change.

#### Result
The tracking map can follow the updated vehicle position during live tracking.

---

### Bug 4: Live Video Feed Could Become Black or Stop Playing

#### Problem
Live video was divided into short WebM chunks. Some chunks could stop playing, restart from the beginning, or display a black screen.

Browser autoplay and WebM duration handling also created playback issues.

#### Fix
The Live Tracking page was improved with:

- Explicit video playback handling
- Playback retry logic
- Manual clip restart
- Video stall detection
- Handling of video chunks without normal duration metadata
- Detection of failed video chunks
- Fallback to previously buffered chunks
- Prevention of unnecessary reloads of the same video chunk

#### Result
The live video feed is more reliable and can continue displaying available footage when an individual chunk cannot be played.

---

### Bug 5: Video Chunks Could Be Lost After Backend Restart

#### Problem
Live video chunks were originally maintained in application memory.

A backend restart could therefore remove the currently available video chunks.

#### Fix
Video chunks are persisted to disk and an index file is maintained for each tracking link.

The backend can reload stored chunks when the service starts again.

A rolling buffer is used so that only a limited number of recent chunks are retained.

#### Result
Recent live video footage can remain available after a backend restart when persistent storage is available.

---

### Bug 6: Tracking Page Could Display Incorrect/Fake Information

#### Problem
An invalid or inactive tracking link could result in unclear tracking information.

For a safety application, displaying incorrect rider or driver information is undesirable.

#### Fix
The tracking page was changed to detect a fallback response from the backend.

For an unavailable link, the interface displays a waiting state instead of displaying fake rider or driver information.

#### Result
Users receive a clear message when a tracking link is inactive or unavailable.

---

### Bug 7: Backend Services Were Split Between Java and Python

#### Problem
The application previously contained both a Java Spring Boot backend and a Python backend, which could create confusion about which service was responsible for the application's APIs.

#### Fix
The Python FastAPI backend was made the active backend for:

- Bookings
- Trips
- Authentication
- GPS tracking
- SOS
- Pricing
- Evidence
- Emergency logging
- Live video streaming

The Java Spring Boot backend was retained only for reference.

#### Result
The application now uses a single active Python FastAPI backend, reducing backend integration complexity.

---

### Bug 8: Backend Connection Failure on Tracking Page

#### Problem
The tracking page could fail when the backend was unavailable or waking up.

#### Fix
Error handling was added to the tracking page.

When the backend cannot be reached, the page displays a waiting/connection state instead of breaking the complete interface.

#### Result
The tracking page provides a user-friendly fallback when the backend is temporarily unavailable.

---

## 3. Reliability Improvements

The following improvements were made during bug fixing:

- Persistent live tracking links
- Persistent live video chunks
- API validation improvements
- Better error logging
- Backend health monitoring
- GPS map recentering
- Video playback recovery
- Invalid-link handling
- Single-backend architecture
- Frontend fallback states

---

## 4. Bug Fixing Workflow

The bug fixing process followed these steps:

1. Identify the problem during testing.
2. Reproduce the issue.
3. Check the frontend and backend implementation.
4. Identify the root cause.
5. Modify the affected component or API.
6. Test the updated behavior.
7. Verify that the fix does not break related functionality.
8. Document the resolved issue.

---

## 5. Conclusion

Week 7 focused on testing and improving the reliability of the Smart Cab Security Platform.

The major fixes were concentrated around live tracking, GPS updates, API communication, backend persistence, and live video streaming.

These improvements make the application more stable and prepare the project for the next phase of deployment and final documentation.
