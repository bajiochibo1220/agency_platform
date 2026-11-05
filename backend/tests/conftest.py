"""Never load application credentials: all tests use a disposable SQLite DB."""
import os
import sys
import tempfile
from pathlib import Path
import pytest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
TEST_FOLDER=tempfile.TemporaryDirectory(prefix='agency-tests-')
os.environ.update(DATABASE_URL='sqlite:///'+str(Path(TEST_FOLDER.name)/'test.db'),MEDIA_STORAGE='local',LOCAL_DEVELOPMENT='true',ENVIRONMENT='test',UPLOAD_DIR=str(Path(TEST_FOLDER.name)/'uploads'))
from app.db import Base,engine,SessionLocal,User
from app.main import app,hash_password,LIMITS
from app.seed import seed
from fastapi.testclient import TestClient

@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    LIMITS.clear()
    with SessionLocal() as db:
        seed(db)
        for role in ['super_admin','administrator','content_manager','sales','team_member']:
            db.add(User(id=role,email=f'{role}@test.example',name=role,password=hash_password('Disposable-Test-Password!'),role=role))
        db.commit()
    with TestClient(app,headers={'X-Requested-With':'agency-platform'}) as c:
        yield c

@pytest.fixture()
def admin(client):
    assert client.post('/api/auth/login',json={'email':'super_admin@test.example','password':'Disposable-Test-Password!'}).status_code==200
    return client

def pytest_sessionfinish(session,exitstatus):
    engine.dispose()
    TEST_FOLDER.cleanup()
