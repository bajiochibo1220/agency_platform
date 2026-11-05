"""Connection-string parsing tests use fake values and never open a connection."""
import pytest
from app.config import normalize_database_url

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
