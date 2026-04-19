import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Wand2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #4c1d95 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative magical glowing orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '300px', height: '300px', background: '#db2777', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3 }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          maxWidth: '800px',
          padding: '4rem 3rem',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <motion.div 
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{
              padding: '1.5rem',
              borderRadius: '50%',
              color: '#fcd34d',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(219, 39, 119, 0.3) 100%)',
              border: '1px solid rgba(252, 211, 77, 0.3)'
            }}
          >
            <Wand2 size={48} />
          </motion.div>
        </div>

        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: '800', 
          marginBottom: '1rem',
          fontFamily: 'var(--font-serif)',
          background: 'linear-gradient(to right, #fcd34d, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.1'
        }}>
          Magical Stories <br /> Built for Children
        </h1>

        <p style={{ 
          fontSize: '1.25rem', 
          color: '#d1d5db', 
          marginBottom: '2.5rem',
          maxWidth: '600px',
          marginInline: 'auto'
        }}>
          Unleash your imagination. Enter a small prompt and watch our AI weave a unique short story filled with adventure, friendship, and wonder.
        </p>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/generate')}
          style={{ 
            padding: '1.25rem 2.5rem', 
            fontSize: '1.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #db2777 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 15px 30px rgba(139, 92, 246, 0.4)'
          }}
        >
          <Sparkles size={24} />
          Start the Adventure
        </motion.button>

        <div style={{ marginTop: '4rem', display: 'flex', gap: '3rem', justifyContent: 'center' }}>
          {[
            { icon: <BookOpen />, label: "Unique Adventures" },
            { icon: <Sparkles />, label: "AI Powered" },
            { icon: <Wand2 />, label: "Children Safe" }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}>
              {item.icon}
              <span style={{ fontWeight: '500' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
