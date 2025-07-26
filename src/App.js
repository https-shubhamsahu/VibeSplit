import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import Dashboard from "./Dashboard";
import About from "./About";
import TripForm from "./trip/TripForm";
import TripScreen from "./trip/TripScreen";
import JoinTrip from "./trip/JoinTrip";
import "./styles.css";

export default function App() {
  // Get the base URL from package.json homepage
  const baseUrl = process.env.PUBLIC_URL || "";

  return (
    <Router basename={baseUrl}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/trip/new" element={<TripForm />} />
        <Route path="/trip/:tripId" element={<TripScreen />} />
        <Route path="/join/:code" element={<JoinTrip />} />
        {/* Catch all route for 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
