"""
FastAPI application for CitrusNotes backend.
This module provides the main API endpoints for:
- User management
- File system operations
- Document handling
- File upload/download
"""

import io
import os
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from passlib.context import CryptContext

from . import models
from .database import create_indexes, db, file_system, fs, users

# Initialize FastAPI application
app = FastAPI()

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configure CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database indexes on application startup
@app.on_event("startup")
async def startup_event():
    await create_indexes()


# User management endpoints
@app.post("/users/")
async def create_user(user: models.UserCreate):
    """Create a new user in the system.

    Args:
        user (models.UserCreate): User creation data including email
        and password

    Returns:
        dict: Created user data (without password)

    Raises:
        HTTPException: If email is already registered
    """
    # Check if user already exists
    existing_user = await users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = pwd_context.hash(user.password)

    # Create user document
    user_dict = user.dict()
    user_dict.pop("password")  # Remove password from the dict
    user_dict["hashed_password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()

    # Insert into database
    result = await users.insert_one(user_dict)

    # Return the created user (without password)
    created_user = await users.find_one({"_id": result.inserted_id})

    # Convert ObjectId to string
    created_user["_id"] = str(created_user["_id"])
    return created_user


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
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


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
        raise HTTPException(status_code=500, detail=str(e))


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
    except ValueError:
        raise HTTPException(status_code=404, detail="Image not found")


# File System Endpoints
@app.post("/file-system/")
async def create_file_system_item(
    name: str,
    path: str,
    size: float,
    is_folder: bool = False,
    parent_id: Optional[str] = None,
    tags: List[str] = [],
    user_id: str = Form(...),
):
    """Create a new file system item (file or folder).

    Args:
        name (str): Name of the item
        path (str): Path of the item
        size (float): Size of the item (0 for folders)
        is_folder (bool): Whether the item is a folder
        parent_id (Optional[str]): ID of the parent folder
        tags (List[str]): List of tags for the item
        user_id (str): ID of the user who owns the item

    Returns:
        dict: Success message and item ID

    Raises:
        HTTPException: If item creation fails
    """
    try:
        item = {
            "name": name,
            "path": path,
            "size": size,
            "created_at": datetime.utcnow(),
            "modified_at": datetime.utcnow(),
            "is_starred": False,
            "tags": tags,
            "user_id": ObjectId(user_id),
            "parent_id": ObjectId(parent_id) if parent_id else None,
            "is_folder": is_folder,
        }
        result = await file_system.insert_one(item)
        return {
            "message": "Item created successfully",
            "id": str(result.inserted_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/file-system/")
async def list_file_system_items(
    user_id: str = Query(...),
    parent_id: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
):
    """List file system items for a user.

    Args:
        user_id (str): ID of the user
        parent_id (Optional[str]): ID of the parent folder
        tags (Optional[List[str]]): Tags to filter by

    Returns:
        List[dict]: List of file system items

    Raises:
        HTTPException: If listing fails
    """
    try:
        # Build query
        query = {"user_id": ObjectId(user_id)}

        # Handle parent_id
        if parent_id is not None:
            if parent_id.lower() == "null":
                query["parent_id"] = None
            else:
                query["parent_id"] = ObjectId(parent_id)
        else:
            query["parent_id"] = None

        if tags:
            query["tags"] = {"$all": tags}

        # Get items
        items = []
        async for item in file_system.find(query):
            try:
                # Convert all ObjectId fields to strings
                item_dict = dict(item)
                for key, value in item_dict.items():
                    if isinstance(value, ObjectId):
                        item_dict[key] = str(value)
                items.append(item_dict)
            except Exception as e:
                print(f"Error processing item: {str(e)}")
                continue

        return items
    except Exception as e:
        print(f"Error in list_file_system_items: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/file-system/{item_id}")
async def update_file_system_item(
    item_id: str,
    name: Optional[str] = None,
    path: Optional[str] = None,
    is_starred: Optional[bool] = None,
    tags: Optional[List[str]] = None,
):
    """Update a file system item.

    Args:
        item_id (str): ID of the item to update
        name (Optional[str]): New name for the item
        path (Optional[str]): New path for the item
        is_starred (Optional[bool]): New star status
        tags (Optional[List[str]]): New tags for the item

    Returns:
        dict: Success message

    Raises:
        HTTPException: If update fails or item not found
    """
    try:
        update_data = {"modified_at": datetime.utcnow()}
        if name is not None:
            update_data["name"] = name
        if path is not None:
            update_data["path"] = path
        if is_starred is not None:
            update_data["is_starred"] = is_starred
        if tags is not None:
            update_data["tags"] = tags

        result = await file_system.update_one(
            {"_id": ObjectId(item_id)}, {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/file-system/{item_id}")
async def delete_file_system_item(item_id: str):
    """Delete a file system item.

    Args:
        item_id (str): ID of the item to delete

    Returns:
        dict: Success message

    Raises:
        HTTPException: If deletion fails or item not found
    """
    try:
        result = await file_system.delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# File Upload Endpoint
@app.post("/files/upload/")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
):
    """Upload a file to the system.

    Args:
        file (UploadFile): The file to upload
        user_id (str): ID of the user uploading the file
        parent_id (Optional[str]): ID of the parent folder
        tags (List[str]): Tags for the file

    Returns:
        dict: Success message and file IDs

    Raises:
        HTTPException: If upload fails
    """
    try:
        # Read file content
        content = await file.read()

        # Upload to GridFS
        file_id = await fs.upload_from_stream(
            file.filename,
            content,
            metadata={
                "content_type": file.content_type,
                "user_id": user_id,
                "parent_id": parent_id,
                "tags": tags,
            },
        )

        # Create file system item
        file_item = {
            "name": file.filename,
            "path": f"/files/{file.filename}",
            "size": len(content),
            "created_at": datetime.utcnow(),
            "modified_at": datetime.utcnow(),
            "is_starred": False,
            "tags": tags,
            "user_id": ObjectId(user_id),
            "parent_id": ObjectId(parent_id) if parent_id else None,
            "is_folder": False,
            "content_type": file.content_type,
            "gridfs_id": file_id,
        }

        # Insert into file_system collection
        result = await file_system.insert_one(file_item)

        return {
            "message": "File uploaded successfully",
            "file_id": str(file_id),
            "item_id": str(result.inserted_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# File Download Endpoint
@app.get("/files/{file_id}")
async def download_file(file_id: str):
    """Download a file by its ID.

    Args:
        file_id (str): ID of the file to download

    Returns:
        StreamingResponse: The file as a streaming response

    Raises:
        HTTPException: If file not found
    """
    try:
        # Get file from GridFS
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        if not grid_out:
            raise HTTPException(status_code=404, detail="File not found")

        # Get file metadata
        file_metadata = grid_out.metadata

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
    except ValueError:
        raise HTTPException(status_code=404, detail="File not found")


# List Files Endpoint
@app.get("/files/")
async def list_files(
    user_id: str,
    parent_id: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
):
    """List files for a user.

    Args:
        user_id (str): ID of the user
        parent_id (Optional[str]): ID of the parent folder
        tags (Optional[List[str]]): Tags to filter by

    Returns:
        List[dict]: List of files

    Raises:
        HTTPException: If listing fails
    """
    try:
        # Build query
        query = {"user_id": ObjectId(user_id), "is_folder": False}
        if parent_id:
            query["parent_id"] = ObjectId(parent_id)
        if tags:
            query["tags"] = {"$all": tags}

        files = await file_system.find(query).to_list(length=None)
        for file in files:
            file["_id"] = str(file["_id"])
            if "parent_id" in file and file["parent_id"]:
                file["parent_id"] = str(file["parent_id"])
            if "gridfs_id" in file:
                file["gridfs_id"] = str(file["gridfs_id"])
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create Folder Endpoint
@app.post("/folders/")
async def create_folder(
    name: str,
    path: str,
    user_id: str = Form(...),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
):
    """Create a new folder.

    Args:
        name (str): Name of the folder
        path (str): Path of the folder
        user_id (str): ID of the user creating the folder
        parent_id (Optional[str]): ID of the parent folder
        tags (List[str]): Tags for the folder

    Returns:
        dict: Success message and folder ID

    Raises:
        HTTPException: If folder creation fails
    """
    try:
        # Get the correct collection
        user_collection = users

        folder = {
            "name": name,
            "path": path,
            "size": 0,
            "created_at": datetime.utcnow(),
            "modified_at": datetime.utcnow(),
            "is_starred": False,
            "tags": tags,
            "parent_id": parent_id,
            "is_folder": True,
        }

        result = await user_collection.insert_one(folder)
        return {
            "message": "Folder created successfully",
            "id": str(result.inserted_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# List Folders Endpoint
@app.get("/folders/")
async def list_folders(user_id: str, parent_id: Optional[str] = None):
    """List folders for a user.

    Args:
        user_id (str): ID of the user
        parent_id (Optional[str]): ID of the parent folder

    Returns:
        List[dict]: List of folders

    Raises:
        HTTPException: If listing fails
    """
    try:
        # Get the correct collection
        user_collection = users

        query = {"is_folder": True}
        if parent_id:
            query["parent_id"] = parent_id

        folders = await user_collection.find(query).to_list(length=None)
        for folder in folders:
            folder["_id"] = str(folder["_id"])
            if "parent_id" in folder and folder["parent_id"]:
                folder["parent_id"] = str(folder["parent_id"])
        return folders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FileSystem endpoints
@app.post("/filesystem/")
async def create_filesystem_item(
    name: str = Form(...),
    path: str = Form(...),
    is_folder: bool = Form(False),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
    user_id: str = Form(...),
):
    """Create a new file system item (file or folder).

    Args:
        name (str): Name of the item
        path (str): Path of the item
        is_folder (bool): Whether the item is a folder
        parent_id (Optional[str]): ID of the parent folder
        tags (List[str]): Tags for the item
        user_id (str): ID of the user creating the item

    Returns:
        dict: Created item data

    Raises:
        HTTPException: If item creation fails
    """
    try:
        # Create the filesystem item
        item = {
            "name": name,
            "path": path,
            "is_folder": is_folder,
            "parent_id": ObjectId(parent_id) if parent_id else None,
            "tags": tags,
            "user_id": ObjectId(user_id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "size": 0 if is_folder else None,
        }

        # Insert into database
        result = await file_system.insert_one(item)

        # Return the created item
        created_item = await file_system.find_one({"_id": result.inserted_id})
        created_item["_id"] = str(created_item["_id"])
        if "parent_id" in created_item and created_item["parent_id"]:
            created_item["parent_id"] = str(created_item["parent_id"])
        created_item["user_id"] = str(created_item["user_id"])
        return created_item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/filesystem/")
async def list_filesystem_items(
    user_id: str = Query(...),
    parent_id: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
):
    """List file system items for a user.

    Args:
        user_id (str): ID of the user
        parent_id (Optional[str]): ID of the parent folder
        tags (Optional[List[str]]): Tags to filter by

    Returns:
        List[dict]: List of file system items

    Raises:
        HTTPException: If listing fails
    """
    try:
        # Build query
        query = {"user_id": ObjectId(user_id)}
        if parent_id:
            query["parent_id"] = ObjectId(parent_id)
        if tags:
            query["tags"] = {"$all": tags}

        # Get items
        items = []
        async for item in file_system.find(query):
            try:
                item["_id"] = str(item["_id"])
                if "parent_id" in item and item["parent_id"]:
                    item["parent_id"] = str(item["parent_id"])
                item["user_id"] = str(item["user_id"])
                items.append(item)
            except Exception as e:
                print(f"Error processing item: {str(e)}")
                continue

        return items
    except Exception as e:
        print(f"Error in list_filesystem_items: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/filesystem/{item_id}")
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
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item ID format")


@app.put("/filesystem/{item_id}")
async def update_filesystem_item(
    item_id: str,
    name: Optional[str] = None,
    path: Optional[str] = None,
    tags: Optional[List[str]] = None,
):
    """Update a file system item.

    Args:
        item_id (str): ID of the item to update
        name (Optional[str]): New name for the item
        path (Optional[str]): New path for the item
        tags (Optional[List[str]]): New tags for the item

    Returns:
        dict: Updated item data

    Raises:
        HTTPException: If update fails or item not found
    """
    try:
        # Build update data
        update_data = {"updated_at": datetime.utcnow()}
        if name is not None:
            update_data["name"] = name
            # Set path to "/" + new name
            update_data["path"] = f"/{name}"
        if tags is not None:
            update_data["tags"] = tags

        # Update item
        result = await file_system.update_one(
            {"_id": ObjectId(item_id)}, {"$set": update_data}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        # Return updated item
        updated_item = await file_system.find_one({"_id": ObjectId(item_id)})
        if not updated_item:
            raise HTTPException(
                status_code=404,
                detail="Item not found after update",
            )

        updated_item["_id"] = str(updated_item["_id"])
        if "parent_id" in updated_item and updated_item["parent_id"]:
            updated_item["parent_id"] = str(updated_item["parent_id"])
        updated_item["user_id"] = str(updated_item["user_id"])
        return updated_item
    except Exception as e:
        print(f"Error in patch_filesystem_item: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/filesystem/{item_id}")
async def delete_filesystem_item(item_id: str):
    """Delete a file system item.

    Args:
        item_id (str): ID of the item to delete

    Returns:
        dict: Success message

    Raises:
        HTTPException: If deletion fails or item not found
    """
    try:
        # First get the item to check if it has a gridfs_id
        item = await file_system.find_one({"_id": ObjectId(item_id)})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # If it's a file (not a folder) and has a gridfs_id, delete from GridFS
        if not item.get("is_folder") and item.get("gridfs_id"):
            try:
                await fs.delete(ObjectId(item["gridfs_id"]))
            except Exception as e:
                print(f"Error deleting from GridFS: {str(e)}")
                # Continue with file system deletion even if  deletion fails

        # Delete from file system
        result = await file_system.delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/filesystem/upload/")
async def upload_file_to_filesystem(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    parent_id: Optional[str] = Form(None),
    tags: List[str] = Form([]),
):
    """Upload a file to the system.

    Args:
        file (UploadFile): The file to upload
        user_id (str): ID of the user uploading the file
        parent_id (Optional[str]): ID of the parent folder
        tags (List[str]): Tags for the file

    Returns:
        dict: Success message and file IDs

    Raises:
        HTTPException: If upload fails or user not found
    """
    try:
        # Validate user
        user = await get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create file record
        file_id = str(ObjectId())
        file_record = {
            "_id": file_id,
            "name": file.filename,
            "type": "file",
            "parent_id": parent_id,
            "user_id": user_id,
            "tags": tags,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        # Save file to storage
        file_path = f"uploads/{user_id}/{file_id}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Save record to database
        await file_system.insert_one(file_record)

        return {"message": "File uploaded successfully", "file_id": file_id}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}",
        )


@app.get("/filesystem/download/{file_id}")
async def download_file_from_filesystem(file_id: str):
    """Download a file by its ID.

    Args:
        file_id (str): ID of the file to download

    Returns:
        StreamingResponse: The file as a streaming response

    Raises:
        HTTPException: If file not found
    """
    try:
        # Get file from GridFS
        grid_out = await fs.open_download_stream(ObjectId(file_id))

        # Get file metadata
        file_metadata = grid_out.metadata

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
    except ValueError:
        raise HTTPException(status_code=404, detail="File not found")
