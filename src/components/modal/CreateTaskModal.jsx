import {
    Modal, Form, Input, Select, DatePicker, Button, Row, Col, Divider
} from "antd";

import {
    FileTextOutlined,
    TagsOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    AlignLeftOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import { useRef, useState } from "react";
import { unwrap } from "../../utils/unwrap";
import { fetchAvailableParticipants } from "../../api/tasks";
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function CreateTaskModal({
    open,
    form,
    taskTypes,
    participants,
    setParticipants,
    isSubmitting,
    handleCreateTask,
    onClose,
}) {

    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const debounceRef = useRef(null);

    const dateRange = Form.useWatch("dateRange", form);

    // 🟢 SMART FETCH (clean + safe + debounce)
    const handleDateChange = (value) => {
        if (!value || !fetchAvailableParticipants) return;

        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                setLoadingParticipants(true);

                const [start, end] = value;

                const data = await fetchAvailableParticipants(
                    start.toISOString(),
                    end.toISOString()
                );

                setParticipants?.(data);
            } catch (err) {
                console.error("fetch participants failed:", err);
            } finally {
                setLoadingParticipants(false);
            }
        }, 300);
    };

    const safeParticipants = Array.isArray(participants) ? participants : [];
    const safeTaskTypes = unwrap(taskTypes) || [];

    return (
        <Modal
            open={open}
            title={<span className="text-base font-semibold">เพิ่มกำหนดการใหม่</span>}
            onCancel={onClose}
            footer={null}
            width={720}
            destroyOnHidden
        >
            <Divider className="!mt-3 !mb-5" />

            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={async (values) => {
                    const payload = {
                        title: values.title.trim(),
                        type_id: values.type_id,
                        description: values.description?.trim() || "",
                        start_time: values.dateRange?.[0]?.toISOString(),
                        end_time: values.dateRange?.[1]?.toISOString(),
                        participant_ids: values.participants || [],
                    };

                    await handleCreateTask(payload);
                }}
                initialValues={{
                    title: "",
                    description: "",
                    participants: [],
                }}
            >

                {/* TITLE */}
                <Form.Item
                    label={<span className="flex items-center gap-1.5 font-medium">
                        <FileTextOutlined className="text-gray-400" /> ชื่องาน
                    </span>}
                    name="title"
                    rules={[
                        { required: true, message: "กรุณากรอกชื่องาน" },
                        { max: 100 },
                        {
                            validator: (_, value) => {
                                if (!value || value.trim()) return Promise.resolve();
                                return Promise.reject(new Error("ชื่องานต้องไม่เป็นค่าว่าง"));
                            },
                        },
                    ]}
                >
                    <Input size="large" placeholder="เช่น ประชุมทีม" />
                </Form.Item>

                {/* RANGE */}
                <Form.Item
                    label={<span><ClockCircleOutlined /> ช่วงเวลา</span>}
                    name="dateRange"
                    rules={[{ required: true }]}
                >
                    <RangePicker
                        size="large"
                        className="w-full"
                        showTime
                        onChange={handleDateChange}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={["เริ่ม", "สิ้นสุด"]}
                        disabledDate={(current) =>
                            current && current < dayjs().startOf("day")
                        }
                    />
                </Form.Item>

                {/* TYPE + PARTICIPANT */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label={<span><TagsOutlined /> ประเภทงาน</span>}
                            name="type_id"
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                options={safeTaskTypes.map(t => ({
                                    value: t.id,
                                    label: t.name
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label={<span><TeamOutlined /> ผู้เข้าร่วม</span>}
                            name="participants"
                        >
                            <Select
                                size="large"
                                mode="multiple"
                                placeholder="เลือกผู้เข้าร่วม"
                                loading={loadingParticipants}
                                disabled={!dateRange}
                                options={safeParticipants.map(p => ({
                                    value: p.id,
                                    label: p.name
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* DESCRIPTION */}
                <Form.Item
                    label={<span><AlignLeftOutlined /> รายละเอียด</span>}
                    name="description"
                >
                    <TextArea rows={4} maxLength={500} />
                </Form.Item>

                <Divider />

                <div className="flex justify-end gap-2">
                    <Button onClick={onClose}>ยกเลิก</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        บันทึก
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

export default CreateTaskModal;