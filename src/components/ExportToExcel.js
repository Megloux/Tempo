import React from 'react';
import * as XLSX from 'xlsx';

const ExportToExcel = ({ data, filename = 'schedule_export.xlsx', buttonText = 'Export to Excel' }) => {
  const exportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    
    // Write the workbook and trigger a download
    XLSX.writeFile(wb, filename);
  };
  
  return (
    <button
      onClick={exportToExcel}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
    >
      {buttonText}
    </button>
  );
};

export default ExportToExcel;
