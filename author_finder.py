import requests
from bs4 import BeautifulSoup
import time
import re
from config import Config

class AuthorFinder:
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
    
    def search_authors_by_keyword(self, keyword, max_results=10):
        """
        키워드를 기반으로 관련 저자들을 검색합니다.
        """
        authors = []
        
        # 네이버 도서 검색만 사용
        naver_authors = self._search_naver_books(keyword, max_results)
        authors.extend(naver_authors)
        
        # 중복 제거 및 정리
        unique_authors = self._remove_duplicates(authors)
        
        return unique_authors[:max_results]
    
    def _search_naver_books(self, keyword, max_results):
        """
        네이버 도서 검색 API를 통해 저자 정보를 가져옵니다.
        """
        authors = []
        
        if not self.config.is_configured():
            print("❌ 네이버 API 설정이 필요합니다. config.json 파일을 설정하세요.")
            return []
        
        try:
            # 네이버 도서 검색 API 호출
            api_url = self.config.get_api_url("naver_book_search_url")
            params = {
                'query': keyword,
                'display': max_results * 2,  # 더 많이 가져와서 저자 추출
                'start': 1,
                'sort': 'sim'
            }
            
            response = self.session.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                books = data.get('items', [])
                
                author_set = set()  # 중복 제거용
                
                for book in books:
                    if len(author_set) >= max_results:
                        break
                        
                    # 저자 정보 추출
                    author_text = book.get('author', '').replace('<b>', '').replace('</b>', '')
                    
                    if author_text:
                        # 여러 저자가 있는 경우 분리 ("|", ",", ";" 등으로 구분)
                        author_names = re.split(r'[|,;/]', author_text)
                        
                        for author_name in author_names:
                            cleaned_name = self._clean_author_name(author_name)
                            if cleaned_name and cleaned_name not in author_set:
                                author_set.add(cleaned_name)
                                
                                # 책 제목과 출판사 정보도 함께 저장
                                book_title = book.get('title', '').replace('<b>', '').replace('</b>', '')
                                publisher = book.get('publisher', '')
                                
                                authors.append({
                                    'name': cleaned_name,
                                    'source': 'naver',
                                    'related_keyword': keyword,
                                    'book_title': book_title,
                                    'publisher': publisher,
                                    'book_url': book.get('link', '')
                                })
                
                if not authors:
                    print(f"네이버 API에서 '{keyword}' 관련 저자를 찾을 수 없습니다.")
                    
            else:
                print(f"네이버 도서 검색 API 호출 실패: {response.status_code}")
                
        except Exception as e:
            print(f"네이버 도서 검색 실패: {e}")
        
        return authors[:max_results]
    
    
    def _clean_author_name(self, author_text):
        """
        저자명을 정리합니다.
        """
        if not author_text:
            return None
        
        # HTML 태그 및 특수문자 제거
        author_text = re.sub(r'<[^>]+>', '', author_text)  # HTML 태그 제거
        author_text = re.sub(r'[()\[\]{}]', '', author_text)  # 괄호 제거
        author_text = re.sub(r'\s+', ' ', author_text)  # 연속 공백 제거
        author_text = author_text.strip()
        
        # '지은이', '저자', '편저' 등의 표현 제거
        author_text = re.sub(r'(지은이|저자|편저|글|옮긴이|역자|번역).*$', '', author_text)
        author_text = author_text.strip()
        
        # 너무 짧거나 긴 이름 필터링
        if len(author_text) < 2 or len(author_text) > 15:
            return None
        
        # 숫자만 있거나 의미없는 문자열 필터링
        if author_text.isdigit() or author_text in ['기타', '미상', '무명', '저자미상']:
            return None
        
        return author_text
    
    def _remove_duplicates(self, authors):
        """
        중복된 저자를 제거합니다.
        """
        seen_names = set()
        unique_authors = []
        
        for author in authors:
            name = author['name'].lower().strip()
            if name not in seen_names:
                seen_names.add(name)
                unique_authors.append(author)
        
        return unique_authors
    
    def get_author_info(self, author_name):
        """
        특정 저자의 상세 정보를 가져옵니다.
        """
        try:
            # 실제 구현에서는 다양한 소스에서 저자 정보 수집
            author_info = {
                'name': author_name,
                'books': self._get_author_books(author_name),
                'profile': f'{author_name}은(는) {author_name} 분야의 전문가입니다.',
                'recent_activity': '최근 활동 정보'
            }
            
            return author_info
            
        except Exception as e:
            print(f"저자 정보 가져오기 실패: {e}")
            return None
    
    def _get_author_books(self, author_name):
        """
        저자의 저서 목록을 가져옵니다.
        """
        if not self.config.is_configured():
            print("❌ 네이버 API 설정이 필요합니다.")
            return []
            
        try:
            # 네이버 도서 검색 API로 해당 저자의 책 검색
            api_url = self.config.get_api_url("naver_book_search_url")
            params = {
                'query': f'author:{author_name}',  # 저자명으로 검색
                'display': 5,
                'start': 1,
                'sort': 'date'  # 최신순
            }
            
            response = self.session.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                books = data.get('items', [])
                
                book_titles = []
                for book in books:
                    title = book.get('title', '').replace('<b>', '').replace('</b>', '')
                    if title:
                        book_titles.append(title)
                
                return book_titles[:5]
            else:
                print(f"저자 '{author_name}'의 도서 검색 실패: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"저자 도서 목록 가져오기 실패: {e}")
            return []
    
    def find_trending_authors(self, keywords):
        """
        여러 키워드를 기반으로 트렌딩 저자들을 찾습니다.
        """
        all_authors = []
        
        for keyword in keywords:
            authors = self.search_authors_by_keyword(keyword, 5)
            all_authors.extend(authors)
            time.sleep(1)  # API 호출 간격 조절
        
        # 빈도수 기반 정렬
        author_frequency = {}
        for author in all_authors:
            name = author['name']
            if name in author_frequency:
                author_frequency[name]['count'] += 1
                author_frequency[name]['keywords'].append(author['related_keyword'])
            else:
                author_frequency[name] = {
                    'author': author,
                    'count': 1,
                    'keywords': [author['related_keyword']]
                }
        
        # 빈도수 기준 정렬
        trending_authors = sorted(
            author_frequency.values(),
            key=lambda x: x['count'],
            reverse=True
        )
        
        return trending_authors[:10]