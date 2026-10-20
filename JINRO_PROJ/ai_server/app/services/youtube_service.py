import html
import os
import re

import httpx


def search_youtube_video(query: str) -> list[dict]:
    query = query.strip()
    if not query or len(query) > 100:
        raise ValueError('유튜브 검색어는 1~100자여야 합니다.')
    key = os.getenv('YOUTUBE_API_KEY') or os.getenv('VITE_YOUTUBE_API_KEY')
    if not key:
        raise ValueError('유튜브 API 키가 설정되지 않았습니다.')
    # Keep the API key out of request URLs and HTTP request logs.
    try:
        with httpx.Client(timeout=20) as client:
            response = client.get('https://www.googleapis.com/youtube/v3/search',
                                  headers={'X-Goog-Api-Key': key}, params={
                'part':'snippet', 'type':'video', 'maxResults':1, 'q':query,
                'relevanceLanguage':'ko', 'regionCode':'KR', 'safeSearch':'strict',
            })
        if response.status_code != 200:
            raise ValueError(f'유튜브 검색 응답 실패: HTTP {response.status_code}')
        items = response.json().get('items', [])
    except httpx.HTTPError:
        raise ValueError('유튜브 검색 서버 연결 실패') from None
    if not items:
        return []
    item = items[0]
    video_id = item.get('id', {}).get('videoId', '')
    if not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
        raise ValueError('유튜브 검색 결과의 영상 번호가 잘못되었습니다.')
    return [{'video_id':video_id, 'title':html.unescape(item['snippet']['title']),
             'channel':html.unescape(item['snippet'].get('channelTitle', '')),
             'url':f'https://www.youtube.com/watch?v={video_id}'}]
