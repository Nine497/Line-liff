import { useState, useEffect } from "react";
import { Modal, Select, Button, Alert } from "antd";
import { ArrowRightLeft } from "lucide-react";

const STANDARD_FIELDS = [
    { key: "ชื่องาน", label: "ชื่องาน (Task Name)", required: true },
    { key: "วันที่", label: "วันที่ (Date)", required: true },
    { key: "เวลาเริ่ม", label: "เวลาเริ่ม (Start Time)", required: false },
    { key: "เวลาสิ้นสุด", label: "เวลาสิ้นสุด (End Time)", required: false },
    { key: "ประเภท", label: "ประเภทงาน (Task Type)", required: false },
    { key: "สถานที่", label: "สถานที่ (Location)", required: false },
    { key: "รายละเอียด", label: "รายละเอียด (Description)", required: false },
    { key: "ผู้เข้าร่วม", label: "ผู้เข้าร่วม (Participants)", required: false },
];

export default function ExcelMappingModal({
    isOpen,
    onClose,
    onConfirm,
    excelHeaders,
    fileName,
    isProcessing
}) {
    const [mapping, setMapping] = useState({});
    const [isDuty, setIsDuty] = useState(false);

    // Auto-map logic based on exact match or partial match
    useEffect(() => {
        if (!isOpen || !excelHeaders?.length) return;
        
        const initialMapping = {};
        STANDARD_FIELDS.forEach(field => {
            // 1. Exact match
            let matchedHeader = excelHeaders.find(h => h === field.key);
            
            // 2. Partial match if no exact match (e.g. "ชื่อ" in "ชื่องาน")
            if (!matchedHeader) {
                matchedHeader = excelHeaders.find(h => 
                    h.includes(field.key) || field.key.includes(h)
                );
            }
            
            if (matchedHeader) {
                initialMapping[field.key] = matchedHeader;
            }
        });
        setMapping(initialMapping);
    }, [isOpen, excelHeaders]);

    const handleSelectChange = (standardKey, excelHeader) => {
        setMapping(prev => ({
            ...prev,
            [standardKey]: excelHeader
        }));
    };

    const handleConfirm = () => {
        onConfirm(mapping, isDuty);
    };

    // If it's duty mode, task name is implicitly filled by default so it's not strictly required to be mapped
    const missingRequired = STANDARD_FIELDS.filter(f => f.required && !mapping[f.key] && !(isDuty && f.key === "ชื่องาน"));
    const isValid = missingRequired.length === 0;

    return (
        <Modal
            title={<div className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-primary" /> จับคู่ข้อมูล (Column Mapping)</div>}
            open={isOpen}
            onCancel={onClose}
            maskClosable={false}
            footer={null}
            width={600}
        >
            <div className="flex flex-col gap-4 py-4">
                <Alert 
                    type="info" 
                    message={`ไฟล์: ${fileName}`} 
                    description="กรุณาจับคู่คอลัมน์จากไฟล์ Excel ของคุณให้ตรงกับข้อมูลที่ระบบต้องการ เพื่อความถูกต้องในการนำเข้าข้อมูล" 
                    showIcon 
                />

                <div className="border border-border rounded-lg overflow-hidden mt-2">
                    <div className="grid grid-cols-2 bg-secondary/50 p-3 border-b border-border">
                        <div className="font-semibold text-sm">ข้อมูลที่ระบบต้องการ</div>
                        <div className="font-semibold text-sm">คอลัมน์ในไฟล์ Excel</div>
                    </div>
                    
                    <div className="flex flex-col max-h-[400px] overflow-y-auto p-1">
                        {STANDARD_FIELDS.map((field) => (
                            <div key={field.key} className="grid grid-cols-2 items-center gap-4 p-2 hover:bg-secondary/20 rounded-md transition-colors">
                                <div className="text-sm">
                                    <span className={field.required ? "font-medium text-foreground" : "text-muted-foreground"}>
                                        {field.label}
                                    </span>
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                </div>
                                <div>
                                    <Select
                                        allowClear
                                        placeholder="-- ไม่ระบุ --"
                                        style={{ width: "100%" }}
                                        value={mapping[field.key] || undefined}
                                        onChange={(val) => handleSelectChange(field.key, val)}
                                        options={excelHeaders.map(h => ({ value: h, label: h }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-lg border border-primary/20">
                    <input 
                        type="checkbox" 
                        id="isDuty" 
                        className="w-4 h-4 cursor-pointer"
                        checked={isDuty}
                        onChange={(e) => setIsDuty(e.target.checked)}
                    />
                    <label htmlFor="isDuty" className="text-sm font-medium cursor-pointer flex-1">
                        นี่คือไฟล์ตารางเวร (ใช้ค่าเริ่มต้น: ชื่องาน="การเข้าเวร", ประเภท="เวร", เวลา 08:30-16:30)
                    </label>
                </div>

                {!isValid && (
                    <div className="text-destructive text-sm mt-2">
                        * กรุณาจับคู่ข้อมูลที่จำเป็นให้ครบถ้วน: {missingRequired.map(f => f.label).join(", ")}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button onClick={onClose} disabled={isProcessing}>
                        ยกเลิก
                    </Button>
                    <Button 
                        type="primary" 
                        onClick={handleConfirm} 
                        disabled={!isValid || isProcessing}
                        loading={isProcessing}
                    >
                        ยืนยันและนำเข้า
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
