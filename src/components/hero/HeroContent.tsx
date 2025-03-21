
import React from "react";
import HeroMedicationForm from "./HeroMedicationForm";

export default function HeroContent() {
  return (
    <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">See if medications and supplements mix safely in seconds!</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Easily verify potential interactions between medications and supplements. 
          Get instant, clear results!
        </p>
        
        <HeroMedicationForm />
      </div>
    </div>
  );
}
