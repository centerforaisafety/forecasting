import re
import html
from urllib.parse import urljoin
from collections import OrderedDict
from typing import List, Dict
from urllib.parse import urlparse
from chat_forecasting.parse_date import DATE_FORMAT, UNKNOWN_TIME
import newspaper
from datetime import datetime
from time import time

async def fetch_article_newspaper(url: str, timeout: int=5):
    article = newspaper.article(url)
    favicon_url = extract_favicon(article.html, url)
    date = article.publish_date

    date = date.strftime(DATE_FORMAT) if date else UNKNOWN_TIME
    text = article.text
    return dict(favicon=favicon_url, date=str(date), raw_content=text)

def extract_favicon(html: str, base_url: str):
    # Extract favicon
    favicon_url = ""
    favicon_match = re.search(r'<link[^>]*rel=["\'](icon|shortcut icon)["\'][^>]*href=["\'](.*?)["\']', html, re.IGNORECASE)
    if favicon_match:
        favicon_path = favicon_match.group(2)
        favicon_url = urljoin(base_url, favicon_path)
    else:
        # Look for the first image if favicon is not found
        img_match = re.search(r'<img[^>]*src=["\'](.*?)["\']', html)
        if img_match:
            img_path = img_match.group(1)
            favicon_url = urljoin(base_url, img_path)
    return favicon_url

def deduplicate_search_links(search_results: List[List[Dict]]) -> List[List[Dict]]:
    seen_domains = OrderedDict()
    deduplicated_results = []

    for result_list in search_results:
        deduped_list = []
        for result in result_list:
            url = result['link']
            domain = urlparse(url).netloc.lower()

            if domain not in seen_domains:
                seen_domains[domain] = result
                deduped_list.append(result)
        if deduped_list:
            deduplicated_results.append(deduped_list)
        
    return deduplicated_results

def validate_time(before_timestamp, source_date_str):
    if before_timestamp == None:
        return True
    if source_date_str == UNKNOWN_TIME:
        return False
    
    source_date = datetime.strptime(source_date_str, DATE_FORMAT)
    before_date = datetime.fromtimestamp(before_timestamp)
    return source_date < before_date

async def fetch_content(query, 
                        search_results, 
                        before_timestamp=None,
                        max_trials=3, 
                        depth=1,
                        max_length: int = 2048,
                        existed_sources: Dict = {}
                        ):
    trial = 0
    return_results = []
    failed_domains = []
    while len(search_results) and len(return_results) < depth:
        try:
            current = search_results.pop(0)
            url = current['link']
            if url in existed_sources:
                content = existed_sources[url]
            else:
                content = await fetch_article_newspaper(url)
                content['raw_content'] = " ".join(content['raw_content'].split()[:max_length])
                content['summarized_content'] = None

            if not validate_time(before_timestamp, content['date']):
                continue
            
            return_results.append({
                **current,
                **content,
                "query": query,

            })

        except Exception as e:
            print(f"URL Failed {url}: ", str(e))
            # Temporary skip this block as it seem to able to bypass
            # TODO: bypass PerimeterX
            if "PerimeterX" in str(e):
                continue
            domain = urlparse(url).netloc.lower()
            failed_domains.append(dict(domain=domain, url=url, error_message=str(e)))
            if trial == max_trials - 1:
                print(f"Failed to fetch any article for query: {query}")
            continue
            
    return return_results, failed_domains