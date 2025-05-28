import React from 'react';

const OverlayGridCell = ({ wordData, onCellClick }) => {
  const handleClick = () => {
    onCellClick(wordData);
  };

  return (
    <div className="overlay-grid-cell" onClick={handleClick}>
      {/* The cell is intentionally empty to show the underlying image */}
      {/* The English word is assumed to be part of the image */}
    </div>
  );
};

export default OverlayGridCell;