import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { getSiteSettings } from "./firebase";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profil from "./pages/Profil";
import Kegiatan from "./pages/Kegiatan";
import Artikel from "./pages/Artikel";
import Galeri from "./pages/Galeri";
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";

// Member Portal Routes
import MemberLogin from "./jamaah/Login";
import MemberRegister from "./jamaah/Register";
import MemberDashboard from "./jamaah/Dashboard";
import MemberProfile from "./jamaah/Profile";
import MemberEvents from "./jamaah/Events";
import MemberMyEvents from "./jamaah/MyEvents";
import MemberDonations from "./jamaah/Donations";
import MemberDonationHistory from "./jamaah/DonationHistory";

// Import styling
import "./styles/front-styles.css";

export default function App() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    async function loadSettings() {
      const siteSettings = await getSiteSettings();
      setSettings(siteSettings);
    }
    loadSettings();
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Public Routes wrapped in Layout */}
        <Route 
          path="/" 
          element={
            <Layout settings={settings}>
              <Home settings={settings} />
            </Layout>
          } 
        />
        <Route 
          path="/profil" 
          element={
            <Layout settings={settings}>
              <Profil settings={settings} />
            </Layout>
          } 
        />
        <Route 
          path="/kegiatan" 
          element={
            <Layout settings={settings}>
              <Kegiatan />
            </Layout>
          } 
        />
        <Route 
          path="/artikel" 
          element={
            <Layout settings={settings}>
              <Artikel />
            </Layout>
          } 
        />
        <Route 
          path="/galeri" 
          element={
            <Layout settings={settings}>
              <Galeri />
            </Layout>
          } 
        />

        {/* Member Portal Routes */}
        <Route path="/jamaah/login" element={<MemberLogin />} />
        <Route path="/jamaah/register" element={<MemberRegister />} />
        <Route path="/jamaah/dashboard" element={<MemberDashboard />} />
        <Route path="/jamaah/profile" element={<MemberProfile />} />
        <Route path="/jamaah/events" element={<MemberEvents />} />
        <Route path="/jamaah/my-events" element={<MemberMyEvents />} />
        <Route path="/jamaah/donations" element={<MemberDonations />} />
        <Route path="/jamaah/donation-history" element={<MemberDonationHistory />} />

        {/* Admin CMS Routes (No global layout wrapper) */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  );
}
