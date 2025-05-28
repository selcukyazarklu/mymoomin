import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ImageDisplay from './components/ImageDisplay';
import './App.css';

function App() {
  const [availableImageSets, setAvailableImageSets] = useState([]);
  const [selectedImageSet, setSelectedImageSet] = useState(null); // Stores the whole set object
  const [currentWordPairs, setCurrentWordPairs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
          setSelectedImageSet(data.imageSets[0]); // Select the first one by default
        } else {
          console.error("No image sets found in manifest.");
          setAvailableImageSets([]);
        }
      })
      .catch(error => console.error("Error fetching manifest:", error))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch words when selectedImageSet changes
  useEffect(() => {
    if (!selectedImageSet) return;

    setIsLoading(true);
    setCurrentWordPairs([]); // Clear previous words
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
        setCurrentWordPairs(pairs.slice(0, 12)); // Ensure only 12
      })
      .catch(error => {
        console.error("Error fetching words:", error);
        setCurrentWordPairs([]);
      })
      .finally(() => setIsLoading(false));

  }, [selectedImageSet]);

  const handleSpeak = useCallback(({ english, turkish }) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      const utterances = [];
      for (let i = 0; i < 2; i++) { // Repeat twice
        const utteranceEn = new SpeechSynthesisUtterance(english);
        utteranceEn.lang = 'en-US';
        // You might want to find specific voices if default isn't good
        const voices = window.speechSynthesis.getVoices();
        // utteranceEn.voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')); // Example
        utterances.push(utteranceEn);

        const utteranceTr = new SpeechSynthesisUtterance(turkish);
		    utteranceTr.voice = voices.find(v => v.lang === 'tr-TR');
        utteranceTr.lang = 'tr-TR';
        
        utterances.push(utteranceTr);
      }

      utterances.forEach(utt => window.speechSynthesis.speak(utt));

    } else {
      alert("Sorry, your browser does not support text-to-speech.");
    }
  }, []); // No dependencies as languages are fixed

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleSelectSet = (set) => {
    setSelectedImageSet(set);
    if (!isSidebarOpen && window.innerWidth < 768) { // Auto-close sidebar on mobile after selection
        // setIsSidebarOpen(false); // Or keep it open
    }
  }

  if (isLoading && availableImageSets.length === 0) {
    return <div className="app-container"><p>Loading application data...</p></div>;
  }

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isSidebarOpen}
        imageSets={availableImageSets}
        selectedSetId={selectedImageSet ? selectedImageSet.id : ''}
        onSelectSet={handleSelectSet}
        onToggle={toggleSidebar}
      />
      <main className="main-content">
        <div className="controls">
          <button onClick={toggleSidebar} style={{ marginRight: 'auto' }}>
            {isSidebarOpen ? 'Hide Menu' : 'Show Menu'}
          </button>
          {/* Language selector removed */}
        </div>
        
        {isLoading && selectedImageSet && currentWordPairs.length === 0 && <p>Loading content for {selectedImageSet.name}...</p>}
        
        {!isLoading && selectedImageSet && currentWordPairs.length > 0 && (
          <ImageDisplay
            words={currentWordPairs}
            imageSet={selectedImageSet}
            onCellClick={handleSpeak}
          />
        )}
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


