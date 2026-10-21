import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-fade-in">
      <p className="text-7xl font-black text-primary-500/30">404</p>
      <h2 className="text-2xl font-bold text-white mt-4">Page not found</h2>
      <p className="text-slate-400 text-sm mt-2">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Go to Dashboard</Link>
    </div>
  )
}
