"""
FastAPI application for CitrusNotes backend.
This module provides the main API endpoints for:
- User management
- File system operations
- Document handling
- File upload/download
"""

import io
import logging
import os
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from passlib.context import CryptContext
from pydantic import BaseModel

from .database import create_indexes, db, file_system, fs, users
from .utils.image_scan import process_images_into_pdf

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI()

# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b",
    bcrypt__min_rounds=4,
    bcrypt__max_rounds=31,
)

# Configure CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Function to ensure test user exists
async def ensure_test_user():
    """Ensure the test user exists in the database.

    This function checks/creates a user in the database for testing purposes.
    The test user has a predefined ID and credentials for testing purposes.

    Raises:
        ValueError: If there's an error creating the test user
        Exception: For any other unexpected errors
    """
    test_user_id = "67f7454e9f6072baae1702c1"
    try:
        print("\nDebug: Checking for test user with ID: " + test_user_id)
        user = await users.find_one({"_id": ObjectId(test_user_id)})
        if not user:
            print("Debug: Test user not found, creating...")
            user_data = {
                "_id": ObjectId(test_user_id),
                "email": "test@example.com",
                "hashed_password": pwd_context.hash("testpassword"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await users.insert_one(user_data)
            print("Debug: Test user created successfully")
        else:
            print("Debug: Test user already exists")
    except ValueError as e:
        print("Debug: Error creating test user: " + str(e))
        raise ValueError(f"Error creating test user: {str(e)}") from e
    except Exception as e:
        print("Debug: Unexpected error ensuring test user exists: " + str(e))
        error_message = f"Unexpected error ensuring test user exists: {str(e)}"
        raise Exception(error_message) from e


# Create test user on startup
@app.on_event("startup")
async def startup_event():
    await create_indexes()
    await ensure_test_user()
    # Debug: Print all registered routes
    print("\nDebug: Registered routes:")
    for route in app.routes:
        print("  " + route.path + " - " + str(route.methods))
        if hasattr(route, "endpoint"):
            print("    Handler: " + route.endpoint.__name__)
    print("\n")


# User management endpoints
@app.post("/users/")
async def create_user(email: str = Form(...), password: str = Form(...)):
    """Create a new user in the system.

    Args:
        email (str): User's email from form data
        password (str): User's password from form data

    Returns:
        dict: Created user data (without password)

    Raises:
        HTTPException: If email is already registered or invalid
    """
    try:
        # Basic email validation
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=422, detail="Invalid email format")

        # Check if user already exists
        existing_user = await users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Already registered")

        # Password validation
        if len(password) < 6:
            raise HTTPException(
                status_code=422, detail="Password Length >= 6 characters"
            )

        # Hash the password
        hashed_password = pwd_context.hash(password)

        # Create user document
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        # Insert into database
        result = await users.insert_one(user_data)

        # Return the created user (without password)
        created_user = await users.find_one({"_id": result.inserted_id})
        created_user["_id"] = str(created_user["_id"])
        created_user.pop("hashed_password", None)

        return created_user
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Error creating user: %s", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to create user. Please try again."
        ) from e


@app.get("/users/")
async def get_users():
    """Get all users in the system.

    Returns:
        List[dict]: List of all users (without passwords)
    """
    users_list = []
    async for user in users.find():
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        users_list.append(user)
    return users_list


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get a specific user by ID.

    Args:
        user_id (str): The ID of the user to retrieve

    Returns:
        dict: User data (without password)

    Raises:
        HTTPException: If user not found or invalid ID format
    """
    try:
        user = await users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        return user
    except ValueError as exc:
        error_message = "Invalid user ID format"
        raise HTTPException(status_code=400, detail=error_message) from exc


@app.post("/users/login")
async def login_user(email: str = Form(...), password: str = Form(...)):
    """Login a user with email and password.

    Args:
        email (str): User's email
        password (str): User's password

    Returns:
        dict: User data if login successful

    Raises:
        HTTPException: If login fails with specific error message
    """
    try:
        # Find user by email
        user = await users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Verify password
        if not pwd_context.verify(password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Convert ObjectId to string for JSON response
        user["_id"] = str(user["_id"])

        # Remove sensitive data
        user.pop("hashed_password", None)

        return user
    except HTTPException as he:
        # Re-raise HTTP exceptions as they contain proper status codes
        raise he
    except Exception as e:
        print(f"Unexpected error in login: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again later.",
        ) from e


# Document management endpoints
@app.post("/documents/")
async def create_document(
    title: str = Form(...),
    images: List[UploadFile] = File(...),
):
    """Create a new document with associated images.

    Args:
        title (str): Title of the document
        images (List[UploadFile]): List of images to associate
            with the document

    Returns:
        dict: Success message and document ID

    Raises:
        HTTPException: If document creation fails
    """
    try:
        # Create document record
        document = {
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await db.documents.insert_one(document)
        document_id = result.inserted_id

        # Save images to GridFS and create records
        for index, image in enumerate(images):
            # Save file to GridFS
            file_id = fs.put(
                await image.read(),
                filename=image.filename,
                content_type=image.content_type,
            )

            # Create image record
            image_record = {
                "document_id": document_id,
                "file_id": file_id,
                "order_index": index,
                "created_at": datetime.utcnow(),
            }
            await db.images.insert_one(image_record)

        return {
            "message": "Document created successfully",
            "document_id": str(document_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document and its associated images.

    Args:
        document_id (str): ID of the document to retrieve

    Returns:
        dict: Document data and associated images

    Raises:
        HTTPException: If document not found
    """
    document = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get associated images
    images = (
        await db.images.find({"document_id": ObjectId(document_id)})
        .sort("order_index", 1)
        .to_list(length=None)
    )

    # Convert ObjectId to string for JSON serialization
    document["_id"] = str(document["_id"])
    for image in images:
        image["_id"] = str(image["_id"])
        image["document_id"] = str(image["document_id"])
        image["file_id"] = str(image["file_id"])

    return {"document": document, "images": images}


@app.get("/documents/")
async def list_documents():
    """Get all documents in the system.

    Returns:
        List[dict]: List of all documents
    """
    documents = await db.documents.find().sort("created_at", -1)
    documents = await documents.to_list(length=None)
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    return documents


@app.get("/images/{file_id}")
async def get_image(file_id: str):
    """Get an image file by its ID.

    Args:
        file_id (str): ID of the image to retrieve

    Returns:
        FileResponse: The image file

    Raises:
        HTTPException: If image not found
    """
    try:
        file = fs.get(ObjectId(file_id))
        return FileResponse(
            file,
            media_type=file.content_type,
            filename=file.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Image not found") from exc


# FileSystem endpoints
@app.post("/file-system/")
async def create_filesystem_item(
    name: str = Form(...),
    is_folder: bool = Form(False),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
    user_id: str = Form(...),
    is_starred: bool = Form(False),
):
    """Create a new item in the file system."""
    try:
        item = {
            "name": name,
            "is_folder": is_folder,
            "parent_id": ObjectId(parent_id) if parent_id else None,
            "tags": tags,
            "user_id": ObjectId(user_id),
            "is_starred": is_starred,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await file_system.insert_one(item)
        return {"message": "Creation Success", "item_id": str(item["_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/file-system/")
async def list_filesystem_items(
    user_id: str = Query(...),
    parent_id: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
):
    """List file system items for a user."""
    try:
        print(
            "Debug: Received request with user_id="
            + str(user_id)
            + ", parent_id="
            + str(parent_id)
        )

        # Validate user_id
        if user_id.lower() == "null":
            return {"error": "Invalid user_id: cannot be null"}, 400
    except Exception as e:
        print("Error in list_filesystem_items: " + str(e))
        return {"error": str(e)}, 500

    try:
        # Build query
        query = {"user_id": ObjectId(user_id)}
        print("Debug: Initial query: " + str(query))

        # Handle parent_id
        if parent_id is not None:
            if parent_id.lower() == "null":
                query["parent_id"] = None
            else:
                try:
                    query["parent_id"] = ObjectId(parent_id)
                except ValueError:
                    return {"error": "Invalid parent_id format"}, 400
        else:
            query["parent_id"] = None
            print("Debug: Final query: " + str(query))

        if tags:
            query["tags"] = {"$all": tags}

        # Get items
        items = []
        count = 0
        async for item in file_system.find(query):
            try:
                count += 1
                # Convert all ObjectId fields to strings
                item_dict = dict(item)
                for key, value in item_dict.items():
                    if isinstance(value, ObjectId):
                        item_dict[key] = str(value)
                items.append(item_dict)
            except Exception as e:
                print("Error processing item: " + str(e))
                continue

            print("Debug: Found " + str(count) + " items matching query")
        return items
    except Exception as e:
        print("Error in list_filesystem_items: " + str(e))
        return {"error": str(e)}, 500


@app.get("/file-system/{item_id}")
async def get_filesystem_item(item_id: str):
    """Get a specific file system item.

    Args:
        item_id (str): ID of the item to retrieve

    Returns:
        dict: Item data

    Raises:
        HTTPException: If item not found or invalid ID format
    """
    try:
        item = await file_system.find_one({"_id": ObjectId(item_id)})
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        item["_id"] = str(item["_id"])
        if "parent_id" in item and item["parent_id"]:
            item["parent_id"] = str(item["parent_id"])
        item["user_id"] = str(item["user_id"])
        return item
    except ValueError as exc:
        error_message = "Invalid item ID format"
        raise HTTPException(status_code=400, detail=error_message) from exc


@app.put("/file-system/{item_id}")
async def update_filesystem_item(
    item_id: str,
    name: Optional[str] = None,
    parent_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    is_starred: Optional[bool] = None,
):
    """Update an existing file system item."""
    try:
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if parent_id is not None:
            if parent_id.lower() == "null":
                update_data["parent_id"] = None
            else:
                try:
                    update_data["parent_id"] = ObjectId(parent_id)
                except ValueError as exc:
                    raise HTTPException(
                        status_code=400, detail="Invalid parent_id format"
                    ) from exc
        if tags is not None:
            update_data["tags"] = tags
        if is_starred is not None:
            update_data["is_starred"] = is_starred
        update_data["updated_at"] = datetime.utcnow()

        result = await file_system.update_one(
            {"_id": ObjectId(item_id)}, {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Update successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.delete("/file-system/{item_id}")
async def delete_filesystem_item(item_id: str):
    """Delete a file system item."""
    try:
        # First get the item to check if it has a gridfs_id
        item = await file_system.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # If it's a folder, recursively delete its contents
        if item.get("is_folder"):
            # Find all items with this folder as their parent
            cursor = file_system.find({"parent_id": ObjectId(item_id)})
            async for child_item in cursor:
                # Recursively delete each child item
                await delete_filesystem_item(str(child_item["_id"]))

        # If it's a file (not a folder) and has a gridfs_id, delete from GridFS
        if not item.get("is_folder") and item.get("gridfs_id"):
            try:
                await fs.delete(ObjectId(item["gridfs_id"]))
            except Exception as e:
                print(f"Error deleting from GridFS: {str(e)}")
                # Continue even if GridFS deletion fails

        # Delete from file system
        result = await file_system.delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


# File upload endpoint
@app.post("/file-system/upload/")
async def upload_file_to_filesystem(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
    is_starred: bool = Form(False),
):
    """Upload a file to the file system."""
    try:
        # Read the file content
        f_cont = await file.read()
        # Upload the file to GridFS
        file_id = await fs.upload_from_stream(
            file.filename, f_cont, metadata={"content_type": file.content_type}
        )

        # Create a new item in the file system
        item = {
            "name": file.filename,
            "is_folder": False,
            "gridfs_id": file_id,
            "parent_id": ObjectId(parent_id) if parent_id else None,
            "tags": tags,
            "user_id": ObjectId(user_id),
            "is_starred": is_starred,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await file_system.insert_one(item)
        return {"message": "Upload Success", "item_id": str(item["_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/file-system/download/{file_id}")
async def download_file_from_filesystem(file_id: str):
    """Download a file by its ID."""
    try:
        logger.debug("Downloading file with ID: %s", file_id)

        # Get file from GridFS
        try:
            grid_out = await fs.open_download_stream(ObjectId(file_id))
        except ValueError as e:
            logger.error("Invalid file ID format: %s", str(e))
            error_message = "Invalid ID format"
            raise HTTPException(status_code=400, detail=error_message) from e

        # Get file metadata
        file_metadata = grid_out.metadata
        if not file_metadata:
            logger.warning("No metadata found for file")
            file_metadata = {"content_type": "application/octet-stream"}

        # Create streaming response
        return StreamingResponse(
            io.BytesIO(await grid_out.read()),
            media_type=file_metadata.get(
                "content_type",
                "application/octet-stream",
            ),
            headers={
                "Content-Disposition": (
                    'attachment; filename="' + grid_out.filename + '"'
                )
            },
        )
    except Exception as e:
        logger.error("Error in download: %s", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to download file: " + str(e)
        ) from e


# Debug endpoint to check database contents
@app.get("/debug/db-check")
async def debug_db_check(user_id: str = Query(...)):
    """Debug endpoint to check database state."""
    try:
        user_items = await file_system.find({"user_id": ObjectId(user_id)})
        user_items = await user_items.to_list(length=None)
        return {
            "message": "Database check successful",
            "user_items": [str(item["_id"]) for item in user_items],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Debug endpoint to check user existence
@app.get("/debug/user/{user_id}")
async def debug_check_user(user_id: str):
    """Debug endpoint to check user state."""
    try:
        user = await users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "message": "User check successful",
            "user_id": str(user["_id"]),
            "email": user["email"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class ImageProcessRequest(BaseModel):
    """Request model for image processing endpoint.

    This model represents the data required to process multiple images
    into a PDF document.

    Attributes:
        images (List[bytes]): List of image data in bytes format
        filename (str): Name for the output PDF file
        user_id (str): ID of the user creating the PDF
    """

    images: List[bytes]
    filename: str
    user_id: str


@app.post("/process-images")
async def process_images(request: ImageProcessRequest):
    """Process multiple images into a PDF document.

    Args:
        request (ImageProcessRequest): Request containing images and metadata

    Returns:
        dict: Success message and document ID

    Raises:
        HTTPException: If processing fails
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)

        # Process images and create PDF
        file_id = await process_images_into_pdf(
            request.images, request.filename, request.user_id
        )

        return {
            "message": "PDF created successfully",
            "item_id": file_id,
            "success": True,
        }

    except Exception as e:
        logger.error("Failed to process images: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
