import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './styles/home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Encryption Matrix Background */}
      <div className="encryption-bg">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${4 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
          </span>
        ))}
      </div>

      {/* Main Content */}
      <motion.h1
        className="home-title"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        🔐 Post-Quantum Secure Messenger
      </motion.h1>

      <motion.p
        className="home-subtitle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Welcome to the future of secure messaging powered by Lattice-based Cryptography.
      </motion.p>

      <motion.div
        className="home-links"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Link to="/login" className="home-button">Login</Link>
        <Link to="/register" className="home-button">Register</Link>
      </motion.div>
    </div>
  );
};

export default Home;
