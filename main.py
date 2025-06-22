#!/usr/bin/env python3
"""
한국 도서 시장 분석 프로그램
키워드를 입력하면 네이버/구글 검색 트렌드를 분석하고 관련 저자 후보를 찾아주는 프로그램
"""

import sys
import argparse
from datetime import datetime

from naver_trends import NaverTrends
from google_trends import GoogleTrends
from visualizer import TrendVisualizer
from author_finder import AuthorFinder
from yes24_crawler import Yes24Crawler

class BookMarketAnalyzer:
    def __init__(self):
        self.naver_trends = NaverTrends()
        self.google_trends = GoogleTrends()
        self.visualizer = TrendVisualizer()
        self.author_finder = AuthorFinder()
        self.yes24_crawler = Yes24Crawler()
        
    def analyze_keyword(self, keyword, days=30, find_authors=True, find_competitors=True, it_books_only=False):
        """
        키워드를 분석하여 트렌드와 저자 정보를 제공합니다.
        
        Args:
            keyword: 분석할 키워드
            days: 분석 기간 (일)
            find_authors: 저자 검색 여부
            find_competitors: 경쟁서 분석 여부
            it_books_only: IT 도서만 검색할지 여부
        """
        print(f"\n📊 '{keyword}' 키워드 분석을 시작합니다...")
        print("=" * 50)
        
        # 1. 트렌드 데이터 수집
        print("🔍 검색 트렌드 데이터 수집 중...")
        
        # 네이버 트렌드 데이터
        naver_data = self.naver_trends.get_search_trends(keyword, days)
        if naver_data:
            print("✅ 네이버 트렌드 데이터 수집 완료")
        else:
            print("❌ 네이버 트렌드 데이터 수집 실패")
            
        # 구글 트렌드 데이터
        google_data = self.google_trends.get_search_trends(keyword, days)
        if google_data:
            print("✅ 구글 트렌드 데이터 수집 완료")
        else:
            print("❌ 구글 트렌드 데이터 수집 실패")
        
        # 2. 트렌드 시각화
        print("\n📈 트렌드 그래프 생성 중...")
        
        if naver_data and google_data:
            # 비교 그래프
            self.visualizer.plot_comparison_trends(naver_data, google_data)
            
            # 개별 그래프
            self.visualizer.plot_single_trend(naver_data, "네이버")
            self.visualizer.plot_single_trend(google_data, "구글")
            
            # 트렌드 요약
            self.visualizer.create_trend_summary(google_data)
            
        elif google_data:
            self.visualizer.plot_single_trend(google_data, "구글")
            self.visualizer.create_trend_summary(google_data)
            
        elif naver_data:
            self.visualizer.plot_single_trend(naver_data, "네이버")
            self.visualizer.create_trend_summary(naver_data)
        
        # 3. 관련 키워드 분석
        print("\n🔗 관련 키워드 분석 중...")
        related_queries = self.google_trends.get_related_queries(keyword)
        if related_queries:
            print("📝 관련 검색어:")
            for i, query in enumerate(related_queries[:5], 1):
                print(f"  {i}. {query}")
        
        # 4. 저자 후보 검색
        authors = []
        if find_authors:
            print("\n👨‍💼 저자 후보 검색 중...")
            authors = self.author_finder.search_authors_by_keyword(keyword, 10)
            
            if authors:
                print(f"📚 '{keyword}' 관련 저자 후보 ({len(authors)}명):")
                for i, author in enumerate(authors, 1):
                    book_info = f" - {author.get('book_title', '')}" if author.get('book_title') else ""
                    print(f"  {i}. {author['name']} (출처: {author['source']}){book_info}")
            else:
                print("❌ 저자 후보를 찾을 수 없습니다.")
        
        # 5. 경쟁서 분석 (YES24)
        competitor_books = []
        if find_competitors:
            print("\n📖 경쟁서 분석 중...")
            competitor_books = self.yes24_crawler.search_books(keyword, 10, it_books_only)
            
            if competitor_books:
                analysis = self.yes24_crawler.get_competitor_analysis(competitor_books)
                self.yes24_crawler.print_analysis_result(analysis, keyword)
            else:
                print("❌ 경쟁서 정보를 찾을 수 없습니다.")
        
        print("\n✅ 분석 완료!")
        return {
            'naver_data': naver_data,
            'google_data': google_data,
            'related_queries': related_queries,
            'authors': authors,
            'competitor_books': competitor_books
        }
    
    def compare_keywords(self, keywords, days=30):
        """
        여러 키워드를 비교 분석합니다.
        """
        print(f"\n📊 키워드 비교 분석: {', '.join(keywords)}")
        print("=" * 50)
        
        # 구글 트렌드에서 키워드 비교
        comparison_data = self.google_trends.compare_keywords(keywords, days)
        
        if comparison_data:
            # 비교 그래프 생성
            self.visualizer.plot_multiple_keywords(comparison_data)
            
            # 각 키워드별 요약
            for keyword in keywords:
                if keyword in comparison_data['data']:
                    values = comparison_data['data'][keyword]
                    trend_data = {
                        'keyword': keyword,
                        'period': comparison_data['period'],
                        'dates': comparison_data['dates'],
                        'values': values
                    }
                    self.visualizer.create_trend_summary(trend_data)
        
        return comparison_data
    
    def find_trending_authors(self, keywords):
        """
        여러 키워드를 기반으로 트렌딩 저자를 찾습니다.
        """
        print(f"\n👨‍💼 트렌딩 저자 분석: {', '.join(keywords)}")
        print("=" * 50)
        
        trending_authors = self.author_finder.find_trending_authors(keywords)
        
        if trending_authors:
            print(f"🔥 트렌딩 저자 TOP {len(trending_authors)}:")
            for i, author_data in enumerate(trending_authors, 1):
                author = author_data['author']
                count = author_data['count']
                keywords_list = author_data['keywords']
                
                print(f"  {i}. {author['name']}")
                print(f"     언급 횟수: {count}회")
                print(f"     관련 키워드: {', '.join(set(keywords_list))}")
                print()
        
        return trending_authors

def main():
    parser = argparse.ArgumentParser(
        description='한국 도서 시장 분석 프로그램',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  python main.py "인공지능"                    # 단일 키워드 분석
  python main.py "인공지능" "머신러닝" --compare   # 키워드 비교 분석
  python main.py "AI" --days 60               # 60일간 트렌드 분석
  python main.py "데이터과학" --no-authors      # 저자 검색 제외
  python main.py "블록체인" --no-competitors    # 경쟁서 분석 제외
  python main.py "파이썬" --it-books-only      # IT 도서만 검색
        """
    )
    
    parser.add_argument(
        'keywords',
        nargs='+',
        help='분석할 키워드 (하나 이상)'
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='분석 기간 (일수, 기본값: 30일)'
    )
    
    parser.add_argument(
        '--compare',
        action='store_true',
        help='여러 키워드 비교 분석 모드'
    )
    
    parser.add_argument(
        '--no-authors',
        action='store_true',
        help='저자 검색 제외'  
    )
    
    parser.add_argument(
        '--trending-authors',
        action='store_true',
        help='트렌딩 저자 분석 모드'
    )
    
    parser.add_argument(
        '--no-competitors',
        action='store_true',
        help='경쟁서 분석 제외'
    )
    
    parser.add_argument(
        '--it-books-only',
        action='store_true',
        help='IT 도서만 검색 (YES24 경쟁서 분석시)'
    )
    
    args = parser.parse_args()
    
    # 분석기 초기화
    analyzer = BookMarketAnalyzer()
    
    try:
        if args.compare and len(args.keywords) > 1:
            # 키워드 비교 분석
            result = analyzer.compare_keywords(args.keywords, args.days)
            
        elif args.trending_authors:
            # 트렌딩 저자 분석
            result = analyzer.find_trending_authors(args.keywords)
            
        else:
            # 단일 키워드 분석
            if len(args.keywords) == 1:
                result = analyzer.analyze_keyword(
                    args.keywords[0], 
                    args.days, 
                    not args.no_authors,
                    not args.no_competitors,
                    args.it_books_only
                )
            else:
                # 여러 키워드를 각각 분석
                results = []
                for keyword in args.keywords:
                    result = analyzer.analyze_keyword(
                        keyword, 
                        args.days, 
                        not args.no_authors,
                        not args.no_competitors,
                        args.it_books_only
                    )
                    results.append(result)
                result = results
        
        print(f"\n🎉 분석이 완료되었습니다! ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 분석이 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 오류가 발생했습니다: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
