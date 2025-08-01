// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './styles/home.css';

const Home = () => {
    return (
        <div className="home-container">
            <h1>Post-Quantum Secure Messenger</h1>
            <p>Welcome to the future of secure messaging powered by Lattice-based Cryptography.</p>
            <div className="home-links">
                <Link to="/login" className="home-button">Login</Link>{' '}
                <Link to="/register" className="home-button">Register</Link>
            </div>
        </div>
    );
};

export default Home;
