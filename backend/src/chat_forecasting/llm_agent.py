from abc import ABC, abstractmethod
import os
import openai
from anthropic import Anthropic
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from fireworks.client import Fireworks, AsyncFireworks

from typing import List, Dict
from dotenv import load_dotenv
load_dotenv()

def get_llm_agent_class(model: str):
    if "gpt" in model:
        return OpenAIAgent
    elif "claude" in model:
        return AnthropicAgent
    elif "gemini" in model:
        return GeminiAgent
    elif "accounts/fireworks" in model:
        return FireworksAgent
    else:
        raise NotImplementedError(f"Agent class not found for {model}")


class LLMAgent(ABC):

    def __init__(self, temperature: float = 0.0, max_tokens: int = 2048):
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.default_outputs = "Sorry, I can not satisfy that request."

    @abstractmethod
    def _completions(self, messages) -> str:
        raise NotImplementedError
    
    @abstractmethod
    async def _async_completions(self, messages) -> str:
        raise NotImplementedError
    
    async def _completions_stream(self, messages: List[Dict]) -> str:
        raise NotImplementedError
    
    async def completions_stream(self, messages: List[Dict]) -> str:
        try:
            response = self._completions_stream(messages)
            return response
        except Exception as e:
            print(f"Exception for {self.model}", str(e))
            return self.default_outputs
    
    def completions(self, messages: List[Dict]) -> str:
        try:
            response = self._completions(messages)
            return response
        except Exception as e:
            print(f"Exception for {self.model}", str(e))
            return self.default_outputs
    
    async def async_completions(self, messages: List[Dict]) -> str:
        try:
            response = await self._async_completions(messages)
            return response
        except Exception as e:
            print(f"Exception for {self.model}", str(e))
            return self.default_outputs

class OpenAIAgent(LLMAgent):
    def __init__(self, temperature: float = 0.0, max_tokens: int = 2048, model: str = "gpt-3.5-turbo"):
        super().__init__(temperature, max_tokens)
        self.model = model
        openai_api_key = os.getenv("OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.async_client = openai.AsyncOpenAI(api_key=openai_api_key)
        self.system = [dict(role='system', content='You are an advanced AI system which has been finetuned to provide calibrated probabilistic forecasts under uncertainty, with your performance evaluated according to the Brier score.')]


    def _completions(self, messages: List[Dict]) -> str:
        # messages = self.system + messages
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        response = response.choices[0].message.content
        return response
    
    async def _async_completions(self, messages: List[Dict]) -> str:
        response = await self.async_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        return response.choices[0].message.content
    
    async def _completions_stream(self, messages: List):
        # messages = self.system + messages
        stream = self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            messages=messages,
            stream=True
        )

        for chunk in stream:
            if (text := chunk.choices[0].delta.content) is not None:
                yield text

class FireworksAgent(OpenAIAgent):
    def __init__(self, model: str, temperature: float = 0.0, max_tokens: int = 2048):
        super().__init__(temperature, max_tokens)
        self.model = model
        FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
        self.client = Fireworks(api_key=FIREWORKS_API_KEY)
        self.async_client = AsyncFireworks(api_key=FIREWORKS_API_KEY)

    async def _async_completions(self, messages: List[Dict]) -> str:
        response = await self.async_client.chat.completions.acreate(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        return response.choices[0].message.content

class AnthropicAgent(LLMAgent):
    def __init__(self, temperature: float = 0.0, max_tokens: int = 2048, model: str = "claude-3-haiku"):
        super().__init__(temperature, max_tokens)
        self.client = Anthropic(api_key=os.env("ANTHROPIC_API_KEY"))
        self.model = model

    def _completions(self, messages: List[Dict]) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens_to_sample=self.max_tokens,
            temperature=self.temperature,
            messages=messages
        )
        response = response.content[0].text
        return response

class GeminiAgent(LLMAgent):

    def __init__(self, temperature: float = 0.0, max_tokens: int = 2048, model: str = "gemini-1.5-flash"):
        super().__init__(temperature, max_tokens)
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model=model
        self.client = genai.GenerativeModel(model)

        self.safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        }
        self.generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=temperature,
        )

    def _preprocess_messages(self, messages: List[Dict]) -> List[Dict]:
        # flatten from {"content": str} to "part": {"text": str}
        for message in messages:
            content = message['content']
            # TODO: support IMAGE here
            message['parts'] = {"text": content}
            del message['content']
        return messages
    
    def _completions(self, messages: List) -> str:
        messages = self._preprocess_messages(messages)
        inputs = messages.pop()
        chat = self.client.start_chat(history=messages) 

        completion = chat.send_message(inputs['parts'], generation_config=self.generation_config, safety_settings=self.safety_settings)
        output = completion.text

        return output
    
    async def _completions_stream(self, messages: List):
        messages = self._preprocess_messages(messages)

        inputs = messages.pop()
        chat = self.client.start_chat(history=messages) 

        response = chat.send_message(inputs['parts'], generation_config=self.generation_config, safety_settings=self.safety_settings, stream=True)
        for chunk in response:
            yield chunk.text