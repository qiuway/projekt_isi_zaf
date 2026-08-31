from security import hash_password, verify_password


def test_password_hashing_and_verification():
    raw = "MojeBezpieczneHaslo!123"
    hashed = hash_password(raw)

    assert hashed.startswith("pbkdf2_sha256$")
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("zle_haslo", hashed) is False
