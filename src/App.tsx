import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminAgenda from './components/AdminAgenda';
import BookingForm from './components/BookingForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminAgenda />} />
        <Route path="/prenota" element={<BookingForm />} />
      </Routes>
    </BrowserRouter>
  );
}
