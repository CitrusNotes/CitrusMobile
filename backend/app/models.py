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
        """Validate and convert a value to a valid ObjectId string.

        Args:
            v: The value to validate and convert.

        Returns:
            str: The validated ObjectId string.

        Raises:
            ValueError: If the value is not a valid ObjectId.
        """
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema_generator):
        return {"type": "string", "format": "objectid"}


class UserBase(BaseModel):
    """Base model for user data.

    This class serves as the foundation for user-related models,
    containing common fields shared across different user models.

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
    """User creation model.

    This class extends UserBase to include password for user registration.
    It is used when creating a new user account in the system.

    Attributes:
        password (str): The user's password for authentication.
    """

    password: str


class User(UserBase):
    """Complete user model with database fields.

    This model represents a user in the database, extending UserBase
    to include database-specific fields like creation timestamps.

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

    This class serves as the foundation for note-related models,
    containing common fields shared across different note models.

    Attributes:
        title (str): Note title
        content (str): Note content
        tags (List[str]): List of tags associated with the note
    """

    title: str
    content: str
    tags: List[str] = []


class Note(NoteBase):
    """Complete note model with database fields.

    This model represents a note in the database, extending NoteBase
    to include database-specific fields like user ownership and timestamps.

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

    This class serves as the foundation for file-related models,
    containing common fields shared across different file models.

    Attributes:
        filename (str): Name of the file
        content_type (str): MIME type of the file
        size (int): Size of the file in bytes
    """

    filename: str
    content_type: str
    size: int


class File(FileBase):
    """Complete file model with database fields.

    This model represents a file in the database, extending FileBase
    to include database-specific fields like user ownership and timestamps.

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
    """Scanned document model.

    This class represents a document that has been scanned and processed.
    It contains metadata about the document and its PDF representation.

    Attributes:
        id (Optional[PyObjectId]): The MongoDB document ID.
        title (str): The title of the scanned document.
        pdf_url (Optional[str]): The URL to the generated PDF file.
        created_at (datetime): The timestamp when the document was created.
        updated_at (datetime): The timestamp when the document was updated.
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
    """Scanned image model.

    This class represents an individual image within a scanned document.
    It contains metadata about the image and its position in the document.

    Attributes:
        id (Optional[PyObjectId]): The MongoDB document ID.
        document_id (PyObjectId): The ID of the parent document.
        image_url (str): The URL to the image file.
        order_index (int): The position of the image in the document.
        created_at (datetime): The timestamp when the image was created.
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
    """File system item model.

    This class represents both files and folders in the user's file system.
    It contains metadata about the item's location, type, and ownership.

    Attributes:
        id (PyObjectId): The MongoDB document ID.
        name (str): The name of the item.
        path (str): The full path of the item.
        size (float): The size of the item in bytes (0 for folders).
        created_at (datetime): The timestamp when the item was created.
        modified_at (datetime): The timestamp when the item was last modified.
        is_starred (bool): Whether the item is starred.
        tags (List[str]): List of tags associated with the item.
        user_id (PyObjectId): The ID of the user who owns the item.
        parent_id (Optional[PyObjectId]): The ID of the parent folder.
        is_folder (bool): Whether the item is a folder.
        content_type (Optional[str]): The MIME type of file (Folders: None).
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

    This model represents a JWT token used for user authentication,
    containing the token string and its type.

    Attributes:
        access_token (str): The JWT token
        token_type (str): Type of token (typically "bearer")
    """

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Model for token payload data.

    This model represents the data stored within a JWT token,
    containing the authenticated user's email.

    Attributes:
        email (Optional[str]): Email address of the authenticated user
    """

    email: Optional[str] = None
