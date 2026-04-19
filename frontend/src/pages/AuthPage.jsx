import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // FastAPI OAuth2PasswordRequestForm requires URLSearchParams
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        const res = await axios.post(`${API_BASE}/login`, formData);
        login(res.data.access_token);
        navigate('/generate');
      } else {
        const res = await axios.post(`${API_BASE}/signup`, { username, password });
        login(res.data.access_token);
        navigate('/generate');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #4c1d95 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        title="Go Back"
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '0.75rem',
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          zIndex: 40
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Decorative magical glowing orbs in the background */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '300px', height: '300px', background: '#db2777', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3 }} />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          padding: '3rem',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          color: 'white',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(219, 39, 119, 0.3) 100%)', borderRadius: '50%', color: '#fcd34d', border: '1px solid rgba(252, 211, 77, 0.3)' }}
          >
             <Sparkles size={36} />
          </motion.div>
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fcd34d, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isLogin ? 'Welcome Back!' : 'Begin Your Tale'}
        </h2>
        <p style={{ color: '#d1d5db', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.4' }}>
          {isLogin ? 'Open your enchanted library and continue the adventure.' : 'Forge a magical account to save all your wonderful stories.'}
        </p>

        {error && <div style={{ color: '#fca5a5', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="text" 
            placeholder="Explorer Name (Username)" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '1.1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />
          <input 
            type="password" 
            placeholder="Secret Passcode" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '1.1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border 0.3s' }}
            onFocus={(e) => e.target.style.border = '1px solid #8b5cf6'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '1.1rem', fontSize: '1.1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #db2777 100%)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)'
            }}
          >
            {isLoading ? 'Conjuring...' : isLogin ? 'Open Library' : 'Create Library'}
            {!isLoading && <Wand2 size={20} />}
          </motion.button>
        </form>

        <p style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: '#9ca3af' }}>
          {isLogin ? "New to the magic? " : "Already an explorer? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: '#fcd34d', fontWeight: '700', cursor: 'pointer', borderBottom: '1px solid #fcd34d', paddingBottom: '2px' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
