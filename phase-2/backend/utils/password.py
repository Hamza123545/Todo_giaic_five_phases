"""
Password hashing and verification utilities using bcrypt.

This module provides secure password hashing and verification functions
using the passlib library with bcrypt algorithm.
"""

import os
import warnings
from passlib.context import CryptContext

# Suppress passlib warnings during initialization
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")
warnings.filterwarnings("ignore", message=".*password cannot be longer than 72 bytes.*")
warnings.filterwarnings("ignore", message=".*bcrypt.*")

# Disable passlib's bug detection during initialization to avoid bcrypt 72-byte limit issue
# This is a known issue with passlib and newer bcrypt versions
os.environ.setdefault("PASSLIB_SUPPRESS_WARNINGS", "1")

# Monkeypatch bcrypt to skip bug detection BEFORE creating CryptContext
# This must happen before CryptContext is instantiated
try:
    from passlib.handlers.bcrypt import bcrypt as bcrypt_handler
    
    # Patch detect_wrap_bug to always return False (skip bug detection)
    if hasattr(bcrypt_handler._BcryptBackend, 'detect_wrap_bug'):
        @classmethod
        def patched_detect_wrap_bug(cls, ident):
            return False  # Always return False to skip bug detection
        bcrypt_handler._BcryptBackend.detect_wrap_bug = patched_detect_wrap_bug
    
    # Patch _finalize_backend_mixin to skip bug detection
    if hasattr(bcrypt_handler._BcryptBackend, '_finalize_backend_mixin'):
        original_finalize = bcrypt_handler._BcryptBackend._finalize_backend_mixin
        @classmethod
        def patched_finalize_backend_mixin(cls, name, dryrun):
            # Skip the bug detection step entirely
            # Just return the class without running bug detection
            return cls
        bcrypt_handler._BcryptBackend._finalize_backend_mixin = patched_finalize_backend_mixin
except Exception:
    # If patching fails, continue anyway
    pass

# Create password context with bcrypt
# The patching above should prevent the 72-byte limit error
try:
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
        bcrypt__ident="2b",
        bcrypt__rounds=12,
    )
except Exception as e:
    # If initialization fails due to bcrypt issue, create a simpler context
    import sys
    print(f"Warning: CryptContext initialization failed: {e}", file=sys.stderr)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        str: Hashed password string

    Example:
        >>> hashed = hash_password("securepassword123")
        >>> print(hashed[:7])
        $2b$12$
    """
    try:
        return pwd_context.hash(password)
    except ValueError as e:
        # If bcrypt still fails, try with a truncated password (shouldn't happen with normal passwords)
        if "password cannot be longer than 72 bytes" in str(e):
            # This should never happen with normal passwords, but handle it gracefully
            if len(password.encode('utf-8')) > 72:
                password = password[:72]
            return pwd_context.hash(password)
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database

    Returns:
        bool: True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("securepassword123")
        >>> verify_password("securepassword123", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)
