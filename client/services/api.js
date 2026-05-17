import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Toggle between local dev and production
export const API_URL = "https://meeting-manager-7nuo.onrender.com";
// export const API_URL = "http://192.168.179.248:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach Bearer token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH  →  base: /auth
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {

  // POST /auth/register
  // body: { full_name: string, email: string, password: string }
  // returns: { accessToken, refreshToken, user: { id_user, full_name, email, is_admin } }
  register: (data) => api.post("/auth/register", data),

  // POST /auth/login
  // body: { email: string, password: string }
  // returns: { accessToken, refreshToken, user: { id_user, full_name, email, is_admin } }
  login: (data) => api.post("/auth/login", data),

  // GET /auth/me   🔒 Bearer token required
  // body: none
  // returns: { id_user, full_name, email, is_admin }
  me: () => api.get("/auth/me"),

  // POST /auth/logout   🔒
  // body: none
  // returns: { msg }
  logout: () => api.post("/auth/logout"),

  // POST /auth/forgot-password   ⚠️ route is /forgot-password (NOT /request-reset)
  // body: { email: string }
  // returns: { msg, reset_token }  ← token returned directly in dev mode
  requestReset: (data) => api.post("/auth/forgot-password", data),

  // POST /auth/reset-password
  // body: { token: string, password: string }
  // returns: { msg }
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS  →  base: /users
// ─────────────────────────────────────────────────────────────────────────────
export const userAPI = {

  // GET /users   🔒 admin only
  // body: none
  // returns: User[]
  getAll: () => api.get("/users"),

  // GET /users/:id   🔒
  // body: none
  // returns: User { id_user, full_name, email, is_admin }
  getOne: (id) => api.get(`/users/${id}`),

  // PATCH /users/toggle-admin   🔒 admin only   ⚠️ PATCH not PUT, field is id_user not user_id
  // body: { id_user: number }
  // returns: { msg, user }
  // note: cannot demote yourself
  toggleAdmin: (id_user) => api.patch("/users/toggle-admin", { id_user }),

  // PATCH /users/:id   🔒 self or admin   ⚠️ PATCH not PUT
  // body: { full_name?: string, email?: string }   ← do NOT include is_admin (stripped server-side)
  // returns: { msg, user }
  update: (id, data) => api.patch(`/users/${id}`, data),

  // DELETE /users/:id   🔒 admin only
  // body: none
  // returns: { msg }
  delete: (id) => api.delete(`/users/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMITTEES  →  base: /committees
// ─────────────────────────────────────────────────────────────────────────────
export const committeeAPI = {

  // GET /committees   🔒
  // body: none
  // returns: Committee[]  (each includes president: { id_user, full_name, email })
  getAll: () => api.get("/committees"),

  // GET /committees/mine   🔒
  // body: none
  // returns: Committee[]  (committees where logged user is a CommitteeMember)
  getMine: () => api.get("/committees/mine"),

  // GET /committees/:id   🔒
  // body: none
  // returns: Committee  (includes members[].user, president)
  getOne: (id) => api.get(`/committees/${id}`),

  // POST /committees   🔒 admin only
  // body: { name: string, president_id: number }
  // returns: { msg, committee }
  // side-effect: president is auto-added as CommitteeMember
  create: (data) => api.post("/committees", data),

  // PATCH /committees/:id   🔒 admin only   ⚠️ PATCH not PUT
  // body: { name: string }
  // returns: { msg, committee }
  update: (id, data) => api.patch(`/committees/${id}`, data),

  // DELETE /committees/:id   🔒 admin only
  // body: none
  // returns: { msg }
  delete: (id) => api.delete(`/committees/${id}`),

  // POST /committees/:id/members   🔒
  // body: { members: number[] }   (array of id_user values)
  // returns: { msg }
  addMembers: (id, data) => api.post(`/committees/${id}/members`, data),

  // DELETE /committees/:id/members/:userId   🔒
  // body: none
  // returns: { msg }
  // note: cannot remove the president — transfer presidency first
  removeMember: (id, userId) => api.delete(`/committees/${id}/members/${userId}`),

  // PATCH /committees/:id/change-president   🔒 current president only
  // body: { new_president_id: number }   (must already be a committee member)
  // returns: { msg, committee }
  changePresident: (id, data) => api.patch(`/committees/${id}/change-president`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// MEETINGS  →  base: /meetings
// ─────────────────────────────────────────────────────────────────────────────
export const meetingAPI = {

  // GET /meetings/mine   🔒   ⚠️ route is /mine not /member
  // body: none
  // returns: MeetingMember[]  each item has .Meeting { committee, creator, reporter, ... }
  getMine: () => api.get("/meetings/mine"),

  // GET /meetings/grouped   🔒
  // body: none
  // returns: [{ committee: Committee, meetings: Meeting[] }]
  getGrouped: () => api.get("/meetings/grouped"),

  // GET /meetings/:id   🔒  must be meeting member or admin
  // body: none
  // returns: Meeting  (includes committee, creator, reporter)
  getOne: (id) => api.get(`/meetings/${id}`),

  // GET /meetings/:id/members   🔒 creator or admin only
  // body: none
  // returns: MeetingMember[]  each has .user { id_user, full_name, email, is_admin }
  //          and fields: invited, confirmed, attended
  getMembers: (id) => api.get(`/meetings/${id}/members`),

  // POST /meetings   🔒
  // body: { title: string, site?: string, timing: string (ISO),
  //         meeting_type?: "online"|"onsite",
  //         committee_id: number,
  //         reporter_id?: number }
  // returns: { msg, meeting }
  // side-effects: draft auto-created, creator auto-added as MeetingMember (confirmed:true)
  //               reporter also auto-added if different from creator
  create: (data) => api.post("/meetings", data),

  // PATCH /meetings/:id   🔒   ⚠️ PATCH not PUT
  // body: { title?, site?, timing?, meeting_type?, status?, voting_state? }
  // returns: { msg, meeting }
  edit: (id, data) => api.patch(`/meetings/${id}`, data),

  // DELETE /meetings/:id   🔒
  // body: none
  // returns: { msg }
  delete: (id) => api.delete(`/meetings/${id}`),

  // PATCH /meetings/:id/status   🔒
  // body: { status: "scheduled"|"ongoing"|"closed"|"canceled" }
  // returns: Meeting
  changeStatus: (id, data) => api.patch(`/meetings/${id}/status`, data),

  // POST /meetings/:id/members   🔒
  // body: { members: number[] }   (array of id_user; all must be committee members)
  // returns: { msg }
  addMembers: (id, data) => api.post(`/meetings/${id}/members`, data),

  // PATCH /meetings/:id/reporter   🔒   ⚠️ PATCH not POST
  // body: { reporter_id: number }   (must already be a meeting member)
  // returns: { msg, meeting }
  addReporter: (id, data) => api.patch(`/meetings/${id}/reporter`, data),

  // PATCH /meetings/:id/confirm   🔒   ⚠️ PATCH not POST
  // body: none   (sets confirmed=true for the logged user's membership row)
  // returns: { msg, member }
  confirmAttendance: (id) => api.patch(`/meetings/${id}/confirm`),

  // PATCH /meetings/:id/validate/:memberId   🔒 creator only   ⚠️ PATCH, route is /validate/
  // body: none   (sets attended=true; member must have confirmed=true first)
  // returns: { msg, member }
  validateAttendance: (id, memberId) => api.patch(`/meetings/${id}/validate/${memberId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENDA  →  base: /agenda
// ─────────────────────────────────────────────────────────────────────────────
export const agendaAPI = {

  // GET /agenda/meeting/:meetingId   🔒
  // body: none
  // returns: { id_agenda, id_meeting, points: AgendaPoint[] }
  // visibility: pending/rejected points only shown to proposer, creator, admin
  // point states: "pending" | "approved" | "open" | "closed" | "rejected"
  getByMeeting: (meetingId) => api.get(`/agenda/meeting/${meetingId}`),

  // POST /agenda/meeting/:meetingId/points   🔒 must be meeting member   ⚠️ plural /points
  // body: { content: string }
  // returns: { msg, point }
  // side-effect: agenda auto-created on first point; point starts as state="pending"
  addPoint: (meetingId, data) => api.post(`/agenda/meeting/${meetingId}/points`, data),

  // PATCH /agenda/points/:id/approve   🔒 creator or admin   ⚠️ plural /points
  // body: none
  // returns: { msg, point }  — state becomes "approved"
  approve: (id) => api.patch(`/agenda/points/${id}/approve`),

  // PATCH /agenda/points/:id/reject   🔒 creator or admin
  // body: none
  // returns: { msg, point }  — state becomes "rejected"
  reject: (id) => api.patch(`/agenda/points/${id}/reject`),

  // PATCH /agenda/points/:id/open   🔒 creator or admin  (point must be "approved" first)
  // body: none
  // returns: { msg, point }  — state becomes "open", voting now allowed
  openVoting: (id) => api.patch(`/agenda/points/${id}/open`),

  // PATCH /agenda/points/:id/close   🔒 creator or admin
  // body: none
  // returns: { msg, point }  — state becomes "closed"
  closeVoting: (id) => api.patch(`/agenda/points/${id}/close`),

  // DELETE /agenda/points/:id   🔒 proposer or admin
  // body: none
  // returns: { msg }
  deletePoint: (id) => api.delete(`/agenda/points/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// VOTES  →  base: /votes
// ─────────────────────────────────────────────────────────────────────────────
export const voteAPI = {

  // POST /votes/point/:id   🔒 must be meeting member   ⚠️ full path is /votes/point/:id
  // body: { vote: "agree"|"disagree"|"abstain" }
  // returns: { msg, vote }
  // constraints: point state must be "open"; one vote per user per point (DB unique index)
  vote: (pointId, data) => api.post(`/votes/point/${pointId}`, data),

  // GET /votes/point/:id   🔒   ⚠️ full path is /votes/point/:id
  // body: none
  // returns: { point_id, total_votes, stats: { agree, disagree, abstain }, votes: Vote[] }
  getForPoint: (pointId) => api.get(`/votes/point/${pointId}`),

  // GET /votes/point/:id/me   🔒
  // body: none
  // returns: Vote  — the logged user's own vote; 404 if hasn't voted yet
  getMyVote: (pointId) => api.get(`/votes/point/${pointId}/me`),
};

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT  →  base: /draft
// ─────────────────────────────────────────────────────────────────────────────
export const draftAPI = {

  // GET /draft/meeting/:meetingId   🔒 must be meeting member
  // body: none
  // returns: Draft  (includes points[].author { id_user, full_name, email })
  getByMeeting: (meetingId) => api.get(`/draft/meeting/${meetingId}`),

  // POST /draft/meeting/:meetingId/points   🔒 reporter or admin only   ⚠️ plural /points
  // body: { content: string }
  // returns: { msg, point }
  addPoint: (meetingId, data) => api.post(`/draft/meeting/${meetingId}/points`, data),

  // PATCH /draft/points/:id   🔒 author or admin   ⚠️ PATCH not PUT, plural /points
  // body: { content: string }
  // returns: { msg, point }
  editPoint: (id, data) => api.patch(`/draft/points/${id}`, data),

  // DELETE /draft/points/:id   🔒 author or admin   ⚠️ plural /points
  // body: none
  // returns: { msg }
  deletePoint: (id) => api.delete(`/draft/points/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// PV  →  base: /pv
// ─────────────────────────────────────────────────────────────────────────────
export const pvAPI = {

  // POST /pv/meeting/:meetingId   🔒 reporter or admin only
  // body: none  — creates an empty PV (no points copied from draft)
  // returns: { msg, pv }
  createEmpty: (meetingId) => api.post(`/pv/meeting/${meetingId}`),

  // POST /pv/meeting/:meetingId/from-draft   🔒 reporter or admin only
  // body: none  — clones all DraftPoints into PvPoints
  // returns: { msg, pv }
  createFromDraft: (meetingId) => api.post(`/pv/meeting/${meetingId}/from-draft`),

  // GET /pv/meeting/:meetingId   🔒
  // body: none
  // returns: Pv  (includes points[], reporter: { id_user, full_name, email })
  getByMeeting: (meetingId) => api.get(`/pv/meeting/${meetingId}`),

  // POST /pv/:pvId/points   🔒 reporter or admin   ⚠️ plural /points
  // body: { content: string }
  // returns: { msg, point }
  addPoint: (pvId, data) => api.post(`/pv/${pvId}/points`, data),

  // PATCH /pv/points/:pointId   🔒 reporter or admin   ⚠️ plural /points
  // body: { content: string }
  // returns: { msg, point }
  editPoint: (pointId, data) => api.patch(`/pv/points/${pointId}`, data),

  // DELETE /pv/points/:pointId   🔒 reporter or admin   ⚠️ plural /points
  // body: none
  // returns: { msg }
  deletePoint: (pointId) => api.delete(`/pv/points/${pointId}`),

  // DELETE /pv/:pvId   🔒 reporter or admin
  // body: none  — deletes PV and all its PvPoints (controller handles cascade)
  // returns: { msg }
  deletePv: (pvId) => api.delete(`/pv/${pvId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS  →  base: /notifications
// ─────────────────────────────────────────────────────────────────────────────
export const notificationAPI = {

  // GET /notifications   🔒
  // body: none
  // returns: Notification[]  ordered by createdAt DESC, only logged user's
  getAll: () => api.get("/notifications"),

  // POST /notifications   🔒
  // body: { id_user: number, content: string }
  // returns: { msg, notification }
  create: (data) => api.post("/notifications", data),

  // POST /notifications/committee   🔒
  // body: { committee_id: number, content: string }
  // returns: { msg, count }  — bulk-creates one notification per committee member
  notifyCommittee: (data) => api.post("/notifications/committee", data),

  // POST /notifications/meeting   🔒
  // body: { meeting_id: number, content: string }
  // returns: { msg, count }  — bulk-creates one notification per meeting member
  notifyMeeting: (data) => api.post("/notifications/meeting", data),

  // PATCH /notifications/:id/read   🔒
  // body: none  — marks notification as is_read=true (must belong to logged user)
  // returns: { msg, notification }
  markRead: (id) => api.patch(`/notifications/${id}/read`),

  // PATCH /notifications/read-all   🔒
  // body: none  — marks ALL logged user's notifications as is_read=true
  // returns: { msg }
  markAllRead: () => api.patch("/notifications/read-all"),

  // DELETE /notifications/:id   🔒
  // body: none  (must belong to logged user)
  // returns: { msg }
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;