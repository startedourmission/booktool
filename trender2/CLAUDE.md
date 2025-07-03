# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Korean book market analysis tool that crawls YES24 bookstore and analyzes IT book market trends. The tool provides market analysis including publisher positioning, keyword trends, and audience demographics.

## Common Commands

### Running the Analysis Tool
```bash
# Run main analysis with a search keyword
uv run python3 book_analyzer/main.py <검색_키워드>

# Example: Analyze Python-related books
uv run python3 book_analyzer/main.py 파이썬

# Alternative: Use regular Python
python3 book_analyzer/main.py 챗GPT
```

### Testing the Crawler
```bash
# Test the YES24 crawler functionality
python3 test_crawler.py
```

### Installing Dependencies
```bash
# Install required packages
pip install -r requirements.txt

# Or if using uv
uv pip install -r requirements.txt
```

## Architecture

### Core Components

1. **YES24 Crawler** (`book_analyzer/yes24_crawler.py`)
   - Web scrapes YES24 bookstore search results
   - Extracts book metadata (title, author, publisher, price, pages)
   - Crawls individual book detail pages for additional information
   - Handles IT-specific book filtering with category filtering

2. **Analysis Modules** (`book_analyzer/src/`)
   - `market_analysis.py`: Publisher positioning, keyword trends, market share analysis
   - `planning_analysis.py`: Audience analysis based on difficulty and age estimation
   - `parse_yes24.py`: HTML parsing utilities for saved pages

3. **Main Entry Point** (`book_analyzer/main.py`)
   - Coordinates crawler and analysis modules
   - Handles command-line arguments for search keywords
   - Runs complete analysis pipeline

### Data Flow

1. User provides search keyword via command line
2. `Yes24Crawler` searches YES24 with optional IT category filtering
3. Crawler extracts basic info from search results
4. Detail pages are crawled for additional metadata (pages, keywords, category)
5. Analysis modules process the collected data:
   - Market analysis: Publisher positioning, keyword trends, market share
   - Planning analysis: Audience demographics estimation
6. Results are displayed as terminal-based charts using `plotext`

### Key Features

- **Publisher Positioning**: Analyzes price-per-page vs sales rank
- **Keyword Trend Analysis**: Extracts and analyzes trending keywords
- **Market Share Analysis**: Publisher and category distribution
- **Audience Analysis**: Estimates target audience age and expertise level
- **Terminal Charts**: Uses `plotext` for command-line visualization

## Development Notes

### Dependencies
- `beautifulsoup4`: HTML parsing
- `requests`: Web scraping
- `pandas`: Data manipulation
- `plotext`: Terminal-based charts
- `scikit-learn`, `numpy`: Data analysis utilities

### Data Storage
- Crawled data is processed in-memory as pandas DataFrames
- HTML files can be saved to `book_analyzer/data/yes24_pages/` for offline analysis
- No persistent database - analysis runs fresh each time

### Error Handling
- Graceful handling of network timeouts and parsing errors
- Continues processing even if individual books fail to parse
- Provides progress feedback during crawling

### Korean Language Support
- Handles Korean text encoding properly
- Korean search keywords and book titles
- Category and publisher names in Korean