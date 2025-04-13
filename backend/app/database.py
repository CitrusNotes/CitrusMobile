"""
Database module for CitrusNotes backend.
This module handles database connections, collections, and index creation.
"""

import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# MongoDB connection string with fallback for local development
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/CitrusNotes")

# Create async MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client.CitrusNotes

# Create sync MongoDB client for operations that require it
sync_client = MongoClient(MONGODB_URL)
sync_db = sync_client.CitrusNotes

# Define collections
users = db.users
file_system = db.file_system

# Setup GridFS for file storage
fs = AsyncIOMotorGridFSBucket(db)


async def create_indexes() -> None:
    """Create necessary indexes for the database collections.

    This function:
    1. Drops existing indexes
    2. Creates unique indexes for email in users collection
    3. Creates indexes for file system items
    4. Cleans up any invalid data

    Raises:
        Exception: If any error occurs during index creation
    """
    try:
        # Drop existing indexes
        await users.drop_indexes()
        await file_system.drop_indexes()

        # Create unique index for email in users collection
        await users.create_index("email", unique=True)

        # Create indexes for file system items
        await file_system.create_index([("user_id", 1), ("parent_id", 1)])
        await file_system.create_index([("user_id", 1), ("tags", 1)])

        # Clean up any invalid data
        await file_system.delete_many({"user_id": {"$exists": False}})
    except Exception as error:
        print(f"Error creating indexes: {str(error)}")
        raise
