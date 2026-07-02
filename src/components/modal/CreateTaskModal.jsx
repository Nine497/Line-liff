import { Modal, Form, Input, Select, DatePicker, Button, Row, Col, Divider } from "antd";
import {
    FileTextOutlined,
    TagsOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    AlignLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

function CreateTaskModal({
    open,
    form,
    taskTypes,
    participants,
    isSubmitting,
    handleCreateTask,
    onClose,
}) {
    return (
        <Modal
            open={open}
            title={
                <span className="text-base font-semibold">
                    เพิ่มกำหนดการใหม่
                </span>
            }
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
                        start_time: values.dateRange[0].toISOString(),
                        end_time: values.dateRange[1].toISOString(),
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
                {/* ชื่องาน — เต็มความกว้าง เพราะเป็นข้อมูลหลัก */}
                <Form.Item
                    label={
                        <span className="flex items-center gap-1.5 font-medium">
                            <FileTextOutlined className="text-gray-400" />
                            ชื่องาน
                        </span>
                    }
                    name="title"
                    rules={[
                        { required: true, message: "กรุณากรอกชื่องาน" },
                        { max: 100, message: "ชื่องานต้องไม่เกิน 100 ตัวอักษร" },
                        {
                            validator: (_, value) => {
                                if (!value || value.trim().length > 0) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(
                                    new Error("ชื่องานต้องไม่เป็นค่าว่าง")
                                );
                            },
                        },
                    ]}
                >
                    <Input
                        size="large"
                        placeholder="เช่น ประชุมทีม"
                        maxLength={100}
                        showCount
                    />
                </Form.Item>

                {/* ประเภทงาน + ผู้เข้าร่วม — จับคู่กัน 2 คอลัมน์ ใช้พื้นที่คุ้มขึ้น */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <span className="flex items-center gap-1.5 font-medium">
                                    <TagsOutlined className="text-gray-400" />
                                    ประเภทงาน
                                </span>
                            }
                            name="type_id"
                            rules={[
                                { required: true, message: "กรุณาเลือกประเภทงาน" },
                            ]}
                        >
                            <Select
                                size="large"
                                showSearch
                                placeholder="เลือกประเภทงาน"
                                optionFilterProp="label"
                                options={taskTypes.map((type) => ({
                                    value: type.id,
                                    label: type.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label={
                                <span className="flex items-center gap-1.5 font-medium">
                                    <TeamOutlined className="text-gray-400" />
                                    ผู้เข้าร่วม
                                </span>
                            }
                            name="participants"
                        >
                            <Select
                                size="large"
                                mode="multiple"
                                showSearch
                                allowClear
                                maxTagCount="responsive"
                                optionFilterProp="label"
                                placeholder="เลือกผู้เข้าร่วม"
                                options={participants.map((participant) => ({
                                    value: participant.id,
                                    label: participant.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ช่วงเวลา — เต็มความกว้าง เพราะเป็นข้อมูลสำคัญรองจากชื่องาน */}
                <Form.Item
                    label={
                        <span className="flex items-center gap-1.5 font-medium">
                            <ClockCircleOutlined className="text-gray-400" />
                            ช่วงเวลา
                        </span>
                    }
                    name="dateRange"
                    rules={[
                        { required: true, message: "กรุณาเลือกวันและเวลา" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const [start, end] = value;
                                if (end.isAfter(start)) return Promise.resolve();
                                return Promise.reject(
                                    new Error("วันสิ้นสุดต้องมากกว่าวันเริ่มต้น")
                                );
                            },
                        },
                    ]}
                >
                    <RangePicker
                        size="large"
                        className="w-full"
                        showTime={{ format: "HH:mm" }}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                        disabledDate={(current) =>
                            current && current < dayjs().startOf("day")
                        }
                    />
                </Form.Item>

                {/* รายละเอียด */}
                <Form.Item
                    label={
                        <span className="flex items-center gap-1.5 font-medium">
                            <AlignLeftOutlined className="text-gray-400" />
                            รายละเอียด
                        </span>
                    }
                    name="description"
                    rules={[
                        { max: 500, message: "รายละเอียดต้องไม่เกิน 500 ตัวอักษร" },
                    ]}
                >
                    <TextArea
                        rows={4}
                        maxLength={500}
                        showCount
                        placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    />
                </Form.Item>

                <Divider className="!my-4" />

                <div className="flex justify-end gap-2">
                    <Button
                        size="large"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        ยกเลิก
                    </Button>

                    <Button
                        size="large"
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                    >
                        บันทึก
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

export default CreateTaskModal;