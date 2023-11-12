import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './AuthForms.css';

const AuthForms = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(true); 

  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setPassword('');
  };

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        alert('Registration successful. Please log in.');
        toggleForm(); 
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      alert('Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.token, username);
      } else {
        throw new Error('User Not Found');
      }
    } catch (error) {
      alert('User Not Found');
    }
  };

  return (
    <div>
      <div className={isRegistering ? 'register-form' : 'hidden'}>
        <h2>Register</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size={35}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size={35}
        />
        <button onClick={handleRegister}>Register</button>
        <p>If You Have an Account? <span onClick={toggleForm}>Login here</span></p>
      </div>

      <div className={!isRegistering ? 'login-form' : 'hidden'}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size={35}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          size={35}
        />
        <button onClick={handleLogin}>Login</button>
        <p>If You Don't Have an Account? <span onClick={toggleForm}>Register here</span></p>
      </div>
    </div>
  );
};

export default AuthForms;