import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medichain_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const api = {
  // Auth
  register: (data) => client.post('/auth/register', data).then((r) => r.data),
  login: (data) => client.post('/auth/login', data).then((r) => r.data),
  demoLogin: (role) => client.post('/auth/demo-login', { role }).then((r) => r.data),
  getMe: () => client.get('/auth/me').then((r) => r.data),

  // Records
  uploadRecord: (formData) =>
    client
      .post('/records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  confirmRecord: (id, txHash) =>
    client.patch(`/records/${id}/confirm`, { txHash }).then((r) => r.data),

  getMyRecords: () => client.get('/records/mine').then((r) => r.data),
  getRecordById: (id) => client.get(`/records/${id}`).then((r) => r.data),

  downloadRecord: async (id, filename = 'document.pdf') => {
    const response = await client.get(`/records/${id}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  verifyRecord: (id) => client.post(`/records/${id}/verify`).then((r) => r.data),

  // Access & Audit
  getRecordAccess: (recordId, doctor) =>
    client.get(`/access/${recordId}`, { params: { doctor } }).then((r) => r.data),
  getRecordAudit: (recordId) => client.get(`/audit/${recordId}`).then((r) => r.data),
}

export default client
