"use client";

import React from "react";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <FeatureSection />
      <Footer />
    </main>
  );
}
