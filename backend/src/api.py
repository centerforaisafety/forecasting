import os
import ray
from modal import Image, App, web_endpoint, Secret
from typing import List
from chat_forecasting import ForecastingMultiAgents
from chat_forecasting.caching_agent import *
from fastapi.responses import StreamingResponse
from utils import process_request
from time import time
from tqdm import tqdm
from contextlib import asynccontextmanager

app = App("forecasting_agents", secrets=[])
image = Image.debian_slim().apt_install("git").run_commands(
    "pip install python-dotenv openai anthropic google-generativeai fireworks-ai dateparser lxml[html_clean] motor ray",
    "pip install git+https://github.com/justinphan3110cais/newspaper4k-forecasting-ai.git",
)

@app.function(image=image, secrets=[Secret.from_name("forecasting-secret")], container_idle_timeout=900)
@web_endpoint(method="POST")
async def forecasting_search_endpoint(data: dict):
    model = data['model']
    messages = data['messages']
    breadth = data.get('breadth')
    plannerPrompt = data.get('plannerPrompt')
    publisherPrompt = data.get('publisherPrompt')
    search_type = data.get('search_type')
    before_timestamp = data.get('beforeTimestamp')

    search_type = "news"
    multi_agents = ForecastingMultiAgents(model,
                                          breadth, 
                                          plannerPrompt, 
                                          publisherPrompt, 
                                          search_type, 
                                          before_timestamp)

    response = multi_agents.completions(messages)

    return StreamingResponse(response, media_type='text/plain')


@app.function(image=image, cpu=20, secrets=[Secret.from_name("forecasting-secret")])
@web_endpoint(method="POST")
async def forecasting_search_endpoint_batch(data: dict, parallel: int=20):
    questions = data['questions']
    t0 = time()
    model = data['model']
    breadth = data.get('breadth')
    plannerPrompt = data.get('plannerPrompt')
    publisherPrompt = data.get('publisherPrompt')
    search_type = data.get('search_type')
    search_type = "news"

    env_vars = {k: str(v) for k, v in os.environ.items()}
    env_vars['RAY_DEDUP_LOGS'] = "0"
    ray.init(num_cpus=parallel, runtime_env={"env_vars": env_vars})
    futures = [process_request.options(num_cpus=0.25).remote(q, 
                                    model=model, 
                                    breadth=breadth, 
                                    planner_prompt=plannerPrompt,
                                    publisher_prompt=publisherPrompt,
                                    search_type=search_type)
                                    for q in questions]

    results = []
    for _ in tqdm(range(len(futures)), desc="Processing"):
        done, futures = ray.wait(futures)
        results.extend(ray.get(done))

    ray.shutdown()
    t1 = time()
    print("Total forecasting_search_batch_endpoint time:", t1-t0,"s")

    return results

    

async def forecasting_search_local(data: dict) -> str:
    model = data['model']
    messages = data['messages']
    breadth = data.get('breadth')
    plannerPrompt = data.get('plannerPrompt')
    factorized_prompt = data.get('factorizedPrompt')
    publisherPrompt = data.get('publisherPrompt')
    search_type = data.get('search_type')
    before_timestamp = data.get('beforeTimestamp')

    multi_agents = ForecastingMultiAgents(model, 
                                          breadth, 
                                          plannerPrompt, 
                                          publisherPrompt, 
                                          search_type, 
                                          before_timestamp,
                                          factorized_prompt)

    response = multi_agents.completions(messages)
    
    # Collect the full response
    full_response = ""
    async for chunk in response:
        full_response += chunk
    return full_response
    

if __name__ == "__main__":
    app.serve()
