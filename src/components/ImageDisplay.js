import React, { useState, useRef, useEffect } from 'react';
import OverlayGridCell from './OverlayGridCell';

const ImageDisplay = ({ words, imageSet, onCellClick }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const imageRef = useRef(null);

  const imageSrc = `${process.env.PUBLIC_URL}/images/${imageSet.imageFile}`;

  useEffect(() => {
    // Reset dimensions when imageSet changes to ensure grid recalculates
    setImageDimensions({ width: 0, height: 0, top: 0, left: 0 });
  }, [imageSet]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { offsetWidth, offsetHeight, offsetTop, offsetLeft } = imageRef.current;
      // We need the actual rendered dimensions of the image
      // For an img tag, offsetWidth/Height should be fine after load
      setImageDimensions({
        width: offsetWidth,
        height: offsetHeight,
        top: offsetTop, // Relative to its offsetParent
        left: offsetLeft, // Relative to its offsetParent
      });
    }
  };
  
  if (!imageSet || !words || words.length === 0) {
    return <p>Select an image set or loading content...</p>;
  }

  // Style for the overlay grid to match the loaded image's position and size
  // This assumes image-display-container uses relative positioning
  const overlayStyle = {
    position: 'absolute',
    top: imageRef.current ? imageRef.current.offsetTop : 0,
    left: imageRef.current ? imageRef.current.offsetLeft : 0,
    width: imageDimensions.width > 0 ? imageDimensions.width : '100%', // Fallback
    height: imageDimensions.height > 0 ? imageDimensions.height : 'auto', // Fallback
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    // gap: '1px', // If your source image has internal borders, otherwise 0
  };


  return (
    <div className="image-display-container">
      <img
        ref={imageRef}
        src={imageSrc}
        alt={imageSet.name || 'Vocabulary image'}
        className="theme-image"
        onLoad={handleImageLoad}
        onError={(e) => e.target.style.display = 'none'} // Hide if image fails
      />
      {imageDimensions.width > 0 && imageDimensions.height > 0 && (
        <div className="overlay-grid" style={overlayStyle}>
          {words.map((wordData, index) => (
            <OverlayGridCell
              key={`${imageSet.id}-${index}`}
              wordData={wordData} // { english: "...", turkish: "..." }
              onCellClick={onCellClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;