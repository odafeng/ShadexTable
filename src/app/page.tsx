"use client";

import React from "react";

import FeatureSection from "@/components/FeatureSection";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Footer from "@/components/shared/Footer";

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
