import API from "../app/api";

const BASE = "/whatsapp";

export const fetchReminders = async () => {
  try {
    const res = await API.get(`${BASE}/reminders`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Fetch reminders error:", error.response?.data || error.message);
    return { success: false, data: [] };
  }
};

export const createReminder = async (fields) => {
  const payload = {
    name: fields.name,
    phone: fields.phone,
    time: fields.time,
    message: fields.message,
    type: "Reminder",
  };

  try {
    const res = await API.post(`${BASE}/reminders`, payload);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Create reminder error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

export const sendReminder = async (id) => {
  try {
    const res = await API.post(`${BASE}/reminders/${id}/send`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Send reminder error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

export const updateReminderTime = async (id, newTimeISO) => {
  try {
    const res = await API.put(`${BASE}/reminders/${id}`, { time: newTimeISO });
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Update reminder error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

export const deleteReminder = async (id) => {
  try {
    await API.delete(`${BASE}/reminders/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Delete reminder error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};