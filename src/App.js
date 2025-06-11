import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ImageDisplay from './components/ImageDisplay';
import './App.css';

function App() {
  const [availableImageSets, setAvailableImageSets] = useState([]);
  const [selectedImageSet, setSelectedImageSet] = useState(null);
  const [currentWordPairs, setCurrentWordPairs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to true for desktop
  const [isLoading, setIsLoading] = useState(false);

  // Effect to adjust sidebar default state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false); // Default to closed on smaller screens
      } else {
        setIsSidebarOpen(true); // Default to open on larger screens
      }
    };
    handleResize(); // Call on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // ... (rest of your useEffects for fetching data remain the same) ...
  // Fetch available image sets from manifest.json
  useEffect(() => {
    setIsLoading(true);
    fetch(`${process.env.PUBLIC_URL}/manifest.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.imageSets && data.imageSets.length > 0) {
          setAvailableImageSets(data.imageSets);
          if (!selectedImageSet) { // Set initial selection only if not already set
            setSelectedImageSet(data.imageSets[0]);
          }
        } else {
          console.error("No image sets found in manifest.");
          setAvailableImageSets([]);
        }
      })
      .catch(error => console.error("Error fetching manifest:", error))
      .finally(() => setIsLoading(false));
  }, [selectedImageSet]); // Add selectedImageSet to prevent re-fetch if already selected

  // Fetch words when selectedImageSet changes
  useEffect(() => {
    if (!selectedImageSet) return;

    setIsLoading(true);
    setCurrentWordPairs([]); 
    fetch(`${process.env.PUBLIC_URL}/words/${selectedImageSet.id}.txt`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for ${selectedImageSet.id}.txt`);
        return res.text();
      })
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const pairs = lines.map(line => {
          const parts = line.split('|');
          if (parts.length === 2) {
            return { english: parts[0].trim(), turkish: parts[1].trim() };
          }
          console.warn(`Skipping malformed line: ${line}`);
          return null;
        }).filter(pair => pair !== null);

        if (pairs.length !== 12) {
          console.warn(`Expected 12 word pairs for ${selectedImageSet.id}, but found ${pairs.length}. Check ${selectedImageSet.id}.txt`);
        }
        setCurrentWordPairs(pairs.slice(0, 12));
      })
      .catch(error => {
        console.error("Error fetching words:", error);
        setCurrentWordPairs([]);
      })
      .finally(() => setIsLoading(false));

  }, [selectedImageSet]);

  const handleSpeak = useCallback(({ english, turkish }) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 

      const utterances = [];
      for (let i = 0; i < 2; i++) { 
        const utteranceEn = new SpeechSynthesisUtterance(english);
        utteranceEn.lang = 'en-US';
        utterances.push(utteranceEn);
        utteranceEn.rate = 0.8;
        utteranceEn.pitch = 1;

        const utteranceTr = new SpeechSynthesisUtterance(turkish);
        utteranceTr.lang = 'tr-TR';
        utterances.push(utteranceTr);
      }
      // Simple queueing
      let currentUtterance = 0;
      const speakNext = () => {
        if (currentUtterance < utterances.length) {
          const utt = utterances[currentUtterance++];
          utt.onend = speakNext; // Speak next when current finishes
          window.speechSynthesis.speak(utt);
        }
      };
      speakNext();

    } else {
      alert("Sorry, your browser does not support text-to-speech.");
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleSelectSet = (set) => {
    setSelectedImageSet(set);
    if (window.innerWidth <= 768 && isSidebarOpen) { // Auto-close sidebar on mobile after selection
        setIsSidebarOpen(false);
    }
  }

  // Add a backdrop when sidebar is open on mobile
  const backdrop = isSidebarOpen && window.innerWidth <= 768 ? (
    <div 
        style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 999 /* Below sidebar */
        }}
        onClick={toggleSidebar} // Close sidebar on backdrop click
    ></div>
  ) : null;


  if (isLoading && availableImageSets.length === 0) {
    return <div className="app-container"><p style={{margin: 'auto'}}>Loading application data...</p></div>;
  }

  return (
    <div className="app-container">
      {/* Pass the 'open' class based on isSidebarOpen state */}
      <Sidebar
        isOpen={isSidebarOpen} // isOpen still controls visibility logic
        imageSets={availableImageSets}
        selectedSetId={selectedImageSet ? selectedImageSet.id : ''}
        onSelectSet={handleSelectSet}
        onToggle={toggleSidebar} // The toggle button is in App.js now
        // Add a CSS class for media query styling
        className={isSidebarOpen ? 'open' : ''}
      />
      {backdrop}
      <main className="main-content">
        <div className="controls">
          <button onClick={toggleSidebar} style={{ marginRight: 'auto' }}>
            {isSidebarOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
          </button>
        </div>
        
        {isLoading && selectedImageSet && currentWordPairs.length === 0 && <p>Loading content for {selectedImageSet.name}...</p>}
        
        {!isLoading && selectedImageSet && currentWordPairs.length > 0 && (
          <ImageDisplay
            words={currentWordPairs}
            imageSet={selectedImageSet}
            onCellClick={handleSpeak}
          />
        )}
        {/* ... other conditional rendering ... */}
         {!isLoading && selectedImageSet && currentWordPairs.length === 0 && availableImageSets.find(s => s.id === selectedImageSet.id) && (
          <p>No word data found for "{selectedImageSet.name}". Please check `public/words/{selectedImageSet.id}.txt`.</p>
        )}
         {!isLoading && availableImageSets.length === 0 && (
          <p>No image sets found. Please check `public/manifest.json` and ensure image/word files exist.</p>
         )}
         {!isLoading && !selectedImageSet && availableImageSets.length > 0 && (
          <p>Please select an image set from the menu.</p>
         )}
      </main>
    </div>
  );
}

export default App;
