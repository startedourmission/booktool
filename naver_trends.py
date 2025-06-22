import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime, timedelta
from config import Config

class NaverTrends:
    def __init__(self):
        self.config = Config()
        self.session = requests.Session()
        
        # API 인증 정보 설정
        client_id, client_secret = self.config.get_naver_credentials()
        self.session.headers.update({
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def get_search_trends(self, keyword, days=30):
        """
        네이버 데이터랩 API를 사용하여 검색 트렌드 데이터를 가져옵니다.
        """
        if not self.config.is_configured():
            print("❌ 네이버 API 설정이 필요합니다. config.json 파일을 설정하세요.")
            return None
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # 네이버 데이터랩 API 요청 데이터
            request_body = {
                "startDate": start_date.strftime('%Y-%m-%d'),
                "endDate": end_date.strftime('%Y-%m-%d'),
                "timeUnit": "date",
                "keywordGroups": [
                    {
                        "groupName": keyword,
                        "keywords": [keyword]
                    }
                ]
            }
            
            # API 호출
            api_url = self.config.get_api_url("naver_datalab_url")
            response = self.session.post(
                api_url,
                data=json.dumps(request_body),
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'results' in data and len(data['results']) > 0:
                    results = data['results'][0]['data']
                    
                    dates = [item['period'] for item in results]
                    values = [item['ratio'] for item in results]
                    
                    return {
                        'keyword': keyword,
                        'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                        'dates': dates,
                        'values': values
                    }
                else:
                    print(f"네이버 API 응답에 데이터가 없습니다: {keyword}")
                    return None
            else:
                print(f"네이버 API 호출 실패: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"네이버 트렌드 데이터 가져오기 실패: {e}")
            return None
    
    
    def search_related_keywords(self, keyword):
        """
        네이버 도서 검색 API를 사용하여 관련 키워드를 검색합니다.
        """
        if not self.config.is_configured():
            print("❌ 네이버 API 설정이 필요합니다. config.json 파일을 설정하세요.")
            return []
            
        try:
            # 네이버 도서 검색 API 호출
            api_url = self.config.get_api_url("naver_book_search_url")
            params = {
                'query': keyword,
                'display': 10,
                'start': 1,
                'sort': 'sim'
            }
            
            response = self.session.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                books = data.get('items', [])
                
                # 책 제목에서 키워드 추출
                related_keywords = set()
                for book in books:
                    title = book.get('title', '').replace('<b>', '').replace('</b>', '')
                    # 간단한 키워드 추출 로직
                    words = title.split()
                    for word in words:
                        if len(word) > 1 and word != keyword:
                            related_keywords.add(word)
                
                return list(related_keywords)[:10]
            else:
                print(f"네이버 도서 검색 API 호출 실패: {response.status_code}")
                return []
            
        except Exception as e:
            print(f"관련 키워드 검색 실패: {e}")
            return []