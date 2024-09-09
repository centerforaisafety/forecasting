from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
from chat_forecasting import ForecastingMultiAgents
import uvicorn
import ray
from tqdm import tqdm
from utils import process_request
from time import time
from contextlib import asynccontextmanager
import os
import psutil

# You should manage your dependencies in your local or virtual environment.
# Ensure all the required libraries are installed using pip.

# Define the structure of the input data using Pydantic models for data validation
class ForecastingData(BaseModel):
    model: str
    messages: list
    breadth: int = None
    plannerPrompt: str = None
    publisherPrompt: str = None
    search_type: str = None
    beforeTimestamp: int = None

class BatchForecastingData(BaseModel):
    questions: List[Dict]
    model: str
    breadth: int = None
    plannerPrompt: str = None
    publisherPrompt: str = None
    search_type: str = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Ray when the app starts
    env_vars = {k: str(v) for k, v in os.environ.items()}
    env_vars['RAY_DEDUP_LOGS'] = "0"
    ray.init(runtime_env={"env_vars": env_vars})
    yield
    # Shutdown Ray when the app stops
    ray.shutdown()

app = FastAPI(lifespan=lifespan)

# Define the endpoint
@app.post("/forecasting_search/")
async def forecasting_search_endpoint(data: ForecastingData):
    # Assuming ForecastingMultiAgents is correctly imported and available
    data.search_type = "news"
    multi_agents = ForecastingMultiAgents(data.model, 
                                          data.breadth, 
                                          data.plannerPrompt,
                                          data.publisherPrompt, 
                                          data.search_type, 
                                          data.beforeTimestamp)
    
    response = multi_agents.completions(data.messages)
    return StreamingResponse(response, media_type='text/plain')



@app.post("/forecasting_search_batch/")
async def forecasting_search_batch_endpoint(data: BatchForecastingData, parallel: int = 20):
    data.search_type = "news"
    t0 = time()
    futures = [process_request.options(num_cpus=0.10).remote(q, 
                                      model=data.model, 
                                      breadth=data.breadth, 
                                      planner_prompt=data.plannerPrompt,
                                      publisher_prompt=data.publisherPrompt,
                                      search_type=data.search_type)
               for q in data.questions]

    results = []
    for i in tqdm(range(len(futures)), desc="Processing"):
        done, futures = ray.wait(futures)
        results.extend(ray.get(done))
    
        resources = ray.available_resources()
        total_cpus = ray.cluster_resources()['CPU']
        used_cpus = total_cpus - resources.get('CPU', 0)
        
        print(f"{i+1}. Total CPUs: {total_cpus}", f"| Used CPUs: {used_cpus}", f"| CPU Usage: {used_cpus / total_cpus * 100:.2f}%")
        print("---")

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
    uvicorn.run(app, host="0.0.0.0", port=8089)
