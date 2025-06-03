import React from 'react';

// Accept className prop
const Sidebar = ({ isOpen, imageSets, selectedSetId, onSelectSet, onToggle, className }) => {
  return (
    <>
      {/* The className prop (e.g., 'open') is added here */}
      <div className={`sidebar ${isOpen ? 'open' : 'closed'} ${className || ''}`}>
        <h3>Image Sets</h3>
        <ul>
          {imageSets.map((set) => (
            <li
              key={set.id}
              className={selectedSetId === set.id ? 'active' : ''}
              onClick={() => onSelectSet(set)}
            >
              {set.name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
