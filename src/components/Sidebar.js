import React from 'react';

const Sidebar = ({ isOpen, imageSets, selectedSetId, onSelectSet, onToggle }) => {
  return (
    <>
      <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
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