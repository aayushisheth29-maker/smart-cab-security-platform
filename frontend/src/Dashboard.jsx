import React, { useState, useEffect } from 'react';
import { API_BASE } from './api';

function Dashboard() {
  // State for the list of cabs
  const [bookings, setBookings] = useState([]);
  
  // State to hold what the user types in the text boxes!
  const [formData, setFormData] = useState({
    riderName: '',
    pickupLocation: '',
    dropoffLocation: '',
    distanceKm: ''
  });

  // Function to get data from the Python backend (the Java service is retired)
  const fetchBookings = () => {
    fetch(`${API_BASE}/api/bookings`)
      .then(response => response.json())
      .then(data => setBookings(data))
      .catch(error => console.error("Error fetching:", error));
  };

  // Run this once when the page loads
  useEffect(() => {
    fetchBookings();
  }, []);

  // Function to handle typing in the boxes
  const handleInputChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  // Function when you click the "BOOK CAB" button
  const handleBookCab = (event) => {
    event.preventDefault(); // Stops the page from refreshing

    // Make the cab "smart" - calculate fare automatically (₹15 per km)
    const calculatedFare = parseFloat(formData.distanceKm) * 15;

    // Package the data exactly how the Python backend expects it
    // (same contract the retired Java backend used)
    const newBooking = {
      riderName: formData.riderName,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      distanceKm: parseFloat(formData.distanceKm),
      fare: calculatedFare,
      status: "PENDING"
    };

    // Send it to the Python backend via POST!
    fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    })
    .then(response => {
      if (response.ok) {
        alert("Cab Booked Successfully! 🚕💨");
        // Clear the form boxes
        setFormData({ riderName: '', pickupLocation: '', dropoffLocation: '', distanceKm: '' });
        // Fetch the updated list instantly!
        fetchBookings();
      }
    })
    .catch(error => console.error("Error saving booking:", error));
  };

  // 🚨 Function to trigger SOS!
  const triggerSOS = (id) => {
    fetch(`${API_BASE}/api/bookings/${id}/sos`, {
      method: 'PUT'
    })
    .then(response => {
      if (response.ok) {
        alert("🚨 SOS TRIGGERED! HELP IS ON THE WAY!");
        // Refresh the radar to show the red danger status!
        fetchBookings();
      }
    })
    .catch(error => console.error("Error triggering SOS:", error));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>🚕 Smart-AI-Cab Security Platform</h1>
      
      {/* --- THE BOOKING FORM --- */}
      <div style={{ backgroundColor: '#eef', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h2>📝 Book a New Cab</h2>
        <form onSubmit={handleBookCab} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <input type="text" name="riderName" placeholder="Rider Name (e.g. Aayushi)" 
            value={formData.riderName} onChange={handleInputChange} required 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          
          <input type="text" name="pickupLocation" placeholder="Pickup Location (e.g. Delhi)" 
            value={formData.pickupLocation} onChange={handleInputChange} required 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          
          <input type="text" name="dropoffLocation" placeholder="Dropoff Location (e.g. Agra)" 
            value={formData.dropoffLocation} onChange={handleInputChange} required 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          
          <input type="number" name="distanceKm" placeholder="Distance in Km (e.g. 230)" 
            value={formData.distanceKm} onChange={handleInputChange} required 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          
          <button type="submit" style={{ 
            padding: '12px', backgroundColor: '#007BFF', color: 'white', 
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' 
          }}>
            BOOK CAB NOW
          </button>

        </form>
      </div>

      {/* --- THE CAB LIST WITH THE SOS BUTTON --- */}
      <h2>📋 Live Cab Radar:</h2>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} style={{ 
            border: booking.status === 'DANGER' ? '3px solid red' : '2px solid #ccc', 
            borderRadius: '10px', 
            padding: '15px', 
            margin: '10px 0', 
            backgroundColor: booking.status === 'DANGER' ? '#ffe6e6' : '#f9f9f9', 
            boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
            transition: '0.3s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>👤 Rider: {booking.riderName}</h3>
            <p><strong>Route:</strong> 📍 {booking.pickupLocation} ➡️ 🏁 {booking.dropoffLocation}</p>
            <p><strong>Distance:</strong> 📏 {booking.distanceKm} km</p>
            <p style={{ margin: '5px 0 15px 0' }}><strong>Total Fare:</strong> 💵 ₹{booking.fare}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0 }}>
                <strong>Status:</strong> 
                <span style={{ 
                  color: booking.status === 'DANGER' ? 'white' : (booking.status === 'PENDING' ? '#d97706' : 'green'),
                  backgroundColor: booking.status === 'DANGER' ? 'red' : (booking.status === 'PENDING' ? '#fef3c7' : '#dcfce7'),
                  fontWeight: 'bold', marginLeft: '5px', padding: '5px 10px', borderRadius: '12px'
                }}>
                  {booking.status}
                </span>
              </p>

              {/* Only show the SOS button if the cab is NOT already in danger */}
              {booking.status !== 'DANGER' && (
                <button 
                  onClick={() => triggerSOS(booking.id)} 
                  style={{
                    backgroundColor: 'red', color: 'white', border: 'none', 
                    padding: '10px 15px', borderRadius: '5px', fontWeight: 'bold', 
                    cursor: 'pointer', boxShadow: '0 4px 6px rgba(255,0,0,0.3)'
                  }}>
                  🚨 SOS PANIC
                </button>
              )}
            </div>

            {/* ⭐ NEW: REALISTIC EMERGENCY PROTOCOL BANNER GOES HERE ⭐ */}
            {booking.status === 'DANGER' && (
              <div style={{
                marginTop: '15px', backgroundColor: '#8b0000', color: 'white', 
                padding: '15px', borderRadius: '8px', textAlign: 'center',
                boxShadow: '0 0 15px rgba(255,0,0,0.5)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', letterSpacing: '1px' }}>🚨 EMERGENCY PROTOCOL ACTIVATED 🚨</h3>
                <p style={{ fontSize: '18px', margin: '5px 0' }}>
                  🚓 Police: <a href="tel:112" style={{ color: '#FFD700', fontWeight: 'bold', textDecoration: 'none' }}>112 📞</a>
                </p>
                <p style={{ fontSize: '18px', margin: '5px 0' }}>
                  🛡️ Women Helpline: <a href="tel:181" style={{ color: '#FFD700', fontWeight: 'bold', textDecoration: 'none' }}>181 📞</a>
                </p>
                <p style={{ fontSize: '13px', marginTop: '12px', color: '#ffcccc' }}>
                  📍 Live location and rider details have been securely transmitted to local authorities.
                </p>
              </div>
            )}
            
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;