import axios from 'axios'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zlanegnamrsrphcvxtcf.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const functionsBase = `${SUPABASE_URL}/functions/v1`

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  },
})

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get(`${functionsBase}/dashboard-api?action=summary`),
  getFillChart: () => api.get(`${functionsBase}/dashboard-api?action=fill-chart`),
  getAtRiskMembers: () => api.get(`${functionsBase}/dashboard-api?action=at-risk`),
  getTeacherBrief: (classId: string) => api.get(`${functionsBase}/dashboard-api?action=teacher-brief&classId=${classId}`),
  getTeacherDaily: (teacherId: string) => api.get(`${functionsBase}/dashboard-api?action=teacher-daily&teacherId=${teacherId}`),
  getMonthlyReport: (year?: number, month?: number) =>
    api.get(`${functionsBase}/dashboard-api?action=monthly-report`, { params: { year, month } }),
}

// Scores API
export const scoresApi = {
  getClassScores: (classId: string) => api.get(`${functionsBase}/scores-api?action=class&id=${classId}`),
  getMemberScores: (memberId: string) => api.get(`${functionsBase}/scores-api?action=member&id=${memberId}`),
}

// Waitlist API
export const waitlistApi = {
  trigger: (classId: string, cancelledBookingId: string) =>
    api.post(`${functionsBase}/waitlist-trigger`, { class_id: classId, cancelled_booking_id: cancelledBookingId }),
  getEvents: (params?: { limit?: number; classId?: string }) =>
    api.get(`${functionsBase}/waitlist-api?action=events`, { params: { limit: params?.limit, classId: params?.classId } }),
  getPending: (classId?: string) =>
    api.get(`${functionsBase}/waitlist-api?action=pending`, { params: { classId } }),
}

// Churn API
export const churnApi = {
  getMembers: (minScore?: number) =>
    api.get(`${functionsBase}/churn-api?action=members`, { params: { minScore } }),
  getSummary: () => api.get(`${functionsBase}/churn-api?action=summary`),
  sendNudge: (memberId: string) => api.post(`${functionsBase}/churn-api?action=nudge`, { memberId }),
  sendOffer: (memberId: string) => api.post(`${functionsBase}/churn-api?action=offer`, { memberId }),
}

// Settings API
export const settingsApi = {
  get: () => api.get(`${functionsBase}/settings-api`),
  update: (data: any) => api.post(`${functionsBase}/settings-api`, data),
}

export default api
