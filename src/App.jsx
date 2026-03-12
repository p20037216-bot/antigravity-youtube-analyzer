import { useState } from 'react'
import SearchBar from './components/SearchBar'
import ResultDashboard from './components/ResultDashboard'
import SkeletonLoader from './components/SkeletonLoader'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async (url) => {
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch(
        `${API_URL}/api/analyze?url=${encodeURIComponent(url)}`
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || '분석 중 오류가 발생했습니다.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message || '서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">🎯</div>
        <h1 className="app-title">YouTube Analyzer</h1>
        <p className="app-subtitle">유입력 · 화제성 · 성장력 — S~D 등급 분석</p>
      </header>

      <SearchBar onAnalyze={handleAnalyze} loading={loading} error={error} />

      {loading && <SkeletonLoader />}
      {result && <ResultDashboard data={result} />}

      <footer className="app-footer">
        <p>
          Built by{' '}
          <a href="https://github.com/p20037216-bot" target="_blank" rel="noopener noreferrer">
            Antigravity
          </a>{' '}
          · Powered by YouTube Data API v3
        </p>
      </footer>
    </div>
  )
}
