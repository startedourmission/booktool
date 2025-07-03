import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.offline as pyo
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np
import os
from datetime import datetime

def overall_market_analysis(df):
    """전체 IT 도서 시장 분석"""
    if df.empty:
        print("분석할 데이터가 없습니다.")
        return

    print("\n[전체 시장 분석] IT 도서 시장 개요")
    print("=================================================")
    
    # 기본 통계
    total_books = len(df)
    avg_price = df['price'].mean()
    median_price = df['price'].median()
    avg_pages = df[df['pages'] > 0]['pages'].mean()
    
    print(f"📊 시장 규모")
    print(f"  - 총 도서 수: {total_books:,}권")
    print(f"  - 평균 가격: {avg_price:,.0f}원")
    print(f"  - 중간 가격: {median_price:,.0f}원")
    print(f"  - 평균 페이지: {avg_pages:.0f}페이지")
    
    # 가격대별 분포
    print(f"\n💰 가격대별 분포")
    price_ranges = [
        (0, 15000, "저가 (1.5만원 이하)"),
        (15000, 25000, "중가 (1.5~2.5만원)"),
        (25000, 35000, "고가 (2.5~3.5만원)"),
        (35000, float('inf'), "프리미엄 (3.5만원 이상)")
    ]
    
    for min_price, max_price, label in price_ranges:
        if max_price == float('inf'):
            count = len(df[df['price'] >= min_price])
        else:
            count = len(df[(df['price'] >= min_price) & (df['price'] < max_price)])
        percentage = (count / total_books) * 100
        print(f"  - {label}: {count:,}권 ({percentage:.1f}%)")
    
    # 키워드별 시장 점유율
    print(f"\n🔥 키워드별 시장 점유율")
    keyword_counts = df['search_keyword'].value_counts()
    print(f"{'순위':<4} {'키워드':<12} {'도서수':<8} {'점유율':<8}")
    print("-" * 35)
    for i, (keyword, count) in enumerate(keyword_counts.head(10).items(), 1):
        percentage = (count / total_books) * 100
        print(f"{i:<4} {keyword:<12} {count:<8} {percentage:<7.1f}%")
    
    # 출판사 상위 10개
    print(f"\n🏢 주요 출판사 (전체 시장)")
    publisher_counts = df['publisher'].value_counts()
    print(f"{'순위':<4} {'출판사':<20} {'도서수':<8} {'점유율':<8}")
    print("-" * 45)
    for i, (publisher, count) in enumerate(publisher_counts.head(10).items(), 1):
        percentage = (count / total_books) * 100
        print(f"{i:<4} {publisher:<20} {count:<8} {percentage:<7.1f}%")
    
    print("\n")

def clustering_analysis(df):
    """도서 클러스터링 분석"""
    if len(df) < 10:
        print("클러스터링 분석을 위한 데이터가 부족합니다.")
        return None
        
    # 클러스터링용 데이터 준비
    cluster_data = df[['price', 'pages', 'sales_rank']].copy()
    
    # 0값 처리
    avg_pages = cluster_data[cluster_data['pages'] > 0]['pages'].mean()
    cluster_data['pages'] = cluster_data['pages'].replace(0, avg_pages)
    cluster_data['sales_rank'] = cluster_data['sales_rank'].replace(0, 1)
    
    # 정규화
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(cluster_data)
    
    # K-means 클러스터링
    n_clusters = min(5, len(df) // 10)  # 적절한 클러스터 수
    if n_clusters < 2:
        n_clusters = 2
        
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(scaled_data)
    
    return df

def create_interactive_charts(df):
    """Plotly 인터랙티브 차트 생성"""
    if df.empty:
        print("차트 생성을 위한 데이터가 없습니다.")
        return
    
    # 출력 디렉토리 생성
    charts_dir = "charts"
    if not os.path.exists(charts_dir):
        os.makedirs(charts_dir)
    
    # 클러스터링 분석
    df_clustered = clustering_analysis(df.copy())
    if df_clustered is None:
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 1. 출판사 포지셔닝 차트
    create_publisher_positioning_chart(df_clustered, charts_dir, timestamp)
    
    # 2. 도서 클러스터링 차트  
    create_book_clustering_chart(df_clustered, charts_dir, timestamp)
    
    # 3. 가격-판매지수 분포 차트
    create_price_sales_chart(df_clustered, charts_dir, timestamp)
    
    # 4. 키워드별 시장 분석 차트
    create_keyword_analysis_chart(df_clustered, charts_dir, timestamp)

def create_publisher_positioning_chart(df, charts_dir, timestamp):
    """출판사 포지셔닝 차트 생성"""
    # 출판사별 집계
    avg_pages = df[df['pages'] > 0]['pages'].mean()
    df['pages_fixed'] = df['pages'].apply(lambda x: avg_pages if x == 0 else x)
    df['price_per_page'] = df['price'] / df['pages_fixed']
    
    publisher_data = df.groupby('publisher').agg({
        'price_per_page': 'mean',
        'sales_rank': 'mean',
        'title': 'count',
        'price': 'mean'
    }).reset_index()
    
    # 도서 5권 이상인 출판사만
    publisher_data = publisher_data[publisher_data['title'] >= 5]
    
    fig = px.scatter(
        publisher_data, 
        x='price_per_page', 
        y='sales_rank',
        size='title',
        hover_data=['price'],
        text='publisher',
        title='출판사 포지셔닝 분석 (IT 도서 시장)',
        labels={
            'price_per_page': '평균 쪽단가 (원)',
            'sales_rank': '평균 판매지수',
            'title': '도서 수'
        }
    )
    
    fig.update_traces(
        textposition="top center",
        textfont_size=10
    )
    
    fig.update_layout(
        width=900,
        height=600,
        showlegend=False
    )
    
    filename = f"publisher_positioning_{timestamp}.html"
    filepath = os.path.join(charts_dir, filename)
    fig.write_html(filepath)
    print(f"📊 출판사 포지셔닝 차트: file://{os.path.abspath(filepath)}")

def create_book_clustering_chart(df, charts_dir, timestamp):
    """도서 클러스터링 차트 생성"""
    if 'cluster' not in df.columns:
        return
        
    fig = px.scatter_3d(
        df,
        x='price',
        y='pages', 
        z='sales_rank',
        color='cluster',
        hover_data=['title', 'publisher'],
        title='IT 도서 클러스터링 분석 (가격-페이지-판매지수)',
        labels={
            'price': '가격 (원)',
            'pages': '페이지 수',
            'sales_rank': '판매지수',
            'cluster': '클러스터'
        }
    )
    
    fig.update_layout(
        width=900,
        height=700
    )
    
    filename = f"book_clustering_{timestamp}.html"
    filepath = os.path.join(charts_dir, filename)
    fig.write_html(filepath)
    print(f"📊 도서 클러스터링 차트: file://{os.path.abspath(filepath)}")

def create_price_sales_chart(df, charts_dir, timestamp):
    """가격-판매지수 분포 차트"""
    fig = px.scatter(
        df,
        x='price',
        y='sales_rank',
        color='search_keyword',
        size='pages',
        hover_data=['title', 'publisher'],
        title='IT 도서 가격 vs 판매지수 분포',
        labels={
            'price': '가격 (원)',
            'sales_rank': '판매지수',
            'search_keyword': '키워드',
            'pages': '페이지 수'
        }
    )
    
    fig.update_layout(
        width=900,
        height=600
    )
    
    filename = f"price_sales_distribution_{timestamp}.html"
    filepath = os.path.join(charts_dir, filename)
    fig.write_html(filepath)
    print(f"📊 가격-판매지수 분포 차트: file://{os.path.abspath(filepath)}")

def create_keyword_analysis_chart(df, charts_dir, timestamp):
    """키워드별 시장 분석 차트"""
    # 키워드별 평균 가격과 판매지수
    keyword_data = df.groupby('search_keyword').agg({
        'price': 'mean',
        'sales_rank': 'mean', 
        'title': 'count'
    }).reset_index()
    
    # 서브플롯 생성
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            '키워드별 평균 가격',
            '키워드별 평균 판매지수', 
            '키워드별 도서 수',
            '키워드별 가격 vs 판매지수'
        ),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # 평균 가격
    fig.add_trace(
        go.Bar(x=keyword_data['search_keyword'], y=keyword_data['price'], name='평균 가격'),
        row=1, col=1
    )
    
    # 평균 판매지수
    fig.add_trace(
        go.Bar(x=keyword_data['search_keyword'], y=keyword_data['sales_rank'], name='평균 판매지수'),
        row=1, col=2
    )
    
    # 도서 수
    fig.add_trace(
        go.Bar(x=keyword_data['search_keyword'], y=keyword_data['title'], name='도서 수'),
        row=2, col=1
    )
    
    # 가격 vs 판매지수
    fig.add_trace(
        go.Scatter(
            x=keyword_data['price'], 
            y=keyword_data['sales_rank'],
            mode='markers+text',
            text=keyword_data['search_keyword'],
            textposition="top center",
            name='키워드 포지셔닝'
        ),
        row=2, col=2
    )
    
    fig.update_layout(
        height=800,
        title_text="키워드별 종합 시장 분석",
        showlegend=False
    )
    
    filename = f"keyword_analysis_{timestamp}.html"
    filepath = os.path.join(charts_dir, filename)
    fig.write_html(filepath)
    print(f"📊 키워드별 시장 분석 차트: file://{os.path.abspath(filepath)}")
    
    print(f"\n🔗 모든 차트가 '{charts_dir}' 폴더에 저장되었습니다.")
    print(f"💡 브라우저에서 파일을 열어 인터랙티브 차트를 확인하세요!")