import { useState, useEffect, useRef } from "react";
import { Modal, Select, Button, Steps, Alert, Upload as AntdUpload, message } from "antd";
import { ArrowRightLeft, CalendarDays, ShieldAlert, Inbox } from "lucide-react";
import * as XLSX from "xlsx";

const { Dragger } = AntdUpload;

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

export default function ImportWizardModal({
    isOpen,
    onClose,
    onConfirm,
    isProcessing
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [importType, setImportType] = useState(null); // 'general' | 'duty'
    const [selectedFile, setSelectedFile] = useState(null);
    const [excelHeaders, setExcelHeaders] = useState([]);
    const [excelData, setExcelData] = useState([]);
    const [mapping, setMapping] = useState({});

    // Reset when opened/closed
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setImportType(null);
            setSelectedFile(null);
            setExcelHeaders([]);
            setExcelData([]);
            setMapping({});
        }
    }, [isOpen]);

    // Auto-map logic when moving to step 2 (mapping)
    useEffect(() => {
        if (currentStep === 2 && excelHeaders.length > 0) {
            const initialMapping = {};
            STANDARD_FIELDS.forEach(field => {
                let matchedHeader = excelHeaders.find(h => h === field.key);
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
        }
    }, [currentStep, excelHeaders]);

    const handleFileSelect = (file) => {
        const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel" || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isExcel) {
            message.error("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls)");
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length === 0) {
                    message.error("ไฟล์ Excel ว่างเปล่า");
                    return;
                }

                const headers = jsonData[0]; 
                // raw: false ensures Excel dates are converted to strings rather than serial numbers
                const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false }); 
                
                setExcelHeaders(headers);
                setExcelData(rows);
                setSelectedFile(file);
                setCurrentStep(2); // move to mapping step
            } catch (err) {
                message.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
        
        return false; // Prevent automatic upload by Antd
    };

    const handleConfirm = () => {
        onConfirm(mapping, importType === 'duty', selectedFile, excelData);
    };

    const isDuty = importType === 'duty';
    const missingRequired = STANDARD_FIELDS.filter(f => f.required && !mapping[f.key] && !(isDuty && f.key === "ชื่องาน"));
    const isMappingValid = missingRequired.length === 0;

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="flex flex-col gap-6 py-8">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-foreground">คุณต้องการนำเข้ากำหนดการรูปแบบใด?</h3>
                            <p className="text-muted-foreground text-sm">เลือกรุปแบบที่ตรงกับข้อมูลในไฟล์ Excel ของคุณ</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => { setImportType('general'); setCurrentStep(1); }}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-secondary transition-all text-center group"
                            >
                                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 text-primary transition-colors">
                                    <CalendarDays className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground text-base mb-1">กำหนดการทั่วไป</h4>
                                    <p className="text-xs text-muted-foreground">นำเข้าข้อมูลปกติ (ต้องมีชื่องานและวันที่)</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => { setImportType('duty'); setCurrentStep(1); }}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-secondary transition-all text-center group"
                            >
                                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 text-primary transition-colors">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground text-base mb-1">การเข้าเวร</h4>
                                    <p className="text-xs text-muted-foreground">ระบบจะเติมค่าเริ่มต้นให้โดยอัตโนมัติ<br/>(การเข้าเวร, 08:30-16:30)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="flex flex-col gap-4 py-8">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-foreground">อัปโหลดไฟล์ Excel</h3>
                            <p className="text-muted-foreground text-sm">
                                รูปแบบที่เลือก: <span className="font-semibold text-primary">{importType === 'duty' ? "การเข้าเวร" : "กำหนดการทั่วไป"}</span>
                            </p>
                        </div>
                        
                        <Dragger
                            accept=".xlsx,.xls"
                            beforeUpload={handleFileSelect}
                            showUploadList={false}
                            className="bg-card hover:bg-secondary/50 border-border"
                        >
                            <p className="ant-upload-drag-icon flex justify-center mb-4 text-primary">
                                <Inbox className="w-12 h-12" />
                            </p>
                            <p className="ant-upload-text text-foreground font-medium mb-1">คลิก หรือ ลากไฟล์ Excel มาวางที่นี่</p>
                            <p className="ant-upload-hint text-muted-foreground text-sm">
                                รองรับไฟล์ .xlsx หรือ .xls เท่านั้น
                            </p>
                        </Dragger>

                        <div className="flex justify-start mt-4">
                            <Button onClick={() => setCurrentStep(0)}>ย้อนกลับ</Button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col gap-4 py-4">
                        <Alert 
                            type="info" 
                            message={`ไฟล์: ${selectedFile?.name}`} 
                            description="กรุณาจับคู่คอลัมน์จากไฟล์ Excel ให้ตรงกับข้อมูลที่ระบบต้องการ" 
                            showIcon 
                        />
                        {isDuty && (
                            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-sm text-foreground">
                                <span className="font-semibold">โหมดการเข้าเวร:</span> ระบบจะใช้ค่าเริ่มต้นสำหรับชื่องาน, ประเภท และเวลา หากไม่ได้จับคู่ไว้
                            </div>
                        )}

                        <div className="border border-border rounded-lg overflow-hidden mt-2">
                            <div className="grid grid-cols-[3fr_4fr_3fr] bg-secondary/50 p-3 border-b border-border gap-4">
                                <div className="font-semibold text-sm">ข้อมูลที่ระบบต้องการ</div>
                                <div className="font-semibold text-sm">คอลัมน์ในไฟล์ Excel</div>
                                <div className="font-semibold text-sm">ตัวอย่างข้อมูล</div>
                            </div>
                            
                            <div className="flex flex-col max-h-[400px] overflow-y-auto p-1">
                                {STANDARD_FIELDS.map((field) => {
                                    const mappedHeader = mapping[field.key];
                                    
                                    // Calculate sample value
                                    let sampleValue = "-";
                                    let isAutoFilled = false;
                                    
                                    if (mappedHeader && excelData.length > 0) {
                                        const rawVal = excelData[0][mappedHeader];
                                        sampleValue = rawVal !== undefined ? String(rawVal) : "-";
                                    } else if (isDuty) {
                                        if (field.key === "ชื่องาน") { sampleValue = "การเข้าเวร"; isAutoFilled = true; }
                                        else if (field.key === "ประเภท") { sampleValue = "เวร"; isAutoFilled = true; }
                                        else if (field.key === "เวลาเริ่ม") { sampleValue = "08:30"; isAutoFilled = true; }
                                        else if (field.key === "เวลาสิ้นสุด") { sampleValue = "16:30"; isAutoFilled = true; }
                                    }
                                    
                                    return (
                                        <div key={field.key} className="grid grid-cols-[3fr_4fr_3fr] items-center gap-4 p-2 hover:bg-secondary/20 rounded-md transition-colors border-b border-border/40 last:border-0">
                                            <div className="text-sm">
                                                <span className={field.required ? "font-medium text-foreground" : "text-muted-foreground"}>
                                                    {field.label}
                                                </span>
                                                {field.required && !isAutoFilled && <span className="text-destructive ml-1">*</span>}
                                                {isAutoFilled && <span className="text-primary text-xs ml-2">(Auto)</span>}
                                            </div>
                                            <div>
                                                <Select
                                                    allowClear
                                                    placeholder="-- ไม่ระบุ --"
                                                    style={{ width: "100%" }}
                                                    value={mapping[field.key] || undefined}
                                                    onChange={(val) => setMapping(prev => ({...prev, [field.key]: val}))}
                                                    options={excelHeaders.map(h => ({ value: h, label: h }))}
                                                />
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate" title={sampleValue}>
                                                {isAutoFilled && !mappedHeader ? (
                                                    <span className="text-primary/80 italic">{sampleValue}</span>
                                                ) : (
                                                    sampleValue
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {!isMappingValid && (
                            <div className="text-destructive text-sm mt-2">
                                * กรุณาจับคู่ข้อมูลที่จำเป็นให้ครบถ้วน: {missingRequired.map(f => f.label).join(", ")}
                            </div>
                        )}

                        <div className="flex justify-between mt-4 pt-4 border-t border-border">
                            <Button onClick={() => { setSelectedFile(null); setCurrentStep(1); }} disabled={isProcessing}>
                                ย้อนกลับ
                            </Button>
                            <div className="flex gap-2">
                                <Button onClick={onClose} disabled={isProcessing}>ยกเลิก</Button>
                                <Button 
                                    type="primary" 
                                    onClick={handleConfirm} 
                                    disabled={!isMappingValid || isProcessing}
                                    loading={isProcessing}
                                >
                                    ยืนยันและนำเข้า
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            title="ตัวช่วยนำเข้าข้อมูล (Excel Import Wizard)"
            open={isOpen}
            onCancel={!isProcessing ? onClose : undefined}
            maskClosable={false}
            footer={null}
            width={700}
        >
            <div className="mt-6">
                <Steps
                    current={currentStep}
                    items={[
                        { title: 'เลือกรูปแบบ' },
                        { title: 'อัปโหลดไฟล์' },
                        { title: 'จับคู่ข้อมูล' },
                    ]}
                    className="mb-6"
                />
                
                {renderStepContent()}
            </div>
        </Modal>
    );
}
