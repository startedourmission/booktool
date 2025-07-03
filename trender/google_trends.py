from pytrends.request import TrendReq
import pandas as pd
from datetime import datetime, timedelta

class GoogleTrends:
    def __init__(self):
        self.pytrends = TrendReq(hl='ko-KR', tz=540)
    
    def get_search_trends(self, keyword, days=30):
        """
        구글 트렌드 API를 사용하여 검색 트렌드 데이터를 가져옵니다.
        """
        try:
            # 시간 범위 설정
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            timeframe = f"{start_date.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"
            
            # 키워드 설정 및 데이터 가져오기
            self.pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo='KR', gprop='')
            
            # 시간별 관심도 데이터
            interest_over_time = self.pytrends.interest_over_time()
            
            if interest_over_time.empty:
                return None
            
            # 데이터 정리
            dates = [date.strftime('%Y-%m-%d') for date in interest_over_time.index]
            values = interest_over_time[keyword].tolist()
            
            return {
                'keyword': keyword,
                'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                'dates': dates,
                'values': values
            }
            
        except Exception as e:
            print(f"구글 트렌드 데이터 가져오기 실패: {e}")
            return None
    
    def get_related_topics(self, keyword):
        """
        관련 주제를 가져옵니다.
        """
        try:
            self.pytrends.build_payload([keyword], cat=0, timeframe='today 12-m', geo='KR', gprop='')
            
            related_topics = self.pytrends.related_topics()
            
            if (keyword in related_topics and 
                related_topics[keyword] and 
                'top' in related_topics[keyword] and 
                related_topics[keyword]['top'] is not None and 
                not related_topics[keyword]['top'].empty):
                
                topics_df = related_topics[keyword]['top']
                if 'topic_title' in topics_df.columns:
                    return topics_df['topic_title'].tolist()[:10]  # 최대 10개
                
            return []
                
        except Exception as e:
            print(f"관련 주제 가져오기 실패: {e}")
            return []
    
    def get_related_queries(self, keyword):
        """
        관련 검색어를 가져옵니다.
        """
        try:
            self.pytrends.build_payload([keyword], cat=0, timeframe='today 12-m', geo='KR', gprop='')
            
            related_queries = self.pytrends.related_queries()
            
            if (keyword in related_queries and 
                related_queries[keyword] and 
                'top' in related_queries[keyword] and 
                related_queries[keyword]['top'] is not None and 
                not related_queries[keyword]['top'].empty):
                
                query_df = related_queries[keyword]['top']
                if 'query' in query_df.columns:
                    return query_df['query'].tolist()[:10]  # 최대 10개
                
            return []
                
        except Exception as e:
            print(f"관련 검색어 가져오기 실패: {e}")
            return []
    
    def compare_keywords(self, keywords, days=30):
        """
        여러 키워드의 트렌드를 비교합니다.
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            timeframe = f"{start_date.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"
            
            self.pytrends.build_payload(keywords, cat=0, timeframe=timeframe, geo='KR', gprop='')
            
            interest_over_time = self.pytrends.interest_over_time()
            
            if interest_over_time.empty:
                return None
            
            # 데이터 정리
            dates = [date.strftime('%Y-%m-%d') for date in interest_over_time.index]
            comparison_data = {}
            
            for keyword in keywords:
                if keyword in interest_over_time.columns:
                    comparison_data[keyword] = interest_over_time[keyword].tolist()
            
            return {
                'keywords': keywords,
                'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                'dates': dates,
                'data': comparison_data
            }
            
        except Exception as e:
            print(f"키워드 비교 실패: {e}")
            return None