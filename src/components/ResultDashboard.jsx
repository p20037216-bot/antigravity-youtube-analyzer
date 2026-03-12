import RadarChart from './RadarChart'

/**
 * 숫자를 한국식 축약으로 포맷합니다 (예: 1.2만, 3.5억)
 */
function formatNumber(num) {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}천`
  return num.toLocaleString()
}

function gradeClass(grade) {
  return `grade-${grade.toLowerCase()}`
}

function badgeClass(grade) {
  return `badge-${grade.toLowerCase()}`
}

export default function ResultDashboard({ data }) {
  const { video, channel, stats, analysis } = data
  const metrics = [analysis.inflow, analysis.buzz, analysis.growth]

  return (
    <div className="result-container">
      {/* ── 영상 카드 ── */}
      <div className="video-card">
        <div className="video-thumbnail-wrap">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail"
          />
          <div
            className={`video-overall-badge ${badgeClass(analysis.overall.grade)}`}
          >
            <span>종합</span>
            <span>{analysis.overall.grade}</span>
          </div>
        </div>

        <div className="video-info">
          <h2 className="video-title">{video.title}</h2>

          <div className="channel-info">
            {channel.thumbnail && (
              <img
                src={channel.thumbnail}
                alt={channel.name}
                className="channel-avatar"
              />
            )}
            <div>
              <div className="channel-name">{channel.name}</div>
              <div className="channel-subs">
                구독자 {formatNumber(channel.subscriberCount)}명
              </div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{formatNumber(stats.viewCount)}</span>
              <span className="stat-label">조회수</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatNumber(stats.likeCount)}</span>
              <span className="stat-label">좋아요</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {formatNumber(stats.commentCount)}
              </span>
              <span className="stat-label">댓글</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.daysSinceUpload}일</span>
              <span className="stat-label">업로드 경과</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 등급 카드 그리드 ── */}
      <div className="grade-section">
        {metrics.map((m) => (
          <div key={m.label} className={`grade-card ${gradeClass(m.grade)}`}>
            <div className="grade-label">{m.label}</div>
            <div className="grade-badge">{m.grade}</div>
            <div className="grade-description">{m.description}</div>
          </div>
        ))}
      </div>

      {/* ── 레이더 차트 ── */}
      <div className="radar-section">
        <div className="radar-title">종합 분석 레이더</div>
        <RadarChart metrics={metrics} />
      </div>
    </div>
  )
}
