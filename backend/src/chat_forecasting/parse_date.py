import re
import dateparser
from datetime import datetime

DATE_FORMAT = "%b %d, %Y"
GOOGLE_SEARCH_DATE_FORMAT = "%Y-%m-%d"

UNKNOWN_TIME = "Unknown"

def extract_date(html: str) -> str:
    # List of common date meta tags
    date_meta_tags = [
        'article:published_time',
        'datePublished',
        'date',
        'pubdate',
        'og:published_time',
        'publishdate',
    ]
    
    for tag in date_meta_tags:
        match = re.search(f'<meta[^>]*name="{tag}"[^>]*content="([^"]*)"', html, re.IGNORECASE)
        if match:
            return parse_date(match.group(1))
    
    # If no meta tag is found, try to find a date in the text
    date_patterns = [
        r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
        r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
        r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b',
        r'<time\s+datetime="([^"]+)"',  # <time datetime="...">
        r'\d{8}',  # YYYYMMDD
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, html)
        if match:
            return parse_date(match.group(0))
    
    return UNKNOWN_TIME

def parse_date(date_str: str) -> str:
    # First, try to parse using dateparser
    parsed_date = dateparser.parse(date_str, settings={'STRICT_PARSING': False})
    
    if not parsed_date:
        # If dateparser fails, try manual parsing for specific formats
        try:
            if len(date_str) == 8 and date_str.isdigit():
                # Handle YYYYMMDD format
                parsed_date = datetime.strptime(date_str, "%Y%m%d")
            elif 'T' in date_str:
                # Handle ISO format with time
                parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            return UNKNOWN_TIME
    
    if parsed_date:
        return parsed_date.strftime(DATE_FORMAT)
    return UNKNOWN_TIME