import React, { useState, useRef, useEffect, useCallback } from 'react';
import OverlayGridCell from './OverlayGridCell';

const ImageDisplay = ({ words, imageSet, onCellClick }) => {
  const [imageRenderedRect, setImageRenderedRect] = useState(null); // Stores { top, left, width, height }
  const imageRef = useRef(null);
  const containerRef = useRef(null); // Ref for the direct parent of the image

  const imageSrc = `${process.env.PUBLIC_URL}/images/${imageSet.imageFile}`;

  // Function to update image dimensions
  const updateImageDimensions = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const imgElement = imageRef.current;
      const containerElement = containerRef.current;

      // Get dimensions of the rendered image
      const imgRect = imgElement.getBoundingClientRect();
      // Get dimensions of the container (which should be the offset parent for the overlay)
      const containerRect = containerElement.getBoundingClientRect();

      setImageRenderedRect({
        top: imgRect.top - containerRect.top, // Position relative to the container
        left: imgRect.left - containerRect.left, // Position relative to the container
        width: imgRect.width,
        height: imgRect.height,
      });
    } else {
      setImageRenderedRect(null);
    }
  }, []); // No dependencies, relies on refs

  // Effect for initial load and when imageSet changes
  useEffect(() => {
    setImageRenderedRect(null); // Reset on image change
    // updateImageDimensions will be called by onLoad of the image
  }, [imageSet]);

  // Effect for handling window resize
  useEffect(() => {
    // Call it once to set initial dimensions if image is already loaded
    // (e.g. if navigating back or image was cached)
    if (imageRef.current && imageRef.current.complete) {
        updateImageDimensions();
    }

    window.addEventListener('resize', updateImageDimensions);
    return () => {
      window.removeEventListener('resize', updateImageDimensions);
    };
  }, [updateImageDimensions]); // Re-run if updateImageDimensions changes (it won't due to useCallback)

  const handleImageLoad = () => {
    updateImageDimensions(); // Calculate dimensions once image is loaded
  };

  if (!imageSet || !words || words.length === 0) {
    return <p>Select an image set or loading content...</p>;
  }

  // Style for the overlay grid to match the loaded image's position and size
  const overlayStyle = imageRenderedRect
    ? {
        position: 'absolute',
        top: `${imageRenderedRect.top}px`,
        left: `${imageRenderedRect.left}px`,
        width: `${imageRenderedRect.width}px`,
        height: `${imageRenderedRect.height}px`,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
      }
    : { display: 'none' }; // Hide overlay until dimensions are calculated


  return (
    // This containerRef is important for positioning the overlay relative to it
    <div ref={containerRef} className="image-display-container">
      <img
        ref={imageRef}
        src={imageSrc}
        alt={imageSet.name || 'Vocabulary image'}
        className="theme-image"
        onLoad={handleImageLoad} // Critical for initial dimensions
        onError={(e) => {
            e.target.style.display = 'none';
            setImageRenderedRect(null); // Clear dimensions if image fails
        }}
      />
      {imageRenderedRect && imageRenderedRect.width > 0 && (
        <div className="overlay-grid" style={overlayStyle}>
          {words.map((wordData, index) => (
            <OverlayGridCell
              key={`${imageSet.id}-${index}`}
              wordData={wordData}
              onCellClick={onCellClick}
            />
          ))}
        </div>
      )}
      {/* Fallback message if image is loading or dimensions aren't ready */}
      {(!imageRenderedRect || imageRenderedRect.width === 0) && imageSet && (
         <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>Loading image...</div>
      )}
    </div>
  );
};

export default ImageDisplay;
