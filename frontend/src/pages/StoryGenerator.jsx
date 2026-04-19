import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, RotateCcw, BarChart2, Star, Trash2, LogOut, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HistorySidebar from '../components/HistorySidebar';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Sidebar = ({ isOpen, metrics, isLoading }) => {
  let parsedMetrics = null;
  if (metrics) {
    try {
      parsedMetrics = JSON.parse(metrics);
    } catch (e) {
      console.error("Failed to parse metrics", e);
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: '380px', // slightly wider for more text
        background: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--border)',
        padding: '2rem',
        zIndex: 100,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <BarChart2 size={24} color="var(--primary)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Story Evaluation</h2>
      </div>

      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loader">Analyzing...</div>
        </div>
      ) : parsedMetrics ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Score</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>{parsedMetrics.overall_score}<span style={{fontSize: '1.5rem', color: 'var(--text-muted)'}}>/5</span></div>
          </div>
          
          {['age_appropriateness', 'narrative_flow', 'creativity', 'wholesomeness'].map((key) => {
             const data = parsedMetrics[key];
             if (!data) return null;
             const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             return (
                <div key={key} className="metric-card" style={{
                  background: 'var(--card-bg)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-color)', fontWeight: '700' }}>{title}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>{data.score}/5</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {data.reasoning}
                  </div>
                </div>
             )
          })}
          
        </div>
      ) : metrics ? (
         <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', wordBreak: 'break-word' }}>
           <strong>Raw Output (Parse Failed):</strong><br/><br/>
           {metrics}
         </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
          Generate a story to see its ratings here!
        </div>
      )}
    </motion.div>
  );
};

const StoryGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [displayedStory, setDisplayedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [refreshId, setRefreshId] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const storyEndRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    if (story && displayedStory.length < story.length) {
      const timeout = setTimeout(() => {
        setDisplayedStory(story.slice(0, displayedStory.length + 1));
      }, 20); // Speed of typewriter
      return () => clearTimeout(timeout);
    } else if (story && displayedStory.length === story.length && !metrics && !isRating) {
      // Trigger rating once story finished typing
      rateStory(story);
    }
  }, [story, displayedStory, isRating, metrics]);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedStory]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setStory('');
    setDisplayedStory('');
    setMetrics(null);
    setShowSidebar(false);

    try {
      const res = await axios.post(`${API_BASE}/generate`, { prompt });
      setStory(res.data.story);
    } catch (err) {
      console.error(err);
      alert("Failed to generate story. Is the backend running?");
    } finally {
      setIsGenerating(false);
    }
  };

  const rateStory = async (generatedStory) => {
    setIsRating(true);
    setShowSidebar(true);
    try {
      const res = await axios.post(`${API_BASE}/rate`, { story: generatedStory });
      const newMetrics = res.data.rating;
      setMetrics(newMetrics);
      
      // Auto-save to memory
      await axios.post(`${API_BASE}/stories`, {
        prompt: prompt,
        content: generatedStory,
        rating_json: newMetrics
      });
      setRefreshId(prev => prev + 1); // trigger HistorySidebar refresh
    } catch (err) {
      console.error("Rating failed:", err);
    } finally {
      setIsRating(false);
    }
  };

  const handleSelectStory = (historyStory) => {
    setPrompt(historyStory.prompt);
    setStory(historyStory.content);
    setDisplayedStory(historyStory.content);
    setMetrics(historyStory.rating_json);
    setShowSidebar(true);
  };

  const reset = () => {
    setPrompt('');
    setStory('');
    setDisplayedStory('');
    setMetrics(null);
    setShowSidebar(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      minHeight: '100vh', 
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #4c1d95 100%)',
      position: 'relative',
      color: 'white'
    }}>
      {/* Decorative magical glowing orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '15%', width: '400px', height: '400px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.3, zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: '400px', height: '400px', background: '#db2777', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2, zIndex: 0 }} />

      <HistorySidebar onSelectStory={handleSelectStory} shouldRefresh={refreshId} />
      <div style={{ 
        flex: 1, 
        padding: '2rem', 
        paddingRight: showSidebar ? '340px' : '2rem',
        transition: 'padding 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <button onClick={() => navigate('/')} className="glass" style={{
            border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}><ArrowLeft size={20} /></button>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
             <button onClick={() => setShowSidebar(!showSidebar)} className="glass" style={{
                border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: showSidebar ? 'var(--primary)' : 'inherit', fontWeight: '600'
              }}>
                <BarChart2 size={18} /> {showSidebar ? 'Hide Stats' : 'Show Stats'}
              </button>
              <button onClick={reset} className="glass" style={{
                border: 'none', padding: '0.5rem 1.25rem', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', color: 'white', fontWeight: 'bold'
              }}><PlusCircle size={18} /> New Story</button>
              <button onClick={logout} title="Log Out" className="glass" style={{
                border: 'none', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', color: '#ef4444', background: 'var(--card-bg)'
              }}><LogOut size={18} /></button>
          </div>
        </div>

        {/* Welcome & Prompt */}
        {!story && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', width: '100%', maxWidth: '700px', marginTop: '10vh' }}
          >
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Welcome, Little Author!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Tell me a few words, and I'll dream up a magical story just for you.</p>
            
            <div style={{ position: 'relative', width: '100%' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Once upon a time, there lived a brave little cat named..."
                style={{
                  width: '100%',
                  height: '150px',
                  padding: '1.5rem',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '1.1rem',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  bottom: '1rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  opacity: !prompt.trim() ? 0.5 : 1
                }}
              >
                {isGenerating ? '...' : <Send size={20} />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Generating Loader */}
        {isGenerating && (
          <div style={{ marginTop: '15vh', textAlign: 'center' }}>
            <div className="loader-ring"></div>
            <p style={{ marginTop: '1rem', fontWeight: '600', color: 'var(--primary)' }}>Weaving your magical tale...</p>
          </div>
        )}

        {/* Story Display */}
        {(displayedStory || story) && (
          <div className="story-container" style={{
            maxWidth: '800px',
            width: '100%',
            padding: '2rem',
            background: 'var(--card-bg)',
            borderRadius: '24px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
            border: '1px solid var(--border)',
            lineHeight: 1.8,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-serif)',
            whiteSpace: 'pre-wrap'
          }}>
            {displayedStory}
            {displayedStory.length < story.length && <span className="typewriter-cursor">|</span>}
            <div ref={storyEndRef} />
          </div>
        )}
      </div>

      <Sidebar isOpen={showSidebar} metrics={metrics} isLoading={isRating} />

      <style>{`
        .loader-ring {
          width: 48px;
          height: 48px;
          border: 4px solid var(--accent);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StoryGenerator;
