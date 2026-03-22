import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('https://resume-analyzer-api-2x2l.onrender.com/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume. Make sure backend is running.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Resume Roaster</h1>
      <p className="subtitle">Upload your PDF. Get brutal, actionable technical feedback.</p>
      
      <div className="upload-section">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="analyze-btn" onClick={handleUpload} disabled={loading}>
          {loading ? 'Scanning via Gemini AI...' : 'Analyze Resume'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results-section">
          
          <div className="score-card">
            <h2>{result.ats_score} / 100</h2>
            <p className="verdict-text">"{result.overall_verdict}"</p>
          </div>

          <div className="missing-skills">
            <h3>Missing Technical Keywords</h3>
            <div className="tags-container">
              {result.missing_keywords.map((skill, index) => (
                <span key={index} className="tag">{skill}</span>
              ))}
            </div>
          </div>

          <div className="weak-bullets">
            <h3>Weak Bullets & Pro Improvements</h3>
            {result.weak_bullets.map((bullet, index) => (
              <div key={index} className="bullet-card">
                <p><strong>Original:</strong> <span style={{color: '#94a3b8'}}>{bullet.original}</span></p>
                <p><strong>Fix:</strong> <span className="improvement-text">{bullet.improvement}</span></p>
              </div>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
}

export default App;