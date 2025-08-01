// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Home from './pages/Home';

function App() {
  const [currentUser, setCurrentUser] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={<Login setCurrentUser={setCurrentUser} />}
        />
        <Route
          path="/chat"
          element={<Chat username={currentUser} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
