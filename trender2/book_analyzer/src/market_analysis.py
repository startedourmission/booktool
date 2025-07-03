import pandas as pd
from collections import Counter

def publisher_positioning_analysis(df):
    """출판사 포지셔닝 분석 (쪽단가 vs 판매지수)을 수행합니다."""
    if df.empty:
        print("분석할 데이터가 없습니다.")
        return

    # 페이지 수가 0인 경우 평균 페이지 수로 대체
    avg_pages = df[df['pages'] > 0]['pages'].mean() if len(df[df['pages'] > 0]) > 0 else 300
    df['pages_fixed'] = df['pages'].apply(lambda x: avg_pages if x == 0 else x)
    df['price_per_page'] = df['price'] / df['pages_fixed']
    
    # 출판사별 집계 (도서 2권 이상인 출판사만)
    publisher_analysis = df.groupby('publisher').agg({
        'price_per_page': 'mean',
        'sales_rank': 'mean',
        'title': 'count'
    }).reset_index()
    publisher_analysis = publisher_analysis[publisher_analysis['title'] >= 2]

    print("\n[시장 분석] 1. 출판사 포지셔닝 분석")
    print("=================================================")
    print("쪽단가가 낮고 판매지수가 높을수록 가성비 좋은 출판사")
    print("-------------------------------------------------")
    
    if publisher_analysis.empty:
        print("분석할 출판사 데이터가 부족합니다.")
        return
    
    # 정렬해서 테이블로 출력 (판매지수가 높고 쪽단가가 낮을수록 좋음)
    publisher_analysis['positioning_score'] = publisher_analysis['sales_rank'] / publisher_analysis['price_per_page']
    publisher_analysis = publisher_analysis.sort_values('positioning_score', ascending=False)
    
    print(f"{'순위':<4} {'출판사':<20} {'평균쪽단가':<10} {'평균판매지수':<12} {'가성비점수':<10}")
    print("-" * 70)
    for i, row in publisher_analysis.head(10).iterrows():
        print(f"{len(publisher_analysis) - list(publisher_analysis.index).index(i):<4} "
              f"{row['publisher']:<20} "
              f"{row['price_per_page']:<10.0f} "
              f"{row['sales_rank']:<12.0f} "
              f"{row['positioning_score']:<10.1f}")
    print("\n")

def book_positioning_analysis(df):
    """서적 포지셔닝 분석 (가격 vs 판매지수)를 수행합니다."""
    if df.empty:
        print("분석할 데이터가 없습니다.")
        return

    print("\n[시장 분석] 2. 서적 포지셔닝 분석")
    print("=================================================")
    print("가격이 낮고 판매지수가 높을수록 가성비 좋은 도서")
    print("-------------------------------------------------")
    
    # 가성비 점수 계산 (판매지수 / 가격)
    df['value_score'] = df['sales_rank'] / df['price']
    top_books = df.nlargest(15, 'value_score')
    
    print(f"{'순위':<4} {'도서명':<40} {'가격':<8} {'판매지수':<10} {'가성비점수':<10}")
    print("-" * 80)
    for i, (_, row) in enumerate(top_books.iterrows(), 1):
        title = row['title'][:35] + "..." if len(row['title']) > 35 else row['title']
        print(f"{i:<4} "
              f"{title:<40} "
              f"{row['price']:<8.0f} "
              f"{row['sales_rank']:<10.0f} "
              f"{row['value_score']:<10.2f}")
    print("\n")

def trend_keyword_analysis(df, top_n=15):
    """키워드 트렌드를 분석합니다."""
    if df.empty or 'keywords' not in df.columns:
        print("키워드 분석을 위한 데이터가 없습니다.")
        return

    print("\n[시장 분석] 3. 키워드 트렌드 분석")
    print("=================================================")
    print(f"상위 {top_n}개 키워드 출현 빈도")
    print("-------------------------------------------------")

    all_keywords = []
    for k_str in df['keywords'].dropna():
        keywords = [k.strip().replace('#', '') for k in k_str.split(',')]
        # 출판사명, 저자명 등 불필요한 키워드 필터링
        filtered_keywords = [k for k in keywords if len(k) > 1 and 
                           not any(x in k for x in ['저', '출판', '미디어', '클럽', '분철'])]
        all_keywords.extend(filtered_keywords)

    if not all_keywords:
        print("분석할 키워드가 없습니다.")
        return

    keyword_counts = Counter(all_keywords)
    top_keywords = keyword_counts.most_common(top_n)

    print(f"{'순위':<4} {'키워드':<20} {'출현횟수':<8}")
    print("-" * 35)
    for i, (keyword, count) in enumerate(top_keywords, 1):
        print(f"{i:<4} {keyword:<20} {count:<8}")
    print("\n")

def market_share_analysis(df):
    """출판사별 시장 점유율을 분석합니다."""
    if df.empty:
        print("점유율 분석을 위한 데이터가 없습니다.")
        return

    print("\n[시장 분석] 4. 출판사 시장점유율")
    print("=================================================")

    publisher_counts = df['publisher'].value_counts()
    total_books = len(df)
    
    print(f"{'순위':<4} {'출판사':<20} {'도서수':<8} {'점유율':<8}")
    print("-" * 45)
    for i, (publisher, count) in enumerate(publisher_counts.head(10).items(), 1):
        percentage = (count / total_books) * 100
        print(f"{i:<4} {publisher:<20} {count:<8} {percentage:<7.1f}%")
    print("\n")