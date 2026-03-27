import axios from 'axios'

const api = axios.create({
  baseURL: '/api/filliq',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getFillChart: () => api.get('/dashboard/fill-chart'),
  getAtRiskMembers: () => api.get('/dashboard/at-risk-members'),
  getTeacherBrief: (classId: string) => api.get(`/dashboard/teacher-brief/${classId}`),
  getTeacherDaily: (teacherId: string) => api.get(`/dashboard/teacher-daily/${teacherId}`),
  getMonthlyReport: (year?: number, month?: number) => 
    api.get('/dashboard/monthly-report', { params: { year, month } }),
}

// Scores API
export const scoresApi = {
  getClassScores: (classId: string) => api.get(`/scores/class/${classId}`),
  getMemberScores: (memberId: string) => api.get(`/scores/member/${memberId}`),
  calculateScores: (classId: string) => api.post('/scores/calculate', { classId }),
}

// Waitlist API
export const waitlistApi = {
  trigger: (classId: string, cancelledBookingId: string) => 
    api.post('/waitlist/trigger', { classId, cancelledBookingId }),
  getEvents: (params?: { limit?: number; classId?: string }) => 
    api.get('/waitlist/events', { params }),
  getPending: (classId?: string) => 
    api.get('/waitlist/pending', { params: { classId } }),
}

// Churn API
export const churnApi = {
  getMembers: (minScore?: number) => 
    api.get('/churn/members', { params: { minScore } }),
  sendNudge: (memberId: string) => api.post(`/churn/nudge/${memberId}`),
  sendOffer: (memberId: string) => api.post(`/churn/offer/${memberId}`),
  getSummary: () => api.get('/churn/summary'),
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  updateWhatsApp: (data: any) => api.put('/settings/whatsapp', data),
}

export default api
