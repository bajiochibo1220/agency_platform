"""Connection-string parsing tests use fake values and never open a connection."""
import pytest
from app.config import normalize_database_url, normalize_allowed_origins

FAKE_URL = 'postgresql://example_user:DISPOSABLE_NOT_A_PASSWORD@example.invalid/example_db?sslmode=require&channel_binding=require'

@pytest.mark.parametrize('value', [FAKE_URL, '"'+FAKE_URL+'"', "'"+FAKE_URL+"'", '"'+FAKE_URL, 'DATABASE_URL="'+FAKE_URL+'"'])
def test_pasted_neon_url_forms(value):
    assert normalize_database_url(value) == FAKE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)

@pytest.mark.parametrize('value', ['invalid-CONFIDENTIAL-value', 'psql "'+FAKE_URL+'"', FAKE_URL+'\nEXTRA_SECRET=value', 'postgresql:///missing-host', 'mysql://user:SECRET@example.invalid/db'])
def test_invalid_url_has_safe_actionable_error(value):
    with pytest.raises(RuntimeError) as error:
        normalize_database_url(value)
    assert 'DATABASE_URL' in str(error.value)
    assert 'CONFIDENTIAL' not in str(error.value)
    assert 'EXTRA_SECRET' not in str(error.value)
    assert 'DISPOSABLE_NOT_A_PASSWORD' not in str(error.value)

def test_sqlite_test_url_is_preserved():
    assert normalize_database_url('sqlite:///disposable-test.db') == 'sqlite:///disposable-test.db'

def test_allowed_origins_normalizes_pasted_values():
    assert normalize_allowed_origins(' "https://Agency-Platform-Navy.vercel.app/", https://example.test:443/, http://localhost:3100/ ,https://example.test ') == [
        'https://agency-platform-navy.vercel.app', 'https://example.test', 'http://localhost:3100']

@pytest.mark.parametrize('value', ['*', 'https://*.vercel.app', 'https://example.test/admin', 'https://example.test?key=PRIVATE', 'https://user:PRIVATE@example.test', 'not-a-url'])
def test_allowed_origins_rejects_unsafe_values(value):
    with pytest.raises(RuntimeError) as error:
        normalize_allowed_origins(value)
    assert 'ALLOWED_ORIGINS' in str(error.value)
    assert 'PRIVATE' not in str(error.value)
