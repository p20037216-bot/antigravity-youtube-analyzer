import { useState } from 'react'

export default function SearchBar({ onAnalyze, loading, error }) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim())
    }
  }

  return (
    <div className="search-container">
      <form className="search-box" onSubmit={handleSubmit}>
        <input
          id="youtube-url-input"
          type="text"
          className="search-input"
          placeholder="유튜브 영상 URL을 붙여넣으세요..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <button
          id="analyze-btn"
          type="submit"
          className="search-btn"
          disabled={loading || !url.trim()}
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </form>
      {error && <p className="search-error">⚠️ {error}</p>}
    </div>
  )
}
