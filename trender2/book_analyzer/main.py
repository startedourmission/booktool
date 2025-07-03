import os
import sys
import pandas as pd

# 이 파일이 있는 디렉토리를 기준으로 경로 설정
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# 크롤러 및 분석 모듈 임포트
from yes24_crawler import Yes24Crawler
from src.market_analysis import publisher_positioning_analysis, book_positioning_analysis, trend_keyword_analysis, market_share_analysis
from src.planning_analysis import audience_analysis

def keyword_analysis(search_keyword):
    """키워드별 시장 분석"""
    print(f"\n'{search_keyword}' 키워드로 YES24에서 도서 정보를 크롤링합니다...")
    crawler = Yes24Crawler()
    crawled_books = crawler.search_books(search_keyword, max_results=50, it_books_only=True)

    if not crawled_books:
        print("크롤링된 도서 데이터가 없습니다. 검색 키워드를 확인하거나 네트워크 상태를 점검해주세요.")
        return

    # 크롤링된 데이터를 DataFrame으로 변환
    df_books = pd.DataFrame(crawled_books)

    # 필요한 숫자형 컬럼 타입 변환
    for col in ['price', 'pages', 'sales_rank']:
        if col in df_books.columns:
            df_books[col] = pd.to_numeric(df_books[col], errors='coerce').fillna(0).astype(int)

    print(f"총 {len(df_books)}권의 도서 정보를 불러왔습니다.\n")

    # 키워드별 시장 분석 실행
    publisher_positioning_analysis(df_books.copy())
    book_positioning_analysis(df_books.copy())
    trend_keyword_analysis(df_books.copy())
    market_share_analysis(df_books.copy())

    # 기획 분석 실행
    audience_analysis(df_books.copy())

def market_overview():
    """전체 IT 도서 시장 분석"""
    print("\n전체 IT 도서 시장 분석을 시작합니다...")
    print("IT/모바일 카테고리 상위 100개 도서를 수집 중입니다...")
    
    crawler = Yes24Crawler()
    # IT 카테고리에서 상위 100개 도서 수집 (키워드 없이)
    all_books = crawler.get_it_bestsellers(max_results=100)
    
    if not all_books:
        print("❌ 전체 시장 데이터 수집에 실패했습니다.")
        return
    
    df_market = pd.DataFrame(all_books)
    
    # 데이터 타입 변환
    for col in ['price', 'pages', 'sales_rank']:
        if col in df_market.columns:
            df_market[col] = pd.to_numeric(df_market[col], errors='coerce').fillna(0).astype(int)
    
    print(f"💻 전체 IT 시장: {len(df_market)}권의 고유 도서 수집 완료\n")
    
    # 전체 시장 분석 실행
    from src.market_overview import overall_market_analysis, create_interactive_charts
    overall_market_analysis(df_market.copy())
    create_interactive_charts(df_market.copy())

def main():
    """메인 실행 함수"""
    print("IT 도서 시장 분석 도구를 시작합니다.")
    print("========================================\n")

    # 명령줄 인자 확인
    if len(sys.argv) < 2:
        print("📊 키워드가 입력되지 않았습니다. 전체 IT 시장 분석을 진행합니다.")
        print("💡 특정 키워드 분석을 원하시면: uv run python3 main.py <키워드>")
        print("   예시: uv run python3 main.py 파이썬\n")
        market_overview()
    else:
        search_keyword = sys.argv[1]
        print(f"🎯 '{search_keyword}' 키워드 분석을 진행합니다.\n")
        keyword_analysis(search_keyword)

    print("분석이 완료되었습니다.")

if __name__ == '__main__':
    main()