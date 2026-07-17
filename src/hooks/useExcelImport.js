import { useState } from "react";
import { message } from "antd";
import * as XLSX from "xlsx";
import { importTasks } from "../api/tasks";

export function useExcelImport(fetchTaskEvents) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Mapping Modal States
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // 1. Open Wizard
  const handleOpenWizard = (userId) => {
    setCurrentUserId(userId);
    setIsMappingModalOpen(true);
  };

  // 2. User confirms mapping from Wizard Step 3
  const handleConfirmMapping = async (mapping, isDuty, selectedFile, excelData) => {
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

      // Create a new Excel file, ensuring JS Dates are written as proper Excel Dates
      const newWorksheet = XLSX.utils.json_to_sheet(mappedData, { cellDates: true });
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
      
      // Write to array buffer
      const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });
      
      // Convert to Blob/File, forcing .xlsx extension to avoid parser mismatch on the backend
      const originalName = selectedFile.name || "import";
      const newFileName = originalName.replace(/\.xlsx?$/, "") + "_mapped.xlsx";
      
      const newFile = new File([excelBuffer], newFileName, {
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
  };

  return {
    isUploading,
    handleOpenWizard,
    
    // Props for the modal
    mappingModalProps: {
      isOpen: isMappingModalOpen,
      onClose: handleCancelMapping,
      onConfirm: handleConfirmMapping,
      isProcessing: isUploading
    }
  };
}
