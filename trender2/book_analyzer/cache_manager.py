import os
import json
import pandas as pd
from datetime import datetime, timedelta
import hashlib

class CacheManager:
    def __init__(self, cache_dir="cache"):
        self.cache_dir = cache_dir
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
    
    def _get_cache_key(self, keyword, max_results, it_books_only):
        """캐시 키 생성"""
        key_string = f"{keyword}_{max_results}_{it_books_only}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key):
        """캐시 파일 경로 생성"""
        return os.path.join(self.cache_dir, f"{cache_key}.json")
    
    def get_cached_data(self, keyword, max_results, it_books_only, cache_hours=24):
        """캐시된 데이터 가져오기"""
        cache_key = self._get_cache_key(keyword, max_results, it_books_only)
        cache_path = self._get_cache_path(cache_key)
        
        if not os.path.exists(cache_path):
            return None
        
        # 캐시 파일 수정 시간 확인
        cache_time = datetime.fromtimestamp(os.path.getmtime(cache_path))
        if datetime.now() - cache_time > timedelta(hours=cache_hours):
            print(f"⏰ 캐시 만료됨 ({cache_hours}시간 경과)")
            return None
        
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                print(f"📁 캐시에서 데이터 로드: {len(cached_data['books'])}권")
                return cached_data['books']
        except Exception as e:
            print(f"❌ 캐시 읽기 실패: {e}")
            return None
    
    def save_to_cache(self, keyword, max_results, it_books_only, books_data):
        """데이터를 캐시에 저장"""
        cache_key = self._get_cache_key(keyword, max_results, it_books_only)
        cache_path = self._get_cache_path(cache_key)
        
        cache_data = {
            'keyword': keyword,
            'max_results': max_results,
            'it_books_only': it_books_only,
            'timestamp': datetime.now().isoformat(),
            'books': books_data
        }
        
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
                print(f"💾 캐시에 저장됨: {len(books_data)}권")
        except Exception as e:
            print(f"❌ 캐시 저장 실패: {e}")
    
    def clear_cache(self):
        """캐시 파일들 삭제"""
        cache_files = [f for f in os.listdir(self.cache_dir) if f.endswith('.json')]
        for cache_file in cache_files:
            os.remove(os.path.join(self.cache_dir, cache_file))
        print(f"🗑️ {len(cache_files)}개 캐시 파일 삭제됨")
    
    def list_cache(self):
        """캐시 목록 출력"""
        cache_files = [f for f in os.listdir(self.cache_dir) if f.endswith('.json')]
        print(f"📁 캐시 파일 목록: {len(cache_files)}개")
        
        for cache_file in cache_files:
            cache_path = os.path.join(self.cache_dir, cache_file)
            cache_time = datetime.fromtimestamp(os.path.getmtime(cache_path))
            
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    keyword = cache_data.get('keyword', 'Unknown')
                    book_count = len(cache_data.get('books', []))
                    print(f"  - {keyword}: {book_count}권 ({cache_time.strftime('%Y-%m-%d %H:%M')})")
            except:
                print(f"  - {cache_file}: 읽기 실패")