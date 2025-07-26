import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Dashboard from "./Dashboard";
import About from "./About";
import TripForm from "./trip/TripForm";
import TripScreen from "./trip/TripScreen";
import JoinTrip from "./trip/JoinTrip";
import "./styles.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/trip/new" element={<TripForm />} />
        <Route path="/trip/:tripId" element={<TripScreen />} />
        <Route path="/join/:code" element={<JoinTrip />} />
      </Routes>
    </Router>
  );
}
