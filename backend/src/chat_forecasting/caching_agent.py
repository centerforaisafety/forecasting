import asyncio
from urllib.parse import urlparse
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Set, Optional, List
import os
from datetime import datetime, timezone
from bson import ObjectId

_client = AsyncIOMotorClient(os.environ.get("DATABASE_URL"))
_client.get_io_loop = asyncio.get_running_loop

class CachingAgent:
    def __init__(self):
        self.client = None
        self.db = None
        self.blacklisted_domains = None
        self.sources = None
        self.database_url = os.environ.get("DATABASE_URL")

    async def connect(self):
        if self.client is None:
            try:
                global _client
                self.client = _client
                db_name = urlparse(self.database_url).path.strip('/')
                self.db = self.client[db_name]
                self.blacklisted_domains = self.db['BlacklistedDomain']
                self.sources = self.db['sources']
                print(f"Connected to MongoDB database caching db successfully")
            except Exception as e:
                print(f"Error initializing MongoDB connection: {e}")

    async def check_blacklisted_domains(self, domains: Set[str]) -> Set[str]:
        try:
            cursor = self.blacklisted_domains.find({"_id": {"$in": list(domains)}})
            blacklisted = set()
            async for doc in cursor:
                blacklisted.add(doc['_id'])
            return blacklisted
        except Exception as e:
            print(f"Error checking blacklisted domains: {e}")
            return set()
        
    async def add_to_blacklist(self, domains: List[Dict]):
        if domains and self.blacklisted_domains != None:
            try:
                documents = [{"_id": domain['domain'], 'url': domain["url"], "error_message": domain["error_message"]} for domain in domains]
                await self.blacklisted_domains.insert_many(documents, ordered=False)
            except Exception as e:
                print(f"Error adding domains to blacklist: {e}")
        
    async def check_existing_sources(self, links: List[str]):
        try:
            cursor = self.sources.find({"_id": {"$in": links}})
            sources = []
            async for doc in cursor:
                sources.append(doc)
            return sources
        except Exception as e:
            print(f"Error checking soures: {e}")
            return []

    async def get_source(self, link: str) -> Optional[Dict]:
        try:
            source = await self.sources.find_one({"_id": ObjectId(link)})
            if source:
                source['_id'] = str(source['_id'])  # Convert ObjectId to string
            return source
        except Exception as e:
            print(f"Error getting source: {e}")
            return None

    async def add_sources(self, sources: List[Dict]):
        if sources and self.sources != None:
            try:
                documents_to_insert = []
                current_time = datetime.now(timezone.utc)
                for source in sources:
                    doc = source.copy()  # Create a copy to avoid modifying the original
                    doc['_id'] = doc['link']
                    del doc['link']
                    doc['createdAt'] = current_time
                    doc['updatedAt'] = current_time
                    documents_to_insert.append(doc)

                if documents_to_insert:
                    result = await self.sources.insert_many(documents_to_insert, ordered=False)
                    print(f"Added {len(result.inserted_ids)} sources")
                else:
                    print("No documents to insert")
            except Exception as e:
                print(f"Error adding sources: {e}")

    async def update_source(self, link: str, update_data: Dict):
        try:
            update_data['updatedAt'] = datetime.utcnow()
            await self.sources.update_one({"_id": ObjectId(link)}, {"$set": update_data})
        except Exception as e:
            print(f"Error updating source: {e}")

    async def add_query_to_source(self, link: str, query: str):
        try:
            await self.sources.update_one(
                {"_id": ObjectId(link)},
                {
                    "$addToSet": {"queries": query},
                    "$set": {"updatedAt": datetime.utcnow()}
                }
            )
        except Exception as e:
            print(f"Error adding query to source: {e}")

    async def close(self):
        if self.client:
            self.client.close()