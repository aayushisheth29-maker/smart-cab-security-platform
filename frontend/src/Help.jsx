import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Phone, MessageCircle, Mail, ShieldCheck } from 'lucide-react';

const Help = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      
      {/* Simple Header */}
      <div className="bg-black text-white p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center hover:text-gray-300 transition">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-green-400" />
            <span className="font-bold">SmartCab</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto mt-12 px-4">
        <h1 className="text-4xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600 mb-10 text-lg">We are here to help keep you safe and moving.</p>

        {/* Contact Cards (NOW CLICKABLE!) */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          
          {/* Card 1: CALL (Opens Phone Dialer) */}
          <a 
            href="tel:+18001234567" 
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:scale-105 transition transform cursor-pointer w-full"
          >
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Call Us</h3>
            <p className="text-gray-600 text-sm">24/7 Support for urgent safety issues and emergencies.</p>
            <p className="text-blue-600 font-bold mt-4 text-sm">Tap to Call 📞</p>
          </a>
          
          {/* Card 2: LIVE CHAT (Shows Pop-up Alert) */}
          <button 
            onClick={() => alert("Connecting you to our Live Chat security team... Please wait a moment.")}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:scale-105 transition transform cursor-pointer w-full"
          >
            <div className="bg-green-50 p-4 rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Live Chat</h3>
            <p className="text-gray-600 text-sm">Chat with our support team in real-time regarding your ride.</p>
            <p className="text-green-600 font-bold mt-4 text-sm">Tap to Chat 💬</p>
          </button>
          
          {/* Card 3: EMAIL (Opens Email App) */}
          <a 
            href="mailto:support@smartcab.com?subject=SmartCab%20Support%20Request"
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg hover:scale-105 transition transform cursor-pointer w-full"
          >
            <div className="bg-purple-50 p-4 rounded-full mb-4">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Email Support</h3>
            <p className="text-gray-600 text-sm">Send us a detailed message about non-urgent issues.</p>
            <p className="text-purple-600 font-bold mt-4 text-sm">Tap to Email ✉️</p>
          </a>

        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-lg mb-2">How does the AI Route Security work?</h4>
            <p className="text-gray-600">Our real-time GPS tracks your route. If the vehicle deviates from the planned path by more than 500 meters, our 24/7 security team is instantly alerted to check on you via the app or a phone call.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-lg mb-2">How do I report a lost item?</h4>
            <p className="text-gray-600">Once logged in, go to your Ride History in the dashboard, select the trip, and click "Report Lost Item" to securely contact your driver without sharing your real phone number.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-lg mb-2">Can I schedule a ride in advance?</h4>
            <p className="text-gray-600">Yes! Use the "Reserve a ride" tab on the home page to book a ride up to 90 days in advance. We automatically assign premium verified drivers to all reservations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;