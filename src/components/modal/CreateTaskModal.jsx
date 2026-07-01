import { Modal, Form, Input, Select, DatePicker, Button } from "antd";
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
            title="เพิ่มกำหนดการใหม่"
            onCancel={onClose}
            footer={null}
            width={800}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={async (values) => {
                    const payload = {
                        title: values.title.trim(),
                        type_id: values.type_id,
                        description: values.description?.trim() || "",
                        start_time:
                            values.dateRange[0].toISOString(),
                        end_time:
                            values.dateRange[1].toISOString(),
                        participant_ids:
                            values.participants || [],
                    };

                    await handleCreateTask(payload);
                }}
                initialValues={{
                    title: "",
                    description: "",
                    participants: [],
                }}
            >
                <Form.Item
                    label="ชื่องาน"
                    name="title"
                    rules={[
                        {
                            required: true,
                            message: "กรุณากรอกชื่องาน",
                        },
                        {
                            max: 100,
                            message:
                                "ชื่องานต้องไม่เกิน 100 ตัวอักษร",
                        },
                        {
                            validator: (_, value) => {
                                if (
                                    !value ||
                                    value.trim().length > 0
                                ) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(
                                    new Error(
                                        "ชื่องานต้องไม่เป็นค่าว่าง"
                                    )
                                );
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder="เช่น ประชุมทีม"
                        maxLength={100}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label="ประเภทงาน"
                    name="type_id"
                    rules={[
                        {
                            required: true,
                            message: "กรุณาเลือกประเภทงาน",
                        },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder="เลือกประเภทงาน"
                        optionFilterProp="label"
                        options={taskTypes.map((type) => ({
                            value: type.id,
                            label: type.name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="ช่วงเวลา"
                    name="dateRange"
                    rules={[
                        {
                            required: true,
                            message:
                                "กรุณาเลือกวันและเวลา",
                        },
                        {
                            validator: (_, value) => {
                                if (!value) {
                                    return Promise.resolve();
                                }

                                const [start, end] =
                                    value;

                                if (
                                    end.isAfter(start)
                                ) {
                                    return Promise.resolve();
                                }

                                return Promise.reject(
                                    new Error(
                                        "วันสิ้นสุดต้องมากกว่าวันเริ่มต้น"
                                    )
                                );
                            },
                        },
                    ]}
                >
                    <RangePicker
                        className="w-full"
                        showTime={{
                            format: "HH:mm",
                        }}
                        format="DD/MM/YYYY HH:mm"
                        placeholder={[
                            "วันเริ่มต้น",
                            "วันสิ้นสุด",
                        ]}
                        disabledDate={(current) =>
                            current &&
                            current <
                            dayjs().startOf("day")
                        }
                    />
                </Form.Item>

                <Form.Item
                    label="ผู้เข้าร่วม"
                    name="participants"
                >
                    <Select
                        mode="multiple"
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        placeholder="เลือกผู้เข้าร่วม"
                        options={participants.map(
                            (participant) => ({
                                value: participant.id,
                                label: participant.name,
                            })
                        )}
                    />
                </Form.Item>

                <Form.Item
                    label="รายละเอียด"
                    name="description"
                    rules={[
                        {
                            max: 500,
                            message:
                                "รายละเอียดต้องไม่เกิน 500 ตัวอักษร",
                        },
                    ]}
                >
                    <TextArea
                        rows={4}
                        maxLength={500}
                        showCount
                        placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    />
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        ยกเลิก
                    </Button>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                    >
                        บันทึก
                    </Button>
                </div>
            </Form>
        </Modal>);
}

export default CreateTaskModal;