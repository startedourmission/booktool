from book_analyzer.yes24_crawler import Yes24Crawler

crawler = Yes24Crawler()
books = crawler.search_books("챗GPT", max_results=1)

if books:
    for book in books:
        print(f"제목: {book.get('title')}")
        print(f"저자: {book.get('author')}")
        print(f"출판사: {book.get('publisher')}")
        print(f"가격: {book.get('price')}")
        print(f"판매지수: {book.get('sales_rank')}")
        print(f"링크: {book.get('link')}")
        print(f"쪽수: {book.get('pages')}")
        print(f"출간일: {book.get('published_date')}")
        print(f"키워드: {book.get('keywords')}")
        print(f"카테고리: {book.get('category')}")
        print("-----------------------------------")
else:
    print("검색 결과가 없습니다.")