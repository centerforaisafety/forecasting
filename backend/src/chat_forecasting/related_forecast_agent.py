from chat_forecasting.llm_agent import get_llm_agent_class
import json
import re

class RelatedForecastAgent:
    def __init__(self, model: str="gpt-4o-mini"):
        self.generate_related_forecast_agent = get_llm_agent_class(model)(model=model, temperature=0.4, max_tokens=512)
        self.related_forecast_prompt = """You are a creative recommender agent

[CONTEXT]  
Given the following forecast question:  
Forecast Question: {question}

[OBJECTIVE]  
Generate 4 additional forecast questions in the same style that are interesting for forecasters, particularly considering the type of forecast questions that someone like a superforecaster would find intriguing.

[RULES]
0. Today's date is 2025.
1. Be bold and imaginative. Push the boundaries of conventional thinking while remaining within the realm of possibility.
2. Craft specific, unique, intriguing and concise forecast questions. Avoid general or mundane topics.
3. Incorporate elements of long-term thinking, potential paradigm shifts, or low-probability high-impact events.
4. Consider topics like existential risks, artificial intelligence, space exploration, climate change, geopolitical conflicts, biotechnology, societal transformations (AI Girlfriends, etc.).
5. Aim for questions that challenge forecasters and provoke deep consideration of future scenarios.
6. Return the forecast questions in the format of a JSON list, where each dictionary contains only the "query", "icon", and "topic" fields.  
    - query: The forecast question  
    - icon: An emoji that represents the topic  
    - topic: The general subject of the forecast question  

Example Output:  
[
  {{"query": "What's the probability that at the end of 2025 Elon Musk's xAI will have the most intelligent AI system?", "icon": "🧠", "topic": "AI" }},
  {{"query": "What's the probability Trump wins the 2024 US presidential election?", "icon": "🗳️", "topic": "Politics" }},
  {{"query": "What's the probability that COVID-19 was a lab leak?", "icon": "🦠", "topic": "Pandemic" }},
  {{"query": "What's the probability Imane Khelif has XY chromosomes?", "icon": "🧬", "topic": "Biology" }}
]
"""

    def completion(self, question):
        try:
            _input = self.related_forecast_prompt.format(question=question)
            response_text = self.generate_related_forecast_agent.completions([{'role': 'user', 'content': _input}])

            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    related_forecasts = json.loads(json_str)
                    return related_forecasts
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON: {json_str}")
                    return []
            else:
                print(f"No JSON found in response: {response_text}")
                return []
        except Exception as e:
            print(f"Error in RelatedForecastAgent completion: {str(e)}")
            return []