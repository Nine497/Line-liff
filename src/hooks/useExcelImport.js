import { useState } from "react";
import { message } from "antd";
import * as XLSX from "xlsx";
import { importTasks } from "../api/tasks";

export function useExcelImport(fetchTaskEvents) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Mapping Modal States
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // 1. User selects a file
  const handleFileSelect = (file, userId) => {
    if (!file) return;

    setCurrentUserId(userId);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON (array of arrays to easily get headers)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          message.error("ไฟล์ Excel ว่างเปล่า");
          return;
        }

        const headers = jsonData[0]; // First row is headers
        const rows = XLSX.utils.sheet_to_json(worksheet); // Array of objects
        
        setExcelHeaders(headers);
        setExcelData(rows);
        setIsMappingModalOpen(true);
      } catch (err) {
        message.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 2. User confirms mapping
  const handleConfirmMapping = async (mapping, isDuty) => {
    setIsUploading(true);
    
    try {
      // Create new mapped data
      const mappedData = excelData.map(row => {
        const newRow = {};
        
        // Only keep mapped columns, use standard names
        Object.keys(mapping).forEach(standardKey => {
          const originalHeader = mapping[standardKey];
          if (originalHeader && row[originalHeader] !== undefined) {
            newRow[standardKey] = row[originalHeader];
          }
        });

        // Apply defaults for duty shifts
        if (isDuty) {
          if (!newRow["ชื่องาน"]) newRow["ชื่องาน"] = "การเข้าเวร";
          if (!newRow["ประเภท"]) newRow["ประเภท"] = "เวร";
          if (!newRow["เวลาเริ่ม"]) newRow["เวลาเริ่ม"] = "08:30"; // Using standard HH:mm format
          if (!newRow["เวลาสิ้นสุด"]) newRow["เวลาสิ้นสุด"] = "16:30";
        }

        return newRow;
      });

      // Create a new Excel file
      const newWorksheet = XLSX.utils.json_to_sheet(mappedData);
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
      
      // Write to array buffer
      const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });
      
      // Convert to Blob/File
      const newFile = new File([excelBuffer], selectedFile.name || "mapped_import.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Call the existing API
      const result = await importTasks(newFile, currentUserId);

      await fetchTaskEvents();
      message.success(`นำเข้าสำเร็จ ${result.count} รายการ`);
      setIsMappingModalOpen(false);
    } catch (err) {
      message.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าไฟล์");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelMapping = () => {
    setIsMappingModalOpen(false);
    setSelectedFile(null);
    setExcelHeaders([]);
    setExcelData([]);
  };

  return {
    isUploading,
    handleUpload: handleFileSelect, // Renamed internally, but kept external API same
    
    // Props for the modal
    mappingModalProps: {
      isOpen: isMappingModalOpen,
      onClose: handleCancelMapping,
      onConfirm: handleConfirmMapping,
      excelHeaders,
      fileName: selectedFile?.name,
      isProcessing: isUploading
    }
  };
}
