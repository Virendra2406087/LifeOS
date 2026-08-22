import api from "../app/api";

const gmailService = {
  getStatus: async () => {
    const { data } = await api.get("/gmail/status");
    return data;
  },

  getSmartTasks: async () => {
    const { data } = await api.get("/gmail/smart-tasks");
    return data;
  },

  getMeetings: async () => {
    const { data } = await api.get("/gmail/meetings");
    return data;
  },

  getAIMeetings: async () => {
    const { data } = await api.get("/gmail/ai-meetings");
    return data;
  },
  addMeetingFromEmail: async (messageId) => {
    const { data } = await api.post(`/gmail/add-meeting/${messageId}`);
    return data;
  },

  // Full-page redirect — must include the JWT as a query param since a
  // browser navigation can't carry an Authorization header.
  connectUrl: () =>
    `${api.defaults.baseURL}/gmail/auth?token=${localStorage.getItem("token")}`,
};



export default gmailService;