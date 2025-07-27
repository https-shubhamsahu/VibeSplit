import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import Dashboard from "./Dashboard";
import About from "./About";
import TripForm from "./trip/TripForm";
import TripScreen from "./trip/TripScreen";
import JoinTrip from "./trip/JoinTrip";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import "./styles.css";

export default function App() {
  // HashRouter doesn't need basename with GitHub Pages
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/trip/new" element={<TripForm />} />
            <Route path="/trip/:tripId" element={<TripScreen />} />
            <Route path="/join/:code" element={<JoinTrip />} />
            
            {/* Canteen Tracker Routes */}
            <Route path="/canteen/new" element={<TripForm type="canteen" />} />
            <Route path="/canteen/:tripId" element={<TripScreen type="canteen" />} />
            
            {/* Outing Split Routes */}
            <Route path="/outing/new" element={<TripForm type="outing" />} />
            <Route path="/outing/:tripId" element={<TripScreen type="outing" />} />
            
            {/* Project Pool Routes */}
            <Route path="/project/new" element={<TripForm type="project" />} />
            <Route path="/project/:tripId" element={<TripScreen type="project" />} />
            {/* Catch all route for 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}
