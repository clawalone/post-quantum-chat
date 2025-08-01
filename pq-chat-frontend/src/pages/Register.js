// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './styles/register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', formData);

      if (res.status === 201) {
        navigate('/login');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Registration failed.');
      } else {
        setError('Registration failed. Try again.');
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <label htmlFor="username">Username</label>
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <label htmlFor="password">Password</label>
        </div>

        <button type="submit">Register</button>
      </form>

      {error && <p className="error">{error}</p>}

      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;
