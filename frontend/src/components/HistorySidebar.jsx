import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { History, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const HistorySidebar = ({ onSelectStory, shouldRefresh }) => {
  const [stories, setStories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stories`);
      setStories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [shouldRefresh]); // Refetch when auto-saved

  const toggle = () => {
    if (!isOpen) fetchStories();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button 
        onClick={toggle}
        title="My Stories History"
        style={{
          position: 'fixed',
          left: '1.5rem',
          top: '1.5rem',
          zIndex: 50,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          padding: '0.75rem',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-color)'
        }}
        className="glass-btn"
      >
        <History size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggle}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 30
              }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                height: '100vh',
                width: '320px',
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--border)',
                padding: '6rem 1.5rem 2rem 1.5rem',
                zIndex: 40,
                boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <BookOpen size={20} color="var(--primary)"/> My Magic Library
              </h2>

              {stories.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                  You haven't saved any stories yet.<br/><br/>Start generating!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stories.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { onSelectStory(s); setIsOpen(false); }}
                      className="metric-card"
                      style={{
                        background: 'var(--card-bg)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-color)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{s.prompt}"
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistorySidebar;
