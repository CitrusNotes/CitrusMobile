"""
Data models for the CitrusNotes application.
This module defines Pydantic models for:
- User management
- Note handling
- File system operations
- Document scanning
- Authentication tokens
"""

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


class PyObjectId(str):
    """Custom type for MongoDB ObjectId handling.

    This class provides validation and serialization for MongoDB ObjectIds.
    It ensures proper conversion between ObjectId and string representations.
    """

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema_generator):
        return {"type": "string", "format": "objectid"}


class UserBase(BaseModel):
    """Base model for user data.

    Attributes:
        email (EmailStr): User's email address
        username (str): User's username
        full_name (Optional[str]): User's full name
        is_active (bool): Whether the user account is active
    """

    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    """Model for user creation.

    Extends UserBase to include password for new user registration.

    Attributes:
        password (str): User's password (will be hashed before storage)
    """

    password: str


class User(UserBase):
    """Complete user model with database fields.

    Extends UserBase to include database-specific fields.

    Attributes:
        id (PyObjectId): MongoDB document ID
        created_at (datetime): Account creation timestamp
        updated_at (datetime): Last update timestamp
    """

    id: PyObjectId = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True


class NoteBase(BaseModel):
    """Base model for note data.

    Attributes:
        title (str): Note title
        content (str): Note content
        tags (List[str]): List of tags associated with the note
    """

    title: str
    content: str
    tags: List[str] = []


class NoteCreate(NoteBase):
    """Model for note creation.

    Currently identical to NoteBase, but separated for future extensibility.
    """

    pass


class Note(NoteBase):
    """Complete note model with database fields.

    Extends NoteBase to include database-specific fields.

    Attributes:
        id (PyObjectId): MongoDB document ID
        user_id (PyObjectId): ID of the user who owns the note
        created_at (datetime): Note creation timestamp
        updated_at (datetime): Last update timestamp
    """

    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True


class FileBase(BaseModel):
    """Base model for file data.

    Attributes:
        filename (str): Name of the file
        content_type (str): MIME type of the file
        size (int): Size of the file in bytes
    """

    filename: str
    content_type: str
    size: int


class FileCreate(FileBase):
    """Model for file creation.

    Currently identical to FileBase, but separated for future extensibility.
    """

    pass


class File(FileBase):
    """Complete file model with database fields.

    Extends FileBase to include database-specific fields.

    Attributes:
        id (PyObjectId): MongoDB document ID
        user_id (PyObjectId): ID of the user who owns the file
        note_id (Optional[PyObjectId]): ID of the associated note, if any
        created_at (datetime): File creation timestamp
        updated_at (datetime): Last update timestamp
    """

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    note_id: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ScannedDocument(BaseModel):
    """Model for scanned documents.

    Represents a document created from scanned images.

    Attributes:
        id (Optional[PyObjectId]): MongoDB document ID
        title (str): Document title
        pdf_url (Optional[str]): URL to the generated PDF
        created_at (datetime): Document creation timestamp
        updated_at (datetime): Last update timestamp
    """

    id: Optional[PyObjectId] = Field(alias="_id")
    title: str
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ScannedImage(BaseModel):
    """Model for scanned images.

    Represents an individual image within a scanned document.

    Attributes:
        id (Optional[PyObjectId]): MongoDB document ID
        document_id (PyObjectId): ID of the parent document
        image_url (str): URL to the image file
        order_index (int): Position of the image in the document
        created_at (datetime): Image creation timestamp
    """

    id: Optional[PyObjectId] = Field(alias="_id")
    document_id: PyObjectId
    image_url: str
    order_index: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class FileSystemItem(BaseModel):
    """Model for file system items (files and folders).

    Represents both files and folders in the user's file system.

    Attributes:
        id (PyObjectId): MongoDB document ID
        name (str): Name of the item
        path (str): Full path of the item
        size (float): Size of the item in bytes (0 for folders)
        created_at (datetime): Item creation timestamp
        modified_at (datetime): Last modification timestamp
        is_starred (bool): Whether the item is starred
        tags (List[str]): List of tags associated with the item
        user_id (PyObjectId): ID of the user who owns the item
        parent_id (Optional[PyObjectId]): ID of the parent folder
        is_folder (bool): Whether the item is a folder
        content_type (Optional[str]): MIME type of the file (None for folders)
    """

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    path: str
    size: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    is_starred: bool = False
    tags: List[str] = []
    user_id: PyObjectId
    parent_id: Optional[PyObjectId] = None
    is_folder: bool = False
    content_type: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Token(BaseModel):
    """Model for authentication tokens.

    Represents a JWT token used for authentication.

    Attributes:
        access_token (str): The JWT token
        token_type (str): Type of token (typically "bearer")
    """

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Model for token payload data.

    Represents the data stored within a JWT token.

    Attributes:
        email (Optional[str]): Email address of the authenticated user
    """

    email: Optional[str] = None
