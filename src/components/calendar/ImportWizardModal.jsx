import { useEffect, useRef, useState } from "react";
import { Modal, Select, Button, Steps, Alert, Upload as AntdUpload, App } from "antd";
import { CalendarDays, ShieldAlert, Inbox } from "lucide-react";
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
    const { message } = App.useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const [importType, setImportType] = useState(null); // 'general' | 'duty'
    const [selectedFile, setSelectedFile] = useState(null);
    const [excelHeaders, setExcelHeaders] = useState([]);
    const [excelData, setExcelData] = useState([]);
    const [mapping, setMapping] = useState({});
    
    // For Step 4 (Preview)
    const [previewValidRows, setPreviewValidRows] = useState([]);
    const [previewInvalidRows, setPreviewInvalidRows] = useState([]);

    // The modal is only ever mounted while isOpen is true (App.jsx unmounts
    // it on close) — if the user closes it while a FileReader is still
    // parsing a large sheet, this stops the eventual onload from calling
    // setState on an already-unmounted component.
    const isMountedRef = useRef(true);
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Best-effort auto-map: match each standard field to an Excel header by
    // exact name, falling back to a substring match either direction.
    const buildAutoMapping = (headers) => {
        const initialMapping = {};
        STANDARD_FIELDS.forEach(field => {
            let matchedHeader = headers.find(h => h === field.key);
            if (!matchedHeader) {
                matchedHeader = headers.find(h =>
                    h.includes(field.key) || field.key.includes(h)
                );
            }
            if (matchedHeader) {
                initialMapping[field.key] = matchedHeader;
            }
        });
        return initialMapping;
    };

    const handleFileSelect = (file) => {
        const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel" || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isExcel) {
            message.error("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls)");
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (!isMountedRef.current) return;

            try {
                const data = new Uint8Array(e.target.result);
                // Use cellDates to convert Excel date serials to proper JS Date objects
                const workbook = XLSX.read(data, { type: "array", cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length === 0) {
                    message.error("ไฟล์ Excel ว่างเปล่า");
                    return;
                }

                const headers = jsonData[0]; 
                // raw: true + cellDates preserves dates as JS Dates
                const rows = XLSX.utils.sheet_to_json(worksheet, { raw: true }); 
                
                setExcelHeaders(headers);
                setExcelData(rows);
                setSelectedFile(file);
                setMapping(buildAutoMapping(headers));
                setCurrentStep(2); // move to mapping step
            } catch (err) {
                message.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
        
        return false; // Prevent automatic upload by Antd
    };

    const handlePreview = () => {
        // Calculate which rows are valid vs invalid based on current mapping
        const valid = [];
        const invalid = [];
        
        excelData.forEach((row, index) => {
            let title = mapping["ชื่องาน"] ? row[mapping["ชื่องาน"]] : undefined;
            let dateVal = mapping["วันที่"] ? row[mapping["วันที่"]] : undefined;
            
            if (isDuty) {
                // Blank mapped cells ("") must default the same way an
                // entirely-unmapped column does — otherwise this preview
                // disagrees with useExcelImport's actual submit-time
                // defaulting (`!newRow["ชื่องาน"]`, which treats "" and
                // undefined the same) and rows that would succeed get
                // shown here as invalid and dropped from the import.
                if (title === undefined || String(title).trim() === "") title = "การเข้าเวร";
            }

            let missingReason = [];
            if (title === undefined || String(title).trim() === "") missingReason.push("ขาดชื่องาน");
            if (dateVal === undefined || String(dateVal).trim() === "") missingReason.push("ขาดวันที่");
            
            const displayTitle = title || "ไม่มีชื่องาน";
            const displayDate = dateVal !== undefined ? String(dateVal) : "ไม่มีวันที่";
            
            const extraData = [];
            STANDARD_FIELDS.forEach(field => {
                if (field.key !== "ชื่องาน" && field.key !== "วันที่") {
                    const mappedHeader = mapping[field.key];
                    let val = mappedHeader ? row[mappedHeader] : undefined;
                    
                    const isBlank = val === undefined || String(val).trim() === "";
                    if (isDuty) {
                        if (field.key === "ประเภท" && isBlank) val = "เวร";
                        if (field.key === "เวลาเริ่ม" && isBlank) val = "08:30";
                        if (field.key === "เวลาสิ้นสุด" && isBlank) val = "16:30";
                    }
                    
                    if (val !== undefined && String(val).trim() !== "") {
                        extraData.push({ label: field.label.split(" ")[0], value: String(val) });
                    }
                }
            });
            
            if (missingReason.length === 0) {
                valid.push({ id: index, index: index + 2, title: displayTitle, date: displayDate, extra: extraData });
            } else {
                invalid.push({ id: index, index: index + 2, title: displayTitle, date: displayDate, extra: extraData, reason: missingReason.join(", ") });
            }
        });
        
        setPreviewValidRows(valid);
        setPreviewInvalidRows(invalid);
        setCurrentStep(3);
    };

    const toggleToInvalid = (r) => {
        setPreviewValidRows(prev => prev.filter(item => item.id !== r.id));
        setPreviewInvalidRows(prev => {
            const next = [{...r, reason: "ถูกคัดออกโดยผู้ใช้", isManual: true}, ...prev];
            return next.sort((a, b) => a.id - b.id);
        });
    };

    const toggleToValid = (r) => {
        setPreviewInvalidRows(prev => prev.filter(item => item.id !== r.id));
        setPreviewValidRows(prev => {
            const restored = {...r};
            delete restored.reason;
            delete restored.isManual;
            const next = [...prev, restored];
            return next.sort((a, b) => a.id - b.id);
        });
    };

    const handleConfirm = () => {
        const validIds = new Set(previewValidRows.map(r => r.id));
        const finalExcelData = excelData.filter((_, index) => validIds.has(index));
        onConfirm(mapping, importType === 'duty', selectedFile, finalExcelData);
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
                                className="flex flex-col items-center gap-3 p-6 rounded-[var(--radius-xl)] border-2 border-border bg-card hover:border-primary hover:bg-secondary transition-all text-center group"
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
                                className="flex flex-col items-center gap-3 p-6 rounded-[var(--radius-xl)] border-2 border-border bg-card hover:border-primary hover:bg-secondary transition-all text-center group"
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
                            <div className="bg-primary/10 p-3 rounded-[var(--radius-lg)] border border-primary/20 text-sm text-foreground">
                                <span className="font-semibold">โหมดการเข้าเวร:</span> ระบบจะใช้ค่าเริ่มต้นสำหรับชื่องาน, ประเภท และเวลา หากไม่ได้จับคู่ไว้
                            </div>
                        )}

                        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden mt-2">
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
                                        <div key={field.key} className="grid grid-cols-[3fr_4fr_3fr] items-center gap-4 p-2 hover:bg-secondary/20 rounded-[var(--radius-md)] transition-colors border-b border-border/40 last:border-0">
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
                                    onClick={handlePreview} 
                                    disabled={!isMappingValid || isProcessing}
                                >
                                    ถัดไป
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-foreground">สรุปข้อมูลที่จะนำเข้า</h3>
                            <p className="text-muted-foreground text-sm">ตรวจสอบข้อมูลก่อนกดยืนยัน</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Valid Rows */}
                            <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden flex flex-col h-[350px]">
                                <div className="bg-emerald-500/10 p-3 border-b border-emerald-500/20 text-emerald-600 flex justify-between items-center">
                                    <span className="font-semibold">แถวที่ผ่าน (นำเข้าได้)</span>
                                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{previewValidRows.length}</span>
                                </div>
                                <div className="overflow-y-auto p-2 flex-1 bg-card">
                                    {previewValidRows.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">ไม่มีข้อมูลที่ผ่าน</div>
                                    ) : (
                                        <ul className="space-y-1">
                                            {previewValidRows.map(r => (
                                                <li key={r.id} className="group text-xs p-2 rounded hover:bg-secondary border border-transparent hover:border-border transition-colors flex items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-foreground truncate">{r.title}</div>
                                                        <div className="text-muted-foreground truncate mb-1">บ. {r.index} | {r.date}</div>
                                                        {r.extra && r.extra.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {r.extra.map((ex, i) => (
                                                                    <span key={i} className="bg-background text-[10px] px-1.5 py-0.5 rounded text-muted-foreground border border-border flex items-center">
                                                                        <span className="opacity-70 mr-1">{ex.label}:</span>
                                                                        <span className="text-foreground truncate max-w-[100px]">{ex.value}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleToInvalid(r)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shrink-0"
                                                        title="คัดออก"
                                                    >
                                                        คัดออก
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            
                            {/* Invalid Rows */}
                            <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden flex flex-col h-[350px]">
                                <div className="bg-destructive/10 p-3 border-b border-destructive/20 text-destructive flex justify-between items-center">
                                    <span className="font-semibold">แถวที่ไม่ผ่าน (ถูกข้าม)</span>
                                    <span className="bg-destructive text-white px-2 py-0.5 rounded-full text-xs font-bold">{previewInvalidRows.length}</span>
                                </div>
                                <div className="overflow-y-auto p-2 flex-1 bg-card">
                                    {previewInvalidRows.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">ไม่มีข้อมูลที่ไม่ผ่าน</div>
                                    ) : (
                                        <ul className="space-y-1">
                                            {previewInvalidRows.map(r => (
                                                <li key={r.id} className="group text-xs p-2 rounded hover:bg-destructive/5 border border-transparent hover:border-destructive/10 transition-colors flex items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-destructive truncate">{r.title}</div>
                                                        <div className="text-muted-foreground truncate flex justify-between mb-1">
                                                            <span>บ. {r.index} | {r.date}</span>
                                                            <span className="text-destructive font-medium shrink-0 ml-2">({r.reason})</span>
                                                        </div>
                                                        {r.extra && r.extra.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {r.extra.map((ex, i) => (
                                                                    <span key={i} className="bg-background text-[10px] px-1.5 py-0.5 rounded text-muted-foreground border border-border flex items-center opacity-80">
                                                                        <span className="mr-1">{ex.label}:</span>
                                                                        <span className="truncate max-w-[100px]">{ex.value}</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {r.isManual && (
                                                        <button 
                                                            onClick={() => toggleToValid(r)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shrink-0"
                                                            title="นำกลับเข้า"
                                                        >
                                                            นำกลับ
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {previewValidRows.length === 0 && (
                            <Alert type="warning" message="ไม่มีข้อมูลที่สามารถนำเข้าได้เลย กรุณาย้อนกลับไปตรวจสอบการจับคู่ หรือตรวจสอบไฟล์ Excel ของคุณ" showIcon className="mt-2" />
                        )}

                        <div className="flex justify-between mt-4 pt-4 border-t border-border">
                            <Button onClick={() => setCurrentStep(2)} disabled={isProcessing}>
                                ย้อนกลับ
                            </Button>
                            <div className="flex gap-2">
                                <Button onClick={onClose} disabled={isProcessing}>ยกเลิก</Button>
                                <Button 
                                    type="primary" 
                                    onClick={handleConfirm} 
                                    disabled={previewValidRows.length === 0 || isProcessing}
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
            centered
        >
            <div className="mt-6">
                <Steps
                    current={currentStep}
                    items={[
                        { title: 'เลือกรูปแบบ' },
                        { title: 'อัปโหลดไฟล์' },
                        { title: 'จับคู่ข้อมูล' },
                        { title: 'ตรวจสอบ' },
                    ]}
                    className="mb-6"
                />
                
                {renderStepContent()}
            </div>
        </Modal>
    );
}
