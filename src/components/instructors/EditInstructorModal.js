import React from 'react';

/**
 * EditInstructorModal component for editing instructor details
 */
const EditInstructorModal = ({
  isOpen,
  instructor,
  classTypes,
  onChange,
  onSave,
  onClose
}) => {
  if (!isOpen || !instructor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Instructor
                </h3>
                
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={instructor.name || ''}
                      onChange={onChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={instructor.email || ''}
                      onChange={onChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={instructor.phone || ''}
                      onChange={onChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  {/* Class Settings */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Block Size
                      </label>
                      <input
                        type="number"
                        name="blockSize"
                        value={instructor.blockSize || 2}
                        onChange={onChange}
                        min="1"
                        max="10"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Classes
                      </label>
                      <input
                        type="number"
                        name="minClasses"
                        value={instructor.minClasses || 1}
                        onChange={onChange}
                        min="0"
                        max="50"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Classes
                      </label>
                      <input
                        type="number"
                        name="maxClasses"
                        value={instructor.maxClasses || 10}
                        onChange={onChange}
                        min="1"
                        max="50"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  
                  {/* Class Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {classTypes.map(type => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`classTypes-${type}`}
                            name={`classTypes-${type}`}
                            checked={instructor.classTypes?.includes(type) || false}
                            onChange={onChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`classTypes-${type}`} className="ml-2 block text-sm text-gray-900">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={instructor.notes || ''}
                      onChange={onChange}
                      rows="3"
                      className="w-full p-2 border rounded"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onSave}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInstructorModal;
