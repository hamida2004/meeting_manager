import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL = "https://meeting-manager-7nuo.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

// =====================================================
// AUTH
// =====================================================

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  requestReset: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// =====================================================
// USERS
// =====================================================

export const userAPI = {
  getAll: () => api.get("/users"),
  getOne: (id) => api.get(`/users/${id}`),
  toggleAdmin: (id_user) => api.patch("/users/toggle-admin", { id_user }),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// =====================================================
// COMMITTEES
// =====================================================

export const committeeAPI = {
  getAll: () => api.get("/committees"),
  getMine: () => api.get("/committees/mine"),
  getOne: (id) => api.get(`/committees/${id}`),
  create: (data) => api.post("/committees", data),
  update: (id, data) => api.patch(`/committees/${id}`, data),
  delete: (id) => api.delete(`/committees/${id}`),
  addMembers: (id, data) => api.post(`/committees/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/committees/${id}/members/${userId}`),
  changePresident: (id, data) => api.patch(`/committees/${id}/change-president`, data),
};

// =====================================================
// MEETINGS
// =====================================================

export const meetingAPI = {
  getMine: () => api.get("/meetings/mine"),
  getGrouped: () => api.get("/meetings/grouped"),
  getOne: (id) => api.get(`/meetings/${id}`),
  getMembers: (id) => api.get(`/meetings/${id}/members`),
  create: (data) => api.post("/meetings", {
    ...data,
    timing: new Date(data.timing).toISOString(),
  }),
  edit: (id, data) => api.patch(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  changeStatus: (id, data) => api.patch(`/meetings/${id}/status`, data),
  changeVotingState: (id, data) => api.patch(`/meetings/${id}/voting-state`, data),
  addMembers: (id, data) => api.post(`/meetings/${id}/members`, data),
  addReporter: (id, data) => api.patch(`/meetings/${id}/reporter`, data),
  confirmAttendance: (id) => api.patch(`/meetings/${id}/confirm`),
  validateAttendance: (id, memberId) => api.patch(`/meetings/${id}/validate/${memberId}`),
};

// =====================================================
// AGENDA
// =====================================================
export const agendaAPI = {
  getByMeeting: (meetingId) => api.get(`/agenda/meeting/${meetingId}`),
  addPoint: (meetingId, data) => api.post(`/agenda/meeting/${meetingId}/points`, data),
  approve: (id) => api.patch(`/agenda/points/${id}/approve`),
  reject: (id) => api.patch(`/agenda/points/${id}/reject`),
  openVoting: (id) => api.patch(`/agenda/points/${id}/open`),
  closeVoting: (id) => api.patch(`/agenda/points/${id}/close`),
  deletePoint: (id) => api.delete(`/agenda/points/${id}`),
};

// =====================================================
// VOTES
// =====================================================
export const voteAPI = {
  vote: (pointId, data) => api.post(`/votes/point/${pointId}`, data),
  getVotes: (pointId) => api.get(`/votes/point/${pointId}`),
  getMyVote: (pointId) => api.get(`/votes/point/${pointId}/me`),
};

// =====================================================
// DRAFT
// =====================================================
export const draftAPI = {
  getByMeeting: (meetingId) => api.get(`/draft/meeting/${meetingId}`),
  addPoint: (meetingId, data) => api.post(`/draft/meeting/${meetingId}/points`, data),
  editPoint: (pointId, data) => api.patch(`/draft/points/${pointId}`, data),
  deletePoint: (pointId) => api.delete(`/draft/points/${pointId}`),
};

// =====================================================
// PV
// =====================================================
export const pvAPI = {
  createEmpty: (meetingId) => api.post(`/pv/meeting/${meetingId}`),
  createFromDraft: (meetingId) => api.post(`/pv/meeting/${meetingId}/from-draft`),
  getByMeeting: (meetingId) => api.get(`/pv/meeting/${meetingId}`),
  addPoint: (pvId, data) => api.post(`/pv/${pvId}/points`, data),
  editPoint: (pointId, data) => api.patch(`/pv/points/${pointId}`, data),
  deletePoint: (pointId) => api.delete(`/pv/points/${pointId}`),
  deletePV: (pvId) => api.delete(`/pv/${pvId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get("/notifications"),
  
  
  // data : id_user , content
  createNotification: (data) => api.post("/notifications", data),
  
  // data : committee_id , content
  notifyCommittee: (data) => api.post("/notifications/committee", data),
  // meeting_id , content
  notifyMeeting: (data) => api.post("/notifications/meeting", data),
  

  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  

  markAllAsRead: () => api.patch("/notifications/read-all"),

  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default api;