
import React from 'react';

const Instructions: React.FC = () => {
    return (
        <div className="text-center text-gray-400 max-w-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to the Annotator!</h2>
            <p className="mb-4">
                Get started by uploading an image using the panel on the left.
            </p>
            <div className="text-left bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-lg mb-2 text-gray-100">How to Annotate:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><span className="font-bold">Select a Label:</span> Pick a label from the list.</li>
                    <li><span className="font-bold">Click to Add Points:</span> Click on the image to create vertices of a polygon.</li>
                    <li><span className="font-bold">Double-Click to Complete:</span> Double-click anywhere on the image to finish the current shape.</li>
                    <li><span className="font-bold">Save Your Work:</span> Use the export buttons to save the visual annotation or the ML-ready data.</li>
                </ul>
            </div>
        </div>
    );
};

export default Instructions;