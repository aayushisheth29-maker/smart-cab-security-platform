# Integration Testing

## Week 8 - Integration and Deployment Testing

## 1. Overview

Integration testing was performed to verify communication between the frontend, backend, and major modules of the Smart Cab Security Platform.

The purpose of integration testing is to ensure that different components of the system work correctly together instead of functioning only as separate modules.

The deployed frontend is hosted on Vercel and the backend is hosted on Render.

---

## 2. Testing Environment

### Frontend

- Technology: React
- Deployment Platform: Vercel
- Frontend URL: https://smart-cab-security-platform.vercel.app/

### Backend

- Technology: Python FastAPI
- Deployment Platform: Render
- Backend URL: https://smart-cab-security-platform-1.onrender.com

---

## 3. Integration Testing Approach

The following approach was used:

1. Start the deployed frontend application.
2. Verify communication with the backend.
3. Test important API requests.
4. Verify that backend responses are correctly handled by the frontend.
5. Check error handling for invalid or unavailable requests.
6. Verify major application workflows.

---

## 4. Integration Test Cases

| Test ID | Module | Test Scenario | Expected Result |
|--------|--------|---------------|-----------------|
| IT-01 | Backend | Check backend health API | Backend returns a successful response |
| IT-02 | Authentication | Submit registration request | Registration request is processed correctly |
| IT-03 | Authentication | Submit login request | Login response is received and processed |
| IT-04 | Driver | Request driver information | Driver information is returned |
| IT-05 | Pricing | Request fare estimate | Fare estimate is returned |
| IT-06 | Booking | Create a cab booking | Booking information is returned |
| IT-07 | Trip | Create/manage trip information | Trip information is processed correctly |
| IT-08 | GPS Tracking | Send location information | Location information is processed |
| IT-09 | Live Tracking | Generate tracking link | Tracking link is created |
| IT-10 | Live Tracking | Open tracking page | Latest available location is displayed |
| IT-11 | Emergency | Trigger SOS request | Emergency request is processed |
| IT-12 | Evidence | Upload emergency evidence | Evidence request is processed |
| IT-13 | AI Route Check | Send route information | Route analysis response is returned |
| IT-14 | Video | Request video-related data | Video API response is received |
| IT-15 | Error Handling | Send invalid request | Appropriate error response is returned |

---

## 5. Frontend and Backend Communication

The integration between the frontend and backend follows this flow:

```text
User Action
     ↓
Frontend Interface
     ↓
API Request
     ↓
Python FastAPI Backend
     ↓
Backend Processing
     ↓
API Response
     ↓
Frontend Processing
     ↓
Updated User Interface
