import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import pandas as pd

# 한글 폰트 설정
plt.rcParams['font.family'] = ['AppleGothic']
plt.rcParams['axes.unicode_minus'] = False

class TrendVisualizer:
    def __init__(self):
        self.fig_size = (12, 6)
        
    def plot_single_trend(self, trend_data, source="Google"):
        """
        단일 키워드의 트렌드를 시각화합니다.
        """
        if not trend_data:
            print("표시할 데이터가 없습니다.")
            return
        
        fig, ax = plt.subplots(figsize=self.fig_size)
        
        # 날짜 변환
        dates = [datetime.strptime(date, '%Y-%m-%d') for date in trend_data['dates']]
        values = trend_data['values']
        
        # 그래프 그리기
        ax.plot(dates, values, linewidth=2, color='#4285f4', marker='o', markersize=3)
        
        # 제목 및 레이블
        ax.set_title(f"{source} 검색 트렌드: {trend_data['keyword']}", fontsize=16, fontweight='bold')
        ax.set_xlabel('날짜', fontsize=12)
        ax.set_ylabel('검색 관심도', fontsize=12)
        
        # 날짜 포맷 설정
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))
        plt.xticks(rotation=45)
        
        # 그리드 추가
        ax.grid(True, alpha=0.3)
        
        # 레이아웃 조정
        plt.tight_layout()
        
        # 파일로 저장
        filename = f"results/{trend_data['keyword']}_{source}_trend.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"그래프가 저장되었습니다: {filename}")
        
        plt.close()
        
    def plot_comparison_trends(self, naver_data, google_data):
        """
        네이버와 구글 트렌드를 비교하여 시각화합니다.
        """
        if not naver_data or not google_data:
            print("비교할 데이터가 충분하지 않습니다.")
            return
        
        fig, ax = plt.subplots(figsize=self.fig_size)
        
        # 네이버 데이터
        naver_dates = [datetime.strptime(date, '%Y-%m-%d') for date in naver_data['dates']]
        naver_values = naver_data['values']
        
        # 구글 데이터
        google_dates = [datetime.strptime(date, '%Y-%m-%d') for date in google_data['dates']]
        google_values = google_data['values']
        
        # 그래프 그리기
        ax.plot(naver_dates, naver_values, linewidth=2, color='#00c73c', 
                marker='o', markersize=3, label='네이버')
        ax.plot(google_dates, google_values, linewidth=2, color='#4285f4', 
                marker='s', markersize=3, label='구글')
        
        # 제목 및 레이블
        keyword = naver_data['keyword']
        ax.set_title(f"검색 트렌드 비교: {keyword}", fontsize=16, fontweight='bold')
        ax.set_xlabel('날짜', fontsize=12)
        ax.set_ylabel('검색 관심도 (정규화)', fontsize=12)
        
        # 날짜 포맷 설정
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))
        plt.xticks(rotation=45)
        
        # 범례 및 그리드
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # 레이아웃 조정
        plt.tight_layout()
        
        # 파일로 저장
        filename = f"results/{keyword}_comparison_trend.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"비교 그래프가 저장되었습니다: {filename}")
        
        plt.close()
        
    def plot_multiple_keywords(self, comparison_data):
        """
        여러 키워드의 트렌드를 한 그래프에 표시합니다.
        """
        if not comparison_data:
            print("표시할 데이터가 없습니다.")
            return
        
        fig, ax = plt.subplots(figsize=self.fig_size)
        
        # 날짜 변환
        dates = [datetime.strptime(date, '%Y-%m-%d') for date in comparison_data['dates']]
        
        # 색상 팔레트
        colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9aa0a6']
        
        # 각 키워드별 그래프 그리기
        for i, (keyword, values) in enumerate(comparison_data['data'].items()):
            color = colors[i % len(colors)]
            ax.plot(dates, values, linewidth=2, color=color, 
                   marker='o', markersize=3, label=keyword)
        
        # 제목 및 레이블
        ax.set_title('키워드별 검색 트렌드 비교', fontsize=16, fontweight='bold')
        ax.set_xlabel('날짜', fontsize=12)
        ax.set_ylabel('검색 관심도', fontsize=12)
        
        # 날짜 포맷 설정
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))
        plt.xticks(rotation=45)
        
        # 범례 및 그리드
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        ax.grid(True, alpha=0.3)
        
        # 레이아웃 조정
        plt.tight_layout()
        
        # 파일로 저장
        filename = "results/keywords_comparison_trend.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"키워드 비교 그래프가 저장되었습니다: {filename}")
        
        plt.close()
        
    def create_trend_summary(self, trend_data):
        """
        트렌드 데이터의 요약 정보를 출력합니다.
        """
        if not trend_data:
            return
        
        values = trend_data['values']
        
        print(f"\n=== {trend_data['keyword']} 트렌드 요약 ===")
        print(f"분석 기간: {trend_data['period']}")
        print(f"최대 관심도: {max(values)}")
        print(f"최소 관심도: {min(values)}")
        print(f"평균 관심도: {sum(values)/len(values):.1f}")
        
        # 트렌드 방향 분석
        if len(values) >= 2:
            recent_trend = sum(values[-7:]) / 7 if len(values) >= 7 else sum(values[-3:]) / 3
            early_trend = sum(values[:7]) / 7 if len(values) >= 7 else sum(values[:3]) / 3
            
            if recent_trend > early_trend * 1.1:
                trend_direction = "상승 📈"
            elif recent_trend < early_trend * 0.9:
                trend_direction = "하락 📉"
            else:
                trend_direction = "안정 ➡️"
                
            print(f"트렌드 방향: {trend_direction}")
        print("=" * 40)