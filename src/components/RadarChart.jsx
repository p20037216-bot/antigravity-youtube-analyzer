/**
 * SVG 기반 레이더 차트 (외부 라이브러리 없음)
 * metrics: [{ label, score (0-100), grade }]
 */
export default function RadarChart({ metrics, size = 280 }) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 40
  const levels = 5
  const angleStep = (2 * Math.PI) / metrics.length
  const startAngle = -Math.PI / 2

  const gridColor = 'rgba(255, 255, 255, 0.08)'
  const fillColor = 'rgba(255, 0, 80, 0.2)'
  const strokeColor = 'rgba(255, 0, 80, 0.8)'
  const dotColor = '#ff0050'
  const labelColor = 'rgba(255, 255, 255, 0.6)'

  const gradeColors = {
    S: '#ffd700',
    A: '#00e676',
    B: '#448aff',
    C: '#ff9100',
    D: '#78909c',
  }

  // 격자 다각형 (5단계)
  const gridPolygons = []
  for (let level = 1; level <= levels; level++) {
    const r = (maxR / levels) * level
    const points = metrics
      .map((_, i) => {
        const angle = startAngle + i * angleStep
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      })
      .join(' ')
    gridPolygons.push(
      <polygon
        key={`grid-${level}`}
        points={points}
        fill="none"
        stroke={gridColor}
        strokeWidth={level === levels ? 1.5 : 0.5}
      />
    )
  }

  // 축선
  const axisLines = metrics.map((_, i) => {
    const angle = startAngle + i * angleStep
    return (
      <line
        key={`axis-${i}`}
        x1={cx}
        y1={cy}
        x2={cx + maxR * Math.cos(angle)}
        y2={cy + maxR * Math.sin(angle)}
        stroke={gridColor}
        strokeWidth={0.5}
      />
    )
  })

  // 데이터 다각형
  const dataPoints = metrics.map((m, i) => {
    const r = (m.score / 100) * maxR
    const angle = startAngle + i * angleStep
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  })

  const dataPolygonPoints = dataPoints
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  // 지표 라벨
  const labels = metrics.map((m, i) => {
    const angle = startAngle + i * angleStep
    const labelR = maxR + 26
    return (
      <text
        key={`label-${i}`}
        x={cx + labelR * Math.cos(angle)}
        y={cy + labelR * Math.sin(angle)}
        textAnchor="middle"
        dominantBaseline="central"
        fill={labelColor}
        fontSize="13"
        fontWeight="600"
        fontFamily="Outfit, sans-serif"
      >
        {m.label}
      </text>
    )
  })

  // 등급 표시
  const scoreLabels = metrics.map((m, i) => {
    const r = (m.score / 100) * maxR + 15
    const angle = startAngle + i * angleStep
    return (
      <text
        key={`score-${i}`}
        x={cx + r * Math.cos(angle)}
        y={cy + r * Math.sin(angle)}
        textAnchor="middle"
        dominantBaseline="central"
        fill={gradeColors[m.grade] || '#fff'}
        fontSize="12"
        fontWeight="700"
        fontFamily="Outfit, sans-serif"
      >
        {m.grade}
      </text>
    )
  })

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPolygons}
        {axisLines}

        <polygon
          points={dataPolygonPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        >
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.8s"
            fill="freeze"
          />
        </polygon>

        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={dotColor}
            stroke="white"
            strokeWidth={1.5}
          >
            <animate
              attributeName="r"
              from="0"
              to="4"
              dur="0.5s"
              begin={`${0.3 + i * 0.1}s`}
              fill="freeze"
            />
          </circle>
        ))}

        {labels}
        {scoreLabels}
      </svg>
    </div>
  )
}
