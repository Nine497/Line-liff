import {
    Modal, Form, Input, Select, DatePicker, Button, Row, Col, Divider, message, AutoComplete
} from "antd";

import {
    FileText,
    Tags,
    Clock,
    Users,
    AlignLeft,
    MapPin,
} from "lucide-react";

import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { unwrap } from "../../utils/unwrap";
import { fetchAvailableParticipants } from "../../api/tasks";
import "./task-sheet.css";
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function CreateTaskModal({
    open,
    form,
    taskTypes,
    participants,
    isSubmitting,
    onSubmit,
    onClose,
}) {

    // Date-scoped participants for this modal only — null until a range is
    // picked and fetched, in which case `safeParticipants` below falls back
    // to the live app-wide `participants` prop (so it stays in sync even if
    // that list is still loading when the modal opens, instead of a stale
    // snapshot baked in at mount). Must not be shared with the app-wide
    // `participants` state itself (that also drives the day sidebar).
    const [availableParticipants, setAvailableParticipants] = useState(null);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const debounceRef = useRef(null);
    // Guards against an out-of-order response: if the user changes the date
    // range twice quickly, two fetches can be in flight and the first one
    // may resolve *after* the second — without this, its stale result would
    // silently overwrite the correct, more recent availability list.
    const requestSeqRef = useRef(0);

    const [locationOptions, setLocationOptions] = useState([]);
    const locationDebounceRef = useRef(null);

    useEffect(() => {
        return () => {
            clearTimeout(debounceRef.current);
            clearTimeout(locationDebounceRef.current);
        };
    }, []);

    const dateRange = Form.useWatch("dateRange", form);

    const handleLocationSearch = (value) => {
        if (!value) {
            setLocationOptions([]);
            return;
        }

        clearTimeout(locationDebounceRef.current);
        locationDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=th&accept-language=th`
                );
                const data = await res.json();
                
                const options = data.map((item) => ({
                    value: item.display_name,
                    label: item.display_name,
                }));
                setLocationOptions(options);
            } catch (err) {
                console.error("fetch location failed:", err);
            }
        }, 500);
    };

    // 🟢 SMART FETCH (clean + safe + debounce)
    const handleDateChange = (value) => {
        if (!value) return;

        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            const seq = ++requestSeqRef.current;

            try {
                setLoadingParticipants(true);

                const [start, end] = value;

                const data = await fetchAvailableParticipants(
                    start.toISOString(),
                    end.toISOString()
                );

                // A newer date-range change may have fired its own request
                // while this one was in flight — ignore this stale response.
                if (seq !== requestSeqRef.current) return;

                const nextAvailable = unwrap(data);
                setAvailableParticipants(nextAvailable);

                // The date range changed, so any already-selected participant
                // who is no longer in the available list must be dropped —
                // otherwise they'd stay silently selected despite now being busy.
                const availableIds = new Set(nextAvailable.map((p) => p.id));
                const currentlySelected = form.getFieldValue("participants") || [];
                const stillValid = currentlySelected.filter((id) => availableIds.has(id));

                if (stillValid.length !== currentlySelected.length) {
                    form.setFieldValue("participants", stillValid);
                    message.warning("ผู้เข้าร่วมบางคนถูกนำออกเนื่องจากติดภารกิจในช่วงเวลาที่เลือกใหม่");
                }
            } catch (err) {
                if (seq !== requestSeqRef.current) return;
                console.error("fetch participants failed:", err);
                message.error("โหลดรายชื่อผู้เข้าร่วมที่ว่างไม่สำเร็จ");
            } finally {
                if (seq === requestSeqRef.current) setLoadingParticipants(false);
            }
        }, 300);
    };

    const safeParticipants = dateRange
        ? (Array.isArray(availableParticipants) ? availableParticipants : [])
        : (Array.isArray(participants) ? participants : []);
    const safeTaskTypes = unwrap(taskTypes) || [];

    return (
        <Modal
            open={open}
            title={<span className="font-display text-base font-bold">เพิ่มกำหนดการใหม่</span>}
            onCancel={onClose}
            footer={null}
            width={720}
            rootClassName="task-sheet"
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
                        location: values.location?.trim() || "",
                    };

                    await onSubmit(payload);
                }}
                initialValues={{
                    title: "",
                    description: "",
                    participants: [],
                    location: "",
                }}
            >

                {/* TITLE */}
                <Form.Item
                    label={<span className="flex items-center gap-1.5 font-medium">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" /> ชื่องาน
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
                    label={<span className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> ช่วงเวลา
                    </span>}
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
                            label={<span className="flex items-center gap-1.5 font-medium">
                                <Tags className="h-3.5 w-3.5 text-muted-foreground" /> ประเภทงาน
                            </span>}
                            name="type_id"
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={safeTaskTypes.map(t => ({
                                    value: t.id,
                                    label: t.name
                                }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label={<span className="flex items-center gap-1.5 font-medium">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" /> ผู้เข้าร่วม
                            </span>}
                            name="participants"
                        >
                            <Select
                                size="large"
                                mode="multiple"
                                placeholder="เลือกผู้เข้าร่วม"
                                loading={loadingParticipants}
                                disabled={!dateRange}
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={safeParticipants.map(p => ({
                                    value: p.id,
                                    label: p.name
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* LOCATION */}
                <Form.Item
                    label={<span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> สถานที่ (Location)
                    </span>}
                    name="location"
                >
                    <AutoComplete
                        options={locationOptions}
                        onSearch={handleLocationSearch}
                        placeholder="ค้นหาสถานที่ หรือพิมพ์ระบุเอง..."
                        size="large"
                    />
                </Form.Item>

                {/* DESCRIPTION */}
                <Form.Item
                    label={<span className="flex items-center gap-1.5 font-medium">
                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" /> รายละเอียด
                    </span>}
                    name="description"
                >
                    <TextArea rows={4} maxLength={500} />
                </Form.Item>

                <Divider />

                <div className="flex justify-end gap-2">
                    <Button onClick={onClose}>ยกเลิก</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        บันทึกกำหนดการ
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

export default CreateTaskModal;