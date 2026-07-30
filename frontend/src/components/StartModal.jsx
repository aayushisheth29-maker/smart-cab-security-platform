import React, { useState } from 'react';

const StartModal = ({ isOpen, onClose }) => {
  // Local state for the modal
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    destination: '', // Added for step 2
  });

  // If isOpen is false, render absolutely nothing
  if (!isOpen) return null;

  // Validation checks
  const isStep1Valid = formData.fullName.trim() !== '' && formData.phoneNumber.trim() !== '';
  const isStep2Valid = formData.destination.trim() !== '';

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    console.log("Form Submitted to Backend: ", formData);
    alert("Application submitted successfully!");
    onClose(); // Close modal on success
  };

  return (
    /* 
      MENTOR TIP: Click Outside to Close
      The onClick here on the background overlay triggers onClose.
      We use backdrop-blur-sm for that premium frosted-glass look.
    */
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity"
      onClick={onClose} 
    >
      {/* 
        MENTOR TIP: e.stopPropagation()
        This prevents clicks inside the white modal box from triggering the background's onClose
      */}
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-transform"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Close 'X' Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        {/* Progress Bar */}
        <div className="mb-6 flex gap-2 pt-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 1 ? 'bg-black' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
        </div>

        <p className="text-sm text-gray-500 mb-1">Step {currentStep} of 3</p>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Let's get you started</h2>

        {/* --- STEP 1: Personal Info --- */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative">
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <input 
                type="text" 
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full rounded-xl bg-gray-50 p-3 pl-10 outline-none border border-transparent focus:border-black focus:bg-white transition-all"
              />
            </div>
            
            <div className="relative">
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              <input 
                type="tel" 
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full rounded-xl bg-gray-50 p-3 pl-10 outline-none border border-transparent focus:border-black focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* --- STEP 2: Ride Details --- */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="relative">
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Where to?"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                className="w-full rounded-xl bg-gray-50 p-3 pl-10 outline-none border border-transparent focus:border-black focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* --- STEP 3: Review --- */}
        {currentStep === 3 && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
             <p className="text-sm text-gray-500">Please review your details:</p>
             <p className="font-medium">Name: {formData.fullName}</p>
             <p className="font-medium">Phone: {formData.phoneNumber}</p>
             <p className="font-medium">Destination: {formData.destination}</p>
          </div>
        )}

        {/* Bottom Buttons Container */}
        <div className="mt-8 flex gap-3">
          {/* Show Back button only on step 2 and 3 */}
          {currentStep > 1 && (
            <button 
              onClick={handleBack}
              className="px-5 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}

          {/* MENTOR TIP: Form Validation & Dynamic Button Styling */}
          <button 
            onClick={currentStep === 3 ? handleSubmit : handleNextStep}
            disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
            className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all 
              ${((currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid))
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800 active:scale-[0.98]'
              }`}
          >
            {currentStep === 3 ? 'Confirm Ride' : 'Continue'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default StartModal;