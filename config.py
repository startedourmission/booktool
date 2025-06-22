import json
from pathlib import Path

class Config:
    def __init__(self, config_file="config.json"):
        self.config_file = Path(config_file)
        self.config = self._load_config()
    
    def _load_config(self):
        """설정 파일을 로드합니다."""
        if not self.config_file.exists():
            print(f"⚠️  설정 파일 '{self.config_file}'이 없습니다.")
            print("config.json.example을 참고하여 config.json 파일을 생성하세요.")
            return self._get_default_config()
        
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ 설정 파일 파싱 오류: {e}")
            return self._get_default_config()
        except Exception as e:
            print(f"❌ 설정 파일 로드 오류: {e}")
            return self._get_default_config()
    
    def _get_default_config(self):
        """기본 설정을 반환합니다."""
        return {
            "naver": {
                "client_id": "",
                "client_secret": ""
            },
            "apis": {
                "naver_datalab_url": "https://openapi.naver.com/v1/datalab/search",
                "naver_book_search_url": "https://openapi.naver.com/v1/search/book.json"
            },
            "settings": {
                "request_delay": 1,
                "max_results": 100,
                "default_days": 30
            }
        }
    
    def get_naver_credentials(self):
        """네이버 API 인증 정보를 반환합니다."""
        return (
            self.config.get("naver", {}).get("client_id", ""),
            self.config.get("naver", {}).get("client_secret", "")
        )
    
    def get_api_url(self, api_name):
        """API URL을 반환합니다."""
        return self.config.get("apis", {}).get(api_name, "")
    
    def get_setting(self, key, default=None):
        """설정 값을 반환합니다."""
        return self.config.get("settings", {}).get(key, default)
    
    def is_configured(self):
        """API 설정이 완료되었는지 확인합니다."""
        client_id, client_secret = self.get_naver_credentials()
        return bool(client_id and client_secret)