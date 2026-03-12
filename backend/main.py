"""
YouTube Video Analyzer API
- YouTube Data API v3를 사용하여 영상의 유입력, 화제성, 성장력을 분석
- S ~ D 등급으로 평가
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import re
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="YouTube Video Analyzer API", version="1.0.0")

# CORS 설정 — 모든 프론트엔드 도메인 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


def extract_video_id(url: str) -> str | None:
    """유튜브 URL에서 Video ID를 추출합니다.
    지원: watch?v=, youtu.be/, /embed/, /shorts/, 또는 순수 11자리 ID
    """
    patterns = [
        r"(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    return None


def calculate_grade(value: float, thresholds: list) -> str:
    """값과 임계값 리스트를 비교하여 S, A, B, C, D 등급을 반환합니다."""
    grades = ["S", "A", "B", "C", "D"]
    for i, threshold in enumerate(thresholds):
        if value > threshold:
            return grades[i]
    return "D"


def grade_to_score(grade: str) -> int:
    """등급을 0~100 점수로 변환합니다 (레이더 차트용)."""
    return {"S": 100, "A": 80, "B": 60, "C": 40, "D": 20}.get(grade, 20)


@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {"status": "ok", "service": "YouTube Video Analyzer API v1.0"}


@app.get("/api/analyze")
async def analyze_video(url: str = Query(..., description="YouTube video URL")):
    """유튜브 영상 종합 분석 API

    1. URL에서 Video ID 파싱
    2. YouTube Data API로 영상/채널 정보 수집
    3. 유입력·화제성·성장력 3개 지표 계산
    4. S~D 등급 부여 및 JSON 반환
    """
    # API 키 확인
    if not YOUTUBE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="YouTube API Key가 설정되지 않았습니다. 환경변수 YOUTUBE_API_KEY를 확인하세요."
        )

    # 1. Video ID 추출
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="유효하지 않은 YouTube URL입니다.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 2. Video 정보 가져오기
        video_resp = await client.get(
            f"{YOUTUBE_API_BASE}/videos",
            params={
                "part": "snippet,statistics",
                "id": video_id,
                "key": YOUTUBE_API_KEY,
            },
        )

        if video_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="YouTube API 호출에 실패했습니다.")

        video_data = video_resp.json()
        if not video_data.get("items"):
            raise HTTPException(status_code=404, detail="영상을 찾을 수 없습니다.")

        video_item = video_data["items"][0]
        snippet = video_item["snippet"]
        stats = video_item["statistics"]
        channel_id = snippet["channelId"]

        # 3. Channel 정보 가져오기
        channel_resp = await client.get(
            f"{YOUTUBE_API_BASE}/channels",
            params={
                "part": "statistics,snippet",
                "id": channel_id,
                "key": YOUTUBE_API_KEY,
            },
        )

        if channel_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="채널 정보 호출에 실패했습니다.")

        channel_data = channel_resp.json()
        if not channel_data.get("items"):
            raise HTTPException(status_code=404, detail="채널을 찾을 수 없습니다.")

        channel_item = channel_data["items"][0]
        channel_stats = channel_item["statistics"]
        channel_snippet = channel_item["snippet"]

    # 4. 데이터 파싱
    view_count = int(stats.get("viewCount", 0))
    like_count = int(stats.get("likeCount", 0))
    comment_count = int(stats.get("commentCount", 0))
    subscriber_count = int(channel_stats.get("subscriberCount", 0))

    published_at = datetime.fromisoformat(
        snippet["publishedAt"].replace("Z", "+00:00")
    )
    days_since = max((datetime.now(timezone.utc) - published_at).days, 1)

    # 5. 지표 산출
    # 유입력 (Inflow): 구독자 대비 조회율
    inflow_pct = (view_count / max(subscriber_count, 1)) * 100
    inflow_grade = calculate_grade(inflow_pct, [100, 50, 20, 10])

    # 화제성 (Buzz): 참여율
    buzz_pct = ((like_count + comment_count) / max(view_count, 1)) * 100
    buzz_grade = calculate_grade(buzz_pct, [4, 2.5, 1.5, 0.5])

    # 성장력 (Growth): 일평균 조회수
    growth_vpd = view_count / days_since
    growth_grade = calculate_grade(growth_vpd, [50000, 10000, 3000, 500])

    # 6. 종합 등급 (3개 지표 평균 점수)
    avg_score = (
        grade_to_score(inflow_grade)
        + grade_to_score(buzz_grade)
        + grade_to_score(growth_grade)
    ) / 3

    if avg_score >= 90:
        overall_grade = "S"
    elif avg_score >= 70:
        overall_grade = "A"
    elif avg_score >= 50:
        overall_grade = "B"
    elif avg_score >= 30:
        overall_grade = "C"
    else:
        overall_grade = "D"

    # 7. 최고 해상도 썸네일 선택
    thumbnails = snippet.get("thumbnails", {})
    thumbnail_url = (
        thumbnails.get("maxres", {}).get("url")
        or thumbnails.get("standard", {}).get("url")
        or thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url", "")
    )

    # 8. 결과 JSON 반환
    return {
        "video": {
            "id": video_id,
            "title": snippet["title"],
            "thumbnail": thumbnail_url,
            "publishedAt": snippet["publishedAt"],
            "daysSinceUpload": days_since,
        },
        "channel": {
            "name": channel_snippet["title"],
            "thumbnail": channel_snippet.get("thumbnails", {})
            .get("default", {})
            .get("url", ""),
            "subscriberCount": subscriber_count,
        },
        "stats": {
            "viewCount": view_count,
            "likeCount": like_count,
            "commentCount": comment_count,
        },
        "analysis": {
            "inflow": {
                "value": round(inflow_pct, 2),
                "grade": inflow_grade,
                "score": grade_to_score(inflow_grade),
                "label": "유입력",
                "description": f"구독자 대비 조회율 {round(inflow_pct, 1)}%",
            },
            "buzz": {
                "value": round(buzz_pct, 2),
                "grade": buzz_grade,
                "score": grade_to_score(buzz_grade),
                "label": "화제성",
                "description": f"참여율 {round(buzz_pct, 2)}%",
            },
            "growth": {
                "value": round(growth_vpd, 1),
                "grade": growth_grade,
                "score": grade_to_score(growth_grade),
                "label": "성장력",
                "description": f"일평균 {round(growth_vpd, 0):,.0f}회 조회",
            },
            "overall": {
                "grade": overall_grade,
                "score": round(avg_score, 1),
            },
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
