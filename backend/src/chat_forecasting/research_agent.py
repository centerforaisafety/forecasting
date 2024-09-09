import aiohttp
import asyncio
import json
from time import time
from typing import List, Dict, Tuple
from chat_forecasting.crawl_agent import deduplicate_search_links, fetch_content
from datetime import datetime
from typing import Optional
from chat_forecasting.parse_date import GOOGLE_SEARCH_DATE_FORMAT
from chat_forecasting.caching_agent import CachingAgent
import concurrent
from chat_forecasting.llm_agent import get_llm_agent_class
import numpy as np
from urllib.parse import urlparse
from copy import deepcopy

# CONST
BLACKLISTED_DOMAINS: List[str] = [
    "youtube.com", ".pdf", "linkedin.com", ".ashx", "facebook.com", "instagram.com"
]
SERPER_SEARCH_TYPE_TO_KEY = {
    'search': 'organic',
    'news': 'news'
}

class ResearchAgent:
    def __init__(self, serper_api_key, search_type: str='search', breadth: int='5', before_timestamp: int = None):
        self.serper_api_key = serper_api_key
        self.search_type = search_type if search_type else 'search'
        self.search_serper_args = \
                dict(url = f"https://google.serper.dev/{self.search_type}", \
                    headers = {'X-API-KEY': self.serper_api_key,'Content-Type': 'application/json'}
                )
        self.breadth = breadth
        self.before_date_str, self.before_timestamp = handle_timestamp(before_timestamp)
        self.summarize_agent = get_llm_agent_class("gpt-4o-mini")(model="gpt-4o-mini", temperature=0.0, max_tokens=512)
        self.summarize_prompt = '''I want to make the following article shorter (condense it to no more than 256 words).
Article: {article}
When doing this task for me, please do not remove any details that would be helpful for making considerations about the following forecasting question.
Forecasting Question: {question}

---
Only return the summarized article. Do not answer the forecasting question yourself. No yapping!
'''
        self.caching_agent = CachingAgent()

    async def search_serper(self, queries: List[str], batch_size: int = 20) -> List[List[str]]:
        results = []
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i+batch_size]
            payload = json.dumps([{"q": q} for q in batch])

            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(**self.search_serper_args, data=payload) as response:
                        if response.status == 200:
                            data = await response.json()
                            search_key = SERPER_SEARCH_TYPE_TO_KEY[self.search_type]
                            processed_data = [self._post_process_search(d[search_key]) for d in data]
                            results.extend(processed_data)
                        else:
                            print("Out of credit: Serper Search status=", response.status)
            except Exception as e:
                print(f"Error processing batch {i//batch_size + 1}: {str(e)}")

        return results
    
    def _post_process_search(self, search_results):
        search_results = [s for s in search_results if not any(link_type in s['link'].lower() for link_type in BLACKLISTED_DOMAINS)]    
        return search_results
    
    async def _preprocess_research(self, search_results: List[List[Dict]]):
        """
        Pre-process search results before passing to research pipeline 
        by checking for blacklisted domains and existing (cached) sources.
        
        This function performs two main tasks:
        1. Filters out results from blacklisted domains.
        2. Checks for existing sources in the cache.
        
        Args:
            search_results (List[List[Dict]]): The initial search results.
        
        Returns:
            Tuple[List[List[Dict]], Set[str], Dict[str, Dict]]: 
            - Filtered search results
            - Set of blacklisted domains
            - Dictionary of existing sources
        """
        # Filter out blacklist domains (banned, captcha, 403)
        try:
            all_domains = set([urlparse(r['link']).netloc.lower() for r in np.concatenate(search_results)])
            blacklist_domains = await self.caching_agent.check_blacklisted_domains(all_domains)
        except Exception as e:
            print(f"Error checking blacklisted domains: {e}")
            blacklist_domains = set()

        filtered_results = [[r for r in results if urlparse(r['link']).netloc.lower() not in blacklist_domains] 
                            for results in search_results]
        
        # Query for cached (existing) sources
        try:
            cached_sources = await self.caching_agent.check_existing_sources([r['link'] for r in np.concatenate(filtered_results)])
            # Serialize sources:
            existed_sources = {}
            for sources in cached_sources:
                del sources['createdAt'], sources['updatedAt']
                existed_sources[sources['_id']] = sources
        except Exception as e:
            print(f"Error checking existing sources: {e}")
            existed_sources = {}

        return filtered_results, blacklist_domains, existed_sources
        
    async def _summarize_content(self, result: Dict, question: str) -> str:
        summarized_content = result.get('summarized_content')
        if not summarized_content: 
            _summarize_input = self.summarize_prompt.format(question=question, article=result["raw_content"])
            summarized_content = await self.summarize_agent.async_completions([dict(role="user", content=_summarize_input)])
        result['summarized_content'] = summarized_content
        return result
    
    async def research(self, queries: List[str], question: str):
        timings = [("Start", time())]

        # Step 1: Query Preparation
        postfix = f" before:{self.before_date_str}" if self.before_date_str else ""
        queries = [q + postfix for q in queries][:self.breadth]

        # Step 2: Initial Search
        search_results = await self.search_serper(queries)
        search_results = deduplicate_search_links(search_results)
        timings.append(("Initial Search", time()))
                
        # Step 3: Preprocessing
        await self.caching_agent.connect()
        filtered_search_results, blacklist_domains, existed_sources = await self._preprocess_research(search_results)
        timings.append(("Preprocessing", time()))

        # Step 4: Content Fetching (CPU Bounded so we use multi-procs)
        fetched_sources, failed_domains = [], []
        with concurrent.futures.ProcessPoolExecutor() as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(
                    executor,
                    mult_procs_fetch_content,
                    fetch_content,
                    query,
                    result,
                    self.before_timestamp,
                    5,  # max_trials
                    1,  # depth
                    2048,  # max_length
                    existed_sources
                )
                for query, result in zip(queries, filtered_search_results)
            ]
            # fetched_results = await asyncio.gather(*tasks)
            for i, completed_task in enumerate(asyncio.as_completed(tasks)):
                _fetched_sources, _failed_domains = await completed_task
                fetched_sources.extend(_fetched_sources)
                failed_domains.extend(_failed_domains)
                
                # Yield the entire list of fetched sources so far
                fetched_sources = [source for source in fetched_sources if source]
                yield fetched_sources

        timings.append(("Content Fetching", time()))

        # Aggregate fetched contents and failed domains
        
        # for _fetched_sources, _failed_domains in fetched_results:
        #     fetched_sources.extend(_fetched_sources)
        #     failed_domains.extend(_failed_domains)
        
        # Step 6: Summarize sources
        yield fetched_sources

        summarization_tasks = [self._summarize_content(res, question) for res in fetched_sources if res]
        processed_sources = await asyncio.gather(*summarization_tasks)
        timings.append(("Summarize", time()))

        # Filter out None results (those that encountered errors during postprocessing)
        results = [result for result in processed_sources if result is not None]

        # Step 7: Caching
        caching_new_sources = [s for s in results if s['link'] not in existed_sources]
        await self.caching_agent.add_sources(caching_new_sources)
        await self.caching_agent.add_to_blacklist(failed_domains)
        # await self.caching_agent.close()
        timings.append(("Caching", time()))

        # Print timing breakdown
        print_research_timing(timings)

        yield results
    
# ========================= utils function =========================
def handle_timestamp(timestamp: Optional[int]) -> Optional[str]:
    if timestamp is None:
        return None, None
    # Check if the timestamp is in milliseconds (13 digits) or seconds (10 digits)
    if len(str(timestamp)) > 10:
        timestamp = timestamp // 1000  # Convert milliseconds to seconds
    return datetime.fromtimestamp(timestamp).strftime(GOOGLE_SEARCH_DATE_FORMAT), timestamp

def mult_procs_fetch_content(function, *args, **kwargs):
    # This method runs in a separate process
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(function(*args, **kwargs))

def print_research_timing(timings: List[Tuple[str, float]]):
    """
    Print a detailed breakdown of research timings.

    Args:
    timings (List[Tuple[str, float]]): A list of tuples, each containing a step name and its end time.
    """
    total_time = timings[-1][1] - timings[0][1]
    print(f"Research time breakdown:")
    print(f"  Total time: {total_time:.2f}s")

    for i in range(1, len(timings)):
        step_name, end_time = timings[i]
        start_time = timings[i-1][1]
        step_time = end_time - start_time
        percentage = (step_time / total_time) * 100
        print(f"  {i}. {step_name}: {step_time:.2f}s ({percentage:.1f}%)")