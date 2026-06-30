# RCA/backend/src/core/utils/encryption.py
import bcrypt
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.src.config.settings import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def encrypt_data(plaintext: str) -> str:
    key = base64.b64decode(settings.ddm_encryption_key)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_data(encrypted: str) -> str:
    key = base64.b64decode(settings.ddm_encryption_key)
    raw = base64.b64decode(encrypted)
    nonce, ciphertext = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")
# end of RCA/backend/src/core/utils/encryption.py