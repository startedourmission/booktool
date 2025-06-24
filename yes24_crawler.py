import requests
from bs4 import BeautifulSoup
import re
import urllib.parse

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
        
        # 먼저 메인 페이지에 접속해서 세션 설정
        try:
            self.session.get("https://www.yes24.com", timeout=10)
        except:
            pass
    
    def search_books(self, keyword, max_results=20, it_books_only=False):
        """
        YES24에서 키워드로 도서를 검색하고 경쟁서 정보를 수집합니다.
        
        Args:
            keyword: 검색 키워드
            max_results: 최대 결과 수
            it_books_only: True면 국내 IT 도서만 검색
        """
        books = []
        
        try:
            # YES24 검색 URL 구성 (실제 URL 패턴)
            search_url = f"{self.base_url}/product/search"
            
            if it_books_only:
                # 국내 IT 도서 전용 검색
                params = {
                    'domain': 'BOOK',
                    'query': keyword,
                    'page': 1,
                    'size': max_results,
                    'dispNo2': '001001003'  # IT 모바일 카테고리
                }
                print(f"🔍 YES24에서 '{keyword}' IT 도서 전용 검색 중...")
            else:
                # 일반 검색
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
                
                # 디버깅: 페이지에서 어떤 요소들이 있는지 확인
                print(f"📄 전체 페이지 크기: {len(response.text)} chars")
                
                # path.txt의 실제 구조 기반으로 정확한 선택자 사용
                print("🔍 실제 HTML 구조 분석 중...")
                
                # 먼저 yesSchList가 있는지 확인
                main_list = soup.find('ul', id='yesSchList')
                if main_list:
                    print(f"✅ yesSchList 발견")
                    # 실제 상품 li들 찾기 (data-goods-no가 있는 것들)
                    book_items = main_list.find_all('li', attrs={'data-goods-no': True})
                    print(f"📊 data-goods-no가 있는 상품: {len(book_items)}개")
                    
                    if book_items:
                        print(f"✅ 실제 상품 목록을 사용합니다.")
                    else:
                        # data-goods-no가 없다면 일반 li들 확인
                        all_lis = main_list.find_all('li')
                        print(f"📊 전체 li 개수: {len(all_lis)}")
                        # 빈 li들 제외하고 실제 내용이 있는 것만
                        book_items = [li for li in all_lis if li.find('a', class_='gd_name')]
                        print(f"📊 gd_name이 있는 li: {len(book_items)}개")
                else:
                    print("❌ yesSchList를 찾을 수 없음")
                    book_items = []
                
                # fallback 시도
                if not book_items:
                    print("🔄 fallback 선택자들 시도 중...")
                    selectors_to_try = [
                        ('li[data-goods-no]', '굿즈 번호가 있는 아이템'),
                        ('div.itemUnit', '아이템 유닛 div'),
                        ('div.item_info', '상품 정보')
                    ]
                    
                    for selector, description in selectors_to_try:
                        items = soup.select(selector)
                        print(f"📊 {description}: {len(items)}개")
                        if items:
                            book_items = items
                            print(f"✅ {description}을 사용합니다.")
                            break
                
                # 상품 정보 추출
                books = []
                if book_items:
                    print(f"📚 {len(book_items)}개의 상품에서 정보 추출 중...")
                    
                    for i, item in enumerate(book_items[:max_results]):
                        try:
                            book_info = self._extract_book_info(item, keyword)
                            if book_info and book_info.get('title'):
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
        
        return books
    
    def _extract_book_info(self, item, keyword):
        """
        실제 HTML 구조를 바탕으로 도서 정보를 추출합니다.
        """
        book_info = {}
        
        # 제목 추출 - 여러 패턴 시도
        title_elem = item.find('a', class_='gd_name')
        if not title_elem:
            # 다른 패턴들 시도
            title_elem = item.select_one('a[href*="/product/goods/"]')
            if not title_elem:
                title_elem = item.select_one('.item_info a')
        
        if title_elem:
            title = title_elem.get_text().strip()
            if len(title) > 3:
                book_info['title'] = title
                # 링크 URL 추출
                if title_elem.get('href'):
                    book_info['link'] = self.base_url + title_elem.get('href')
                else:
                    book_info['link'] = '링크 없음'
            else:
                return None
        else:
            return None
        
        # 저자 정보 추출 - <span class="authPub info_auth">
        author_elem = item.find('span', class_='authPub info_auth')
        if author_elem:
            # HTML 내의 링크 텍스트만 추출
            author_link = author_elem.find('a')
            if author_link:
                author = author_link.get_text().strip()
            else:
                author = author_elem.get_text().strip()
            
            # "저" 제거
            author = re.sub(r'\s*저\s*$', '', author).strip()
            book_info['author'] = author if author else '저자 정보 없음'
        else:
            book_info['author'] = '저자 정보 없음'
        
        # 출판사 정보 추출 - <span class="authPub info_pub">
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
        
        # 가격 정보 추출 - <em class="yes_b">
        price_elem = item.find('em', class_='yes_b')
        if price_elem:
            price = price_elem.get_text().strip()
            # 숫자와 쉼표만 추출
            price = re.sub(r'[^\d,]', '', price)
            book_info['price'] = price if price else '가격 정보 없음'
        else:
            book_info['price'] = '가격 정보 없음'
        
        # 판매지수 추출 - <span class="saleNum">
        sales_elem = item.find('span', class_='saleNum')
        if sales_elem:
            sales_text = sales_elem.get_text().strip()
            # "판매지수 480" 형태에서 숫자만 추출
            sales_numbers = re.findall(r'\d+(?:,\d+)*', sales_text)
            if sales_numbers:
                book_info['sales_index'] = f"판매지수: {sales_numbers[0]}"
            else:
                book_info['sales_index'] = sales_text
        else:
            book_info['sales_index'] = '판매지수 정보 없음'
        
        # 검색 키워드 추가
        book_info['search_keyword'] = keyword
        book_info['source'] = 'yes24'
        
        return book_info
    
    
    def _simple_extract(self, soup, keyword, max_results):
        """
        간단한 방법으로 정보 추출
        """
        books = []
        
        try:
            # 모든 상품 링크에서 제목 추출
            product_links = soup.find_all('a', href=re.compile(r'/Product/Goods/|/goods/'))
            
            for i, link in enumerate(product_links[:max_results]):
                try:
                    title = link.get_text().strip()
                    if len(title) > 5 and not re.search(r'^\d+$', title):  # 의미있는 제목만
                        # 부모 요소에서 추가 정보 찾기
                        parent = link.find_parent(['div', 'li', 'tr', 'td'])
                        
                        # 출판사 정보 찾기
                        publisher = '출판사 정보 없음'
                        if parent:
                            pub_text = parent.get_text()
                            pub_patterns = [
                                r'출판사?\s*[:\-]?\s*([가-힣\w\s&]+)',
                                r'([가-힣\w&]+)\s*출판',
                                r'저자.*?([가-힣\w&]+)\s*\|'
                            ]
                            for pattern in pub_patterns:
                                match = re.search(pattern, pub_text)
                                if match:
                                    publisher = match.group(1).strip()
                                    break
                        
                        books.append({
                            'title': title,
                            'publisher': publisher,
                            'sales_index': f'순위: {i+1}',
                            'author': '저자 정보 없음',
                            'price': '가격 정보 없음',
                            'search_keyword': keyword,
                            'source': 'yes24',
                            'link': self.base_url + link.get('href') if link.get('href') else '링크 없음'
                        })
                        
                        if len(books) >= max_results:
                            break
                except:
                    continue
                    
        except Exception as e:
            print(f"간단 추출 실패: {e}")
        
        return books
    
    def get_competitor_analysis(self, books, top_books_count=10):
        """
        수집된 도서 데이터를 분석하여 경쟁서 분석 정보를 제공합니다.
        
        Args:
            books: 분석할 도서 목록
            top_books_count: 상위 도서 표시 개수 (기본값: 10)
        """
        if not books:
            return {}
        
        analysis = {
            'total_books': len(books),
            'publishers': {},
            'price_range': {'min': float('inf'), 'max': 0, 'avg': 0},
            'sales_index_range': {'min': float('inf'), 'max': 0, 'avg': 0},
            'top_books': books[:top_books_count],
            'publisher_analysis': {}
        }
        
        # 출판사별 분석
        for book in books:
            publisher = book['publisher']
            if publisher != '출판사 정보 없음':
                if publisher not in analysis['publishers']:
                    analysis['publishers'][publisher] = 0
                analysis['publishers'][publisher] += 1
        
        # 가격 분석 (0 제외)
        valid_prices = []
        for book in books:
            price_str = book['price']
            if price_str != '가격 정보 없음':
                price_num = re.sub(r'[^\d]', '', price_str)
                if price_num.isdigit():
                    price = int(price_num)
                    if price > 0:  # 0 제외
                        valid_prices.append(price)
                        analysis['price_range']['min'] = min(analysis['price_range']['min'], price)
                        analysis['price_range']['max'] = max(analysis['price_range']['max'], price)
        
        if valid_prices:
            analysis['price_range']['avg'] = sum(valid_prices) / len(valid_prices)
        else:
            analysis['price_range'] = {'min': 0, 'max': 0, 'avg': 0}
        
        # 판매지수 분석 (0 제외)
        valid_sales_indices = []
        for book in books:
            sales_str = book['sales_index']
            if sales_str != '판매지수 정보 없음' and not sales_str.startswith('순위:'):
                # "판매지수: 1234" 형태에서 숫자만 추출
                sales_numbers = re.findall(r'\d+(?:,\d+)*', sales_str)
                if sales_numbers:
                    # 쉼표 제거 후 숫자로 변환
                    sales_index = int(sales_numbers[0].replace(',', ''))
                    if sales_index > 0:  # 0 제외
                        valid_sales_indices.append(sales_index)
                        analysis['sales_index_range']['min'] = min(analysis['sales_index_range']['min'], sales_index)
                        analysis['sales_index_range']['max'] = max(analysis['sales_index_range']['max'], sales_index)
        
        if valid_sales_indices:
            analysis['sales_index_range']['avg'] = sum(valid_sales_indices) / len(valid_sales_indices)
        else:
            analysis['sales_index_range'] = {'min': 0, 'max': 0, 'avg': 0}
        
        # 주요 출판사 분석
        sorted_publishers = sorted(analysis['publishers'].items(), key=lambda x: x[1], reverse=True)
        analysis['top_publishers'] = sorted_publishers[:5]
        
        return analysis
    
    def print_analysis_result(self, analysis, keyword):
        """
        분석 결과를 보기 좋게 출력합니다.
        """
        print(f"\n📊 '{keyword}' 경쟁서 분석 결과")
        print("=" * 50)
        
        print(f"📚 총 수집 도서: {analysis['total_books']}권")
        
        if analysis['top_publishers']:
            print(f"\n🏢 주요 출판사:")
            for i, (publisher, count) in enumerate(analysis['top_publishers'], 1):
                print(f"  {i}. {publisher}: {count}권")
        
        if analysis['price_range']['avg'] > 0:
            print(f"\n💰 가격 분석:")
            print(f"  최저가: {analysis['price_range']['min']:,}원")
            print(f"  최고가: {analysis['price_range']['max']:,}원")
            print(f"  평균가: {analysis['price_range']['avg']:,.0f}원")
        
        if analysis['sales_index_range']['avg'] > 0:
            print(f"\n📈 판매지수 분석:")
            print(f"  최저 판매지수: {analysis['sales_index_range']['min']:,}")
            print(f"  최고 판매지수: {analysis['sales_index_range']['max']:,}")
            print(f"  평균 판매지수: {analysis['sales_index_range']['avg']:,.0f}")
        
        if analysis['top_books']:
            print(f"\n🔥 상위 도서:")
            for i, book in enumerate(analysis['top_books'], 1):
                print(f"  {i}. {book['title'][:40]}")
                print(f"     저자: {book['author']}")
                print(f"     출판사: {book['publisher']} | 판매지수: {book['sales_index']}")
                if book.get('price') and book['price'] != '가격 정보 없음':
                    print(f"     가격: {book['price']}원")
                if book.get('link') and book['link'] != '링크 없음':
                    print(f"     링크: {book['link']}")
                print()
        
        print("=" * 50)