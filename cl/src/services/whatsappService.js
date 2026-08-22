import api from "../app/api";

const whatsappService = {
  getReminders: async () => {
    const { data } = await api.get("/whatsapp/reminders");
    return data;
  },

  createReminder: async (reminder) => {
    const { data } = await api.post("/whatsapp/reminders", reminder);
    return data;
  },

  deleteReminder: async (id) => {
    const { data } = await api.delete(`/whatsapp/reminders/${id}`);
    return data;
  },
};

export default whatsappService;