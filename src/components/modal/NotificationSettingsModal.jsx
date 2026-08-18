import { useEffect } from "react";
import { Modal, Switch, TimePicker, InputNumber, Button, Spin, Form, QRCode, App as AntdApp } from "antd";
import { Bell, AlertTriangle, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";

const DaySelector = ({ value = [], onChange }) => {
    return (
        <div className="flex gap-1.5 justify-between w-full mt-1">
            {[
                { label: 'อา', value: 0 },
                { label: 'จ', value: 1 },
                { label: 'อ', value: 2 },
                { label: 'พ', value: 3 },
                { label: 'พฤ', value: 4 },
                { label: 'ศ', value: 5 },
                { label: 'ส', value: 6 }
            ].map(day => {
                const isSelected = (value || []).includes(day.value);
                return (
                    <Button
                        key={day.value}
                        type={isSelected ? 'primary' : 'default'}
                        className={`flex-1 min-w-0 h-9 p-0 rounded-lg text-sm transition-all ${
                            isSelected
                                ? 'bg-slate-900 text-white border-transparent'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                        onClick={() => {
                            const current = value || [];
                            const next = isSelected
                                ? current.filter(v => v !== day.value)
                                : [...current, day.value].sort();
                            onChange?.(next);
                        }}
                    >
                        {day.label}
                    </Button>
                );
            })}
        </div>
    );
};

export default function NotificationSettingsModal({ open, onClose }) {
    const [form] = Form.useForm();
    const { message } = AntdApp.useApp();
    const { settings, isLoading, updateSettings, isSaving } = useNotificationSettings();

    useEffect(() => {
        if (open && settings) {
            form.setFieldsValue({
                enabled: settings.enabled ?? false,
                remind_time: settings.remind_time ? dayjs(settings.remind_time, "HH:mm:ss") : dayjs("07:00", "HH:mm"),
                days_of_week: settings.days_of_week || [1, 2, 3, 4, 5], // Default to Mon-Fri if not set
                lead_time_hours: settings.lead_time_hours ?? 24,
            });
        }
    }, [open, settings, form]);

    const handleSave = async (values) => {
        try {
            const payload = {
                enabled: values.enabled,
                remind_time: values.remind_time ? values.remind_time.format("HH:mm") : "07:00",
                days_of_week: (values.days_of_week && values.days_of_week.length > 0)
                    ? values.days_of_week
                    : [1, 2, 3, 4, 5],
                lead_time_hours: values.lead_time_hours ?? 24,
            };

            await updateSettings(payload);
            message.success("บันทึกการตั้งค่าแจ้งเตือนเรียบร้อย");
            onClose();
        } catch (error) {
            console.error("Failed to save settings:", error);
            // Catch detailed backend message if available
            const errorMsg = error?.response?.data?.message || error?.message || "บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่";
            message.error(errorMsg);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            destroyOnHidden
            centered
            className="liff-modal sm:max-w-[420px]"
            styles={{
                content: { padding: 0, borderRadius: "24px", overflow: "hidden", background: "transparent", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" },
                header: { display: "none" }
            }}
        >
            <div className="relative bg-white flex flex-col overflow-hidden border border-slate-100 rounded-3xl">
                <Form
                    form={form}
                    layout="horizontal"
                    onFinish={handleSave}
                    preserve={true}
                    initialValues={{ enabled: false, days_of_week: [1, 2, 3, 4, 5], lead_time_hours: 24 }}
                >
                    <div className="px-6 py-5 border-b border-slate-100 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                                    <Bell className="h-5 w-5 text-slate-800" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">การแจ้งเตือน (LINE)</h3>
                            </div>
                            <Form.Item name="enabled" valuePropName="checked" noStyle>
                                <Switch className="scale-110" />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 bg-white relative z-20">
                        {isLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Spin size="large" />
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {settings?.line_oa && settings.line_bound && (
                                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col items-center text-center gap-3">
                                        <div className="flex items-center gap-2 text-amber-700">
                                            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                                            <span className="text-sm font-bold">ยังไม่ได้แอดบอทไลน์ — จะไม่ได้รับการแจ้งเตือน</span>
                                        </div>
                                        <QRCode
                                            value={settings.line_oa.add_friend_url}
                                            size={140}
                                            bordered
                                            className="!bg-white"
                                        />
                                        <div className="text-xs text-slate-600">
                                            <div className="font-bold text-slate-800">{settings.line_oa.display_name}</div>
                                            <div>{settings.line_oa.basic_id}</div>
                                        </div>
                                        <Button
                                            icon={<ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />}
                                            href={settings.line_oa.add_friend_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-9 rounded-lg bg-[#06C755] border-none text-white hover:!bg-[#05b34c] hover:!text-white"
                                        >
                                            เพิ่มเพื่อนบอท
                                        </Button>
                                    </div>
                                )}

                                <Form.Item noStyle dependencies={['enabled']}>
                                    {({ getFieldValue }) => {
                                        const isEnabled = getFieldValue('enabled');
                                        
                                        return (
                                            <AnimatePresence>
                                                {isEnabled && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                                                        animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                                                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                                        transition={{ duration: 0.2 }}
                                                        className="mb-4"
                                                    >
                                                        <div className="rounded-xl border border-slate-100 p-1 divide-y divide-slate-50">
                                                            <div className="flex items-center justify-between p-3">
                                                                <span className="text-sm font-medium text-slate-700">เวลาส่งสรุปงาน</span>
                                                                <Form.Item
                                                                    name="remind_time"
                                                                    rules={[{ required: true, message: 'ระบุเวลา' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <TimePicker 
                                                                        format="HH:mm" 
                                                                        className="w-[100px] shadow-none" 
                                                                        minuteStep={15}
                                                                        allowClear={false}
                                                                    />
                                                                </Form.Item>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3">
                                                                <span className="text-sm font-medium text-slate-700">แจ้งเตือนล่วงหน้า</span>
                                                                <Form.Item
                                                                    name="lead_time_hours"
                                                                    rules={[{ required: true, message: 'ระบุจำนวนชั่วโมง' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <InputNumber
                                                                        min={1}
                                                                        max={720}
                                                                        addonAfter="ชม."
                                                                        className="w-[110px] shadow-none"
                                                                    />
                                                                </Form.Item>
                                                            </div>
                                                            <div className="flex flex-col gap-2 p-3">
                                                                <span className="text-sm font-medium text-slate-700">วันที่ต้องการแจ้งเตือน</span>
                                                                <Form.Item
                                                                    name="days_of_week"
                                                                    rules={[{ required: true, message: 'เลือกอย่างน้อย 1 วัน' }]}
                                                                    className="mb-0"
                                                                >
                                                                    <DaySelector />
                                                                </Form.Item>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        );
                                    }}
                                </Form.Item>

                                <div className="mt-4 flex justify-end gap-2">
                                    <Button 
                                        onClick={onClose} 
                                        className="h-10 rounded-lg px-5 border-slate-200 text-slate-600 bg-white"
                                        disabled={isSaving}
                                    >
                                        ปิด
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={isSaving}
                                        className="h-10 rounded-lg bg-slate-900 px-5 text-white shadow-none hover:bg-slate-800"
                                    >
                                        บันทึก
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </Form>
            </div>
        </Modal>
    );
}
