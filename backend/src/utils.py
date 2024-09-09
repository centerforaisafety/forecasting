import asyncio
from typing import List, Dict
import ray
from chat_forecasting import ForecastingMultiAgents
from functools import wraps
import re
import json

def extract_prediction(prediction_str):
    # Find the first number (integer or float) in the string
    match = re.search(r'(\d+(\.\d+)?)', prediction_str)
    if match:
        return float(match.group(1))
    return None

def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(times):
                return await func(*args, **kwargs)
                # try:
                #     return await func(*args, **kwargs)
                # except exceptions as e:
                #     if attempt == times - 1:  # Last attempt
                #         raise
                #     print(f"Attempt {attempt + 1} failed: {str(e)}. Retrying...")
        return wrapper
    return decorator

@retry(times=3)
async def forecasting_search_local_with_retry(messages: List[Dict], **kwargs):
    multi_agents = ForecastingMultiAgents(**kwargs)
    response = multi_agents.completions(messages)
    
    # Collect the full response
    full_response = ""
    async for chunk in response:
        full_response += chunk
    return full_response

def process_forecasting(full_result: str):
    response=""
    try:
        sources, response = full_result.split('[FORECASTING_START]')
        
        sources = [s.strip() for s in sources.split("[SEP_SOURCE]") if s.strip()][-1] if sources else "[]"
        sources = json.loads(sources)
        for source in sources:
            del source['raw_content']

        response = response.replace("[FORECASTING_END]", "")

        prediction = response.split("<answer>")[-1].replace("</answer>", "")
        prediction = float(re.search(r'(\d+(\.\d+)?)', prediction).group(1)) if re.search(r'(\d+(\.\d+)?)', prediction) else None

        if prediction is None:
            print(f"Failed to parse prediction for: {prediction}")

        return dict(prediction=prediction, response=response, sources=sources)
    except Exception as e:
        print(e)
        return dict(prediction=None, response=response)

@ray.remote
def process_request(example: Dict, 
                    model: str, 
                    breadth: int,
                    planner_prompt: str,
                    publisher_prompt: str,
                    search_type: str="news",
                    ):
    response = {}
    try:
        question = example['question']
        before_timestamp = example.get('beforeTimeStamp')
        
        if example.get("backgroundText"):
            question = f"{question}\n\nBackground text:{example['backgroundText']}"
        input_data = {
            "messages": [{"role": "user", "content": question}],
            "model": model,
            "breadth": breadth,
            "planner_prompt": planner_prompt,
            "publisher_prompt": publisher_prompt,
            "before_timestamp": before_timestamp,
            "search_type": search_type,
        }
        result = asyncio.run(forecasting_search_local_with_retry(**input_data))
        response = process_forecasting(result)
    except Exception as e:
        print(e)
    finally:
        return {**example, **response}