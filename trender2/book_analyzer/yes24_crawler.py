import requests
from bs4 import BeautifulSoup
import re
import urllib.parse
from cache_manager import CacheManager

class Yes24Crawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        })
        self.base_url = "https://www.yes24.com"
        self.cache_manager = CacheManager()
        
        try:
            self.session.get("https://www.yes24.com", timeout=10)
        except:
            pass
    
    def search_books(self, keyword, max_results=20, it_books_only=False):
        # 캐시에서 데이터 확인
        cached_books = self.cache_manager.get_cached_data(keyword, max_results, it_books_only)
        if cached_books is not None:
            return cached_books
            
        books = []
        try:
            search_url = f"{self.base_url}/product/search"
            
            if it_books_only:
                params = {
                    'domain': 'BOOK',
                    'query': keyword,
                    'page': 1,
                    'size': max_results,
                    'dispNo2': '001001003'  # IT 모바일 카테고리
                }
                print(f"🔍 YES24에서 '{keyword}' IT 도서 전용 검색 중...")
            else:
                params = {
                    'domain': 'ALL',
                    'query': keyword,
                    'page': 1,
                    'size': max_results
                }
                print(f"🔍 YES24에서 '{keyword}' 검색 중...")
            
            print(f"📍 URL: {search_url}?{urllib.parse.urlencode(params)}")
            
            response = self.session.get(search_url, params=params, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                main_list = soup.find('ul', id='yesSchList')
                if main_list:
                    book_items = main_list.find_all('li', attrs={'data-goods-no': True})
                    if not book_items:
                        all_lis = main_list.find_all('li')
                        book_items = [li for li in all_lis if li.find('a', class_='gd_name')]
                else:
                    book_items = []
                
                if not book_items:
                    selectors_to_try = [
                        ('li[data-goods-no]', '굿즈 번호가 있는 아이템'),
                        ('div.itemUnit', '아이템 유닛 div'),
                        ('div.item_info', '상품 정보')
                    ]
                    
                    for selector, description in selectors_to_try:
                        items = soup.select(selector)
                        if items:
                            book_items = items
                            break
                
                books = []
                if book_items:
                    print(f"📚 {len(book_items)}개의 상품에서 정보 추출 중...")
                    for i, item in enumerate(book_items[:max_results]):
                        try:
                            book_info = self._extract_book_info(item, keyword)
                            if book_info and book_info.get('title'):
                                # 상세 페이지 크롤링
                                if book_info.get('link'):
                                    detail_info = self._crawl_book_detail_page(book_info['link'])
                                    book_info.update(detail_info) # 상세 정보 병합
                                books.append(book_info)
                                print(f"  ✓ {len(books)}. {book_info['title'][:50]}...")
                        except Exception as e:
                            print(f"  ❌ {i+1}번째 아이템 추출 실패: {e}")
                            continue
                else:
                    print("❌ 상품을 찾을 수 없습니다.")
            else:
                print(f"❌ YES24 검색 실패: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ YES24 크롤링 실패: {e}")
        
        # 크롤링 성공 시 캐시에 저장
        if books:
            self.cache_manager.save_to_cache(keyword, max_results, it_books_only, books)
        
        return books
    
    def get_it_bestsellers(self, max_results=100):
        """IT/모바일 카테고리 베스트셀러 수집"""
        # 캐시 확인
        cached_books = self.cache_manager.get_cached_data("IT_BESTSELLERS", max_results, True)
        if cached_books is not None:
            return cached_books
            
        books = []
        try:
            bestseller_url = f"{self.base_url}/product/category/bestseller"
            
            print(f"🔍 IT/모바일 카테고리 베스트셀러 수집 중...")
            print(f"📍 URL: {bestseller_url}")
            
            params = {
                'categoryNumber': '001001003',
                'pageNumber': 1,
                'pageSize': max_results
            }
            
            response = self.session.get(bestseller_url, params=params, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 상품 목록 찾기 (여러 가지 셀렉터 시도)
                book_items = soup.find_all('li', {'data-goods-no': True}) or \
                           soup.select('.goods_info') or \
                           soup.select('.item_info') or \
                           soup.select('.cmb_gd_lst li')
                
                if book_items:
                    print(f"📚 {len(book_items)}개의 상품에서 정보 추출 중...")
                    for i, item in enumerate(book_items[:max_results]):
                        try:
                            book_info = self._extract_book_info(item, "IT베스트셀러")
                            if book_info and book_info.get('title'):
                                # 상세 페이지 크롤링
                                if book_info.get('link'):
                                    detail_info = self._crawl_book_detail_page(book_info['link'])
                                    book_info.update(detail_info)
                                books.append(book_info)
                                print(f"  ✓ {len(books)}. {book_info['title'][:50]}...")
                        except Exception as e:
                            print(f"  ❌ {i+1}번째 아이템 추출 실패: {e}")
                            continue
                else:
                    print("❌ 상품을 찾을 수 없습니다.")
            else:
                print(f"❌ IT 베스트셀러 페이지 요청 실패: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ IT 베스트셀러 크롤링 실패: {e}")
        
        # 캐시에 저장
        if books:
            self.cache_manager.save_to_cache("IT_BESTSELLERS", max_results, True, books)
        
        return books
    
    def _extract_book_info(self, item, keyword):
        book_info = {}
        title_elem = item.find('a', class_='gd_name')
        if not title_elem:
            title_elem = item.select_one('a[href*="/product/goods/"]')
            if not title_elem:
                title_elem = item.select_one('.item_info a')
        
        if title_elem:
            title = title_elem.get_text().strip()
            if len(title) > 3:
                book_info['title'] = title
                if title_elem.get('href'):
                    book_info['link'] = self.base_url + title_elem.get('href')
                else:
                    book_info['link'] = '링크 없음'
            else:
                return None
        else:
            return None
        
        author_elem = item.find('span', class_='authPub info_auth')
        if author_elem:
            author_link = author_elem.find('a')
            if author_link:
                author = author_link.get_text().strip()
            else:
                author = author_elem.get_text().strip()
            author = re.sub(r'\s*저\s*$', '', author).strip()
            book_info['author'] = author if author else '저자 정보 없음'
        else:
            book_info['author'] = '저자 정보 없음'
        
        publisher_elem = item.find('span', class_='authPub info_pub')
        if publisher_elem:
            pub_link = publisher_elem.find('a')
            if pub_link:
                publisher = pub_link.get_text().strip()
            else:
                publisher = publisher_elem.get_text().strip()
            book_info['publisher'] = publisher
        else:
            book_info['publisher'] = '출판사 정보 없음'
        
        price_elem = item.find('em', class_='yes_b')
        if price_elem:
            price = price_elem.get_text().strip()
            price = re.sub(r'[^\d,]', '', price)
            book_info['price'] = int(price.replace(',', '')) if price.replace(',', '').isdigit() else 0
        else:
            book_info['price'] = 0
        
        sales_elem = item.find('span', class_='saleNum')
        if sales_elem:
            sales_text = sales_elem.get_text().strip()
            sales_numbers = re.findall(r'\d+(?:,\d+)*', sales_text)
            if sales_numbers:
                book_info['sales_rank'] = int(sales_numbers[0].replace(',', ''))
            else:
                book_info['sales_rank'] = 0
        else:
            book_info['sales_rank'] = 0
        
        book_info['search_keyword'] = keyword
        book_info['source'] = 'yes24'
        
        return book_info
    
    def _crawl_book_detail_page(self, book_link):
        detail_info = {
            'pages': 0,
            'published_date': '정보 없음',
            'keywords': '',
            'category': '',
        }
        try:
            response = self.session.get(book_link, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # 페이지 수 추출 (여러 셀렉터 시도)
                page_elem = soup.find('span', class_='gd_page') or \
                           soup.find('span', class_='page') or \
                           soup.select_one('.gd_infoTb tr:contains("쪽수") td') or \
                           soup.select_one('.gd_infoTb tr:contains("페이지") td')
                
                if page_elem:
                    page_text = page_elem.get_text().strip()
                    # 숫자 추출 (예: "320쪽", "320p", "320 pages" 등)
                    import re
                    page_match = re.search(r'(\d+)', page_text)
                    detail_info['pages'] = int(page_match.group(1)) if page_match else 0
                else:
                    # 테이블에서 페이지 정보 찾기
                    info_table = soup.find('table', class_='gd_infoTb')
                    if info_table:
                        for row in info_table.find_all('tr'):
                            th = row.find('th')
                            td = row.find('td')
                            if th and td and ('쪽' in th.text or '페이지' in th.text):
                                page_text = td.get_text().strip()
                                page_match = re.search(r'(\d+)', page_text)
                                detail_info['pages'] = int(page_match.group(1)) if page_match else 0
                                break

                # 출간일 추출
                date_elem = soup.find('span', class_='gd_date')
                if date_elem:
                    detail_info['published_date'] = date_elem.get_text().strip()

                # 키워드 추출
                keywords_meta = soup.find('meta', {'name': 'keywords'})
                if keywords_meta and keywords_meta.get('content'):
                    detail_info['keywords'] = keywords_meta.get('content')
                else:
                    keyword_container = soup.find('ul', class_='gd_tag') or \
                                        soup.find('div', class_='tag_list') or \
                                        soup.find('ul', class_='tag_list')
                    if keyword_container:
                        keywords = [tag.text.strip().replace('#', '') for tag in keyword_container.find_all('li')]
                        detail_info['keywords'] = ', '.join(keywords)

                # 카테고리 추출 (여러 방법 시도)
                category_meta = soup.find('meta', {'name': 'genre'})
                if category_meta and category_meta.get('content'):
                    detail_info['category'] = category_meta.get('content')
                else:
                    categories = []
                    # 여러 카테고리 셀렉터 시도
                    category_selectors = [
                        '.gd_category a',
                        '.breadcrumb a',
                        '.gd_cate a',
                        '.category a',
                        '.path a',
                        'nav a'
                    ]
                    
                    for selector in category_selectors:
                        category_links = soup.select(selector)
                        if category_links:
                            categories = [cate.text.strip() for cate in category_links if cate.text.strip()]
                            if categories:
                                break
                    
                    # 기본 카테고리 설정
                    if not categories:
                        categories = ['IT/컴퓨터', '프로그래밍']
                    
                    detail_info['category'] = ' > '.join(categories)

        except Exception as e:
            print(f"  ❌ 상세 페이지 크롤링 실패 ({book_link}): {e}")
        return detail_info

    def _simple_extract(self, soup, keyword, max_results):
        return []
    
    def get_competitor_analysis(self, books, top_books_count=10):
        return {}
    
    def print_analysis_result(self, analysis, keyword):
        pass
