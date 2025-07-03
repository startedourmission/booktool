import pandas as pd

# 분석을 위한 키워드 사전
difficulty_keywords = {
    '입문': 1, '초보': 1, '쉬운': 1, '기초': 2, '기본': 2, '처음': 1,
    '실무': 3, '활용': 3, '실전': 3, '알고리즘': 4, '코딩테스트': 4,
    '심화': 4, '고급': 4, '전문': 5, '아키텍처': 5, '정복': 5, '완벽': 4
}

target_keywords = {
    '입문': '초보자', '초보': '초보자', '학생': '학생', '처음': '초보자',
    '대학생': '대학생', '코딩테스트': '취준생', '취업': '취준생', 
    '주니어': '주니어 개발자', '이직': '경력자', '시니어': '시니어 개발자', 
    '실무': '실무자', '관리자': '관리자', '전문': '전문가'
}

def calculate_difficulty_score(text):
    """텍스트에서 난이도 점수를 계산합니다."""
    score = 0
    count = 0
    for keyword, value in difficulty_keywords.items():
        if keyword in text:
            score += value
            count += 1
    return score / count if count > 0 else 0

def get_target_audience(text):
    """텍스트에서 대상 독자를 추출합니다."""
    for keyword, audience in target_keywords.items():
        if keyword in text:
            return audience
    return '일반'

def audience_analysis(df):
    """독자군 분석을 수행합니다."""
    if df.empty:
        print("분석할 데이터가 없습니다.")
        return

    print("\n[기획 분석] 1. 독자군 분석")
    print("=================================================")
    
    # 텍스트 분석용 컬럼 생성
    df['text_for_analysis'] = df['title'] + ' ' + df['keywords'].fillna('')
    df['difficulty_score'] = df['text_for_analysis'].apply(calculate_difficulty_score)
    df['target_audience'] = df['text_for_analysis'].apply(get_target_audience)
    
    # 난이도별 분석
    print("📊 난이도별 도서 분포")
    print("-------------------------------------------------")
    difficulty_mapping = {0: '미분류', 1: '입문', 2: '기초', 3: '실무', 4: '고급', 5: '전문'}
    
    df['difficulty_level'] = df['difficulty_score'].apply(lambda x: 
        5 if x >= 4.5 else 
        4 if x >= 3.5 else 
        3 if x >= 2.5 else 
        2 if x >= 1.5 else 
        1 if x >= 0.5 else 0)
    
    difficulty_counts = df['difficulty_level'].value_counts().sort_index()
    
    print(f"{'난이도':<8} {'도서수':<8} {'비율':<8}")
    print("-" * 25)
    total = len(df)
    for level, count in difficulty_counts.items():
        level_name = difficulty_mapping[level]
        percentage = (count / total) * 100
        print(f"{level_name:<8} {count:<8} {percentage:<7.1f}%")
    
    print("\n📊 대상 독자별 도서 분포")
    print("-------------------------------------------------")
    audience_counts = df['target_audience'].value_counts()
    
    print(f"{'대상독자':<12} {'도서수':<8} {'비율':<8}")
    print("-" * 30)
    for audience, count in audience_counts.head(8).items():
        percentage = (count / total) * 100
        print(f"{audience:<12} {count:<8} {percentage:<7.1f}%")
    
    # 난이도별 추천 도서
    print("\n📚 난이도별 추천 도서")
    print("-------------------------------------------------")
    
    for level in [1, 2, 3, 4]:
        if level in difficulty_counts and difficulty_counts[level] > 0:
            level_books = df[df['difficulty_level'] == level].nlargest(3, 'sales_rank')
            level_name = difficulty_mapping[level]
            print(f"\n[{level_name} 수준 추천도서]")
            for i, (_, book) in enumerate(level_books.iterrows(), 1):
                title = book['title'][:40] + "..." if len(book['title']) > 40 else book['title']
                print(f"  {i}. {title} ({book['publisher']})")
    
    print("\n")