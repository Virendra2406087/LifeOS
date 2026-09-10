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

  // Full-page redirect — must include a Clerk session token as a query
  // param since a browser navigation can't carry an Authorization header.
  connectUrl: async () => {
    const token = await window.Clerk?.session?.getToken();
    return `${api.defaults.baseURL}/gmail/auth?token=${token}`;
  },
};

export default gmailService;