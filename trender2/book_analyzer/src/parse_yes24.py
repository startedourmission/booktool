
import os
from bs4 import BeautifulSoup
import pandas as pd

def parse_book_html(file_path):
    """YES24 도서 HTML 파일을 파싱하여 주요 정보를 추출합니다."""
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    book_info = {}
    
    # 기본 정보 추출
    book_info['title'] = soup.find('h2', class_='gd_name').text.strip()
    book_info['author'] = soup.find('span', class_='gd_auth').text.strip()
    book_info['publisher'] = soup.find('span', class_='gd_pub').text.strip()
    
    # 가격 (숫자만 추출)
    price_str = soup.find('em', class_='yes_b').text.strip().replace(',', '').replace('원', '')
    book_info['price'] = int(price_str)
    
    # 페이지 수 (숫자만 추출)
    page_str = soup.find('span', class_='gd_page').text.strip().replace('쪽', '')
    book_info['pages'] = int(page_str)
    
    # 출간일
    book_info['published_date'] = soup.find('span', class_='gd_date').text.strip()
    
    # 판매지수 (숫자만 추출)
    ranking_str = soup.find('span', class_='gd_ranking').text.strip().replace('판매지수', '').replace(',', '').strip()
    book_info['sales_rank'] = int(ranking_str)
    
    # 키워드
    keywords = [tag.text.strip() for tag in soup.select('ul.gd_tag li')]
    book_info['keywords'] = ', '.join(keywords)
    
    # 카테고리
    categories = [cate.text.strip() for cate in soup.select('.gd_cate a')]
    book_info['category'] = ' > '.join(categories)
    
    return book_info

def parse_all_books(data_dir):
    """지정된 디렉토리의 모든 HTML 파일을 파싱하여 DataFrame으로 반환합니다."""
    all_books_data = []
    for filename in os.listdir(data_dir):
        if filename.endswith('.html'):
            file_path = os.path.join(data_dir, filename)
            try:
                book_data = parse_book_html(file_path)
                all_books_data.append(book_data)
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
                
    return pd.DataFrame(all_books_data)

if __name__ == '__main__':
    # 테스트용 코드
    # 프로젝트 루트를 기준으로 상대 경로 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..'))
    data_path = os.path.join(project_root, 'data', 'yes24_pages')
    
    if not os.path.exists(data_path):
        print(f"Error: Data directory not found at {data_path}")
    else:
        df_books = parse_all_books(data_path)
        print("Successfully parsed book data:")
        print(df_books.head())
