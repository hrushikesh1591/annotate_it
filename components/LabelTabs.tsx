
import React, { useState } from 'react';

interface Label {
  name: string;
  color: string;
}

interface LabelTabsProps {
  labels: Label[];
  activeLabel: string;
  onLabelChange: (label: string) => void;
  onRenameLabel: (oldName: string, newName: string) => void;
}

const LabelTabs: React.FC<LabelTabsProps> = ({ labels, activeLabel, onLabelChange, onRenameLabel }) => {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleEditClick = (labelName: string) => {
    setEditingLabel(labelName);
    setEditText(labelName);
  };

  const handleRename = () => {
    if (editingLabel) {
      onRenameLabel(editingLabel, editText.trim());
    }
    setEditingLabel(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditingLabel(null);
      setEditText('');
    }
  };


  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
       <h2 className="text-lg font-semibold mb-3 text-gray-200">Labels</h2>
      <div className="flex flex-col space-y-2">
        {labels.map((label) => {
          const isActive = label.name === activeLabel;
          const isEditing = label.name === editingLabel;
          const color = label.color.replace(', 0.5)', ')');
          
          return (
            <div
              key={label.name}
              className={`w-full text-left font-semibold py-2 px-3 rounded-md transition duration-200 ease-in-out flex items-center group
                ${isActive && !isEditing ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300'}
                ${!isEditing ? 'hover:bg-gray-600 cursor-pointer' : ''}`}
            >
              <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: color }}></span>
              
              {isEditing ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyDown}
                  className="bg-gray-600 text-white rounded px-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span onClick={() => onLabelChange(label.name)} className="flex-grow">{label.name}</span>
              )}

              {!isEditing && (
                <button 
                  onClick={() => handleEditClick(label.name)} 
                  className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  aria-label={`Edit label ${label.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabelTabs;