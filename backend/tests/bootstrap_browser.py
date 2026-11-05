"""Create ONLY the browser runner's disposable database and random test user."""
import os
from pathlib import Path
from uuid import uuid4
from alembic.config import Config
from alembic import command
from app.db import SessionLocal,User,URL
from app.main import hash_password
from app.seed import seed

root=Path(__file__).resolve().parents[2]
target=Path(URL.removeprefix('sqlite:///')).resolve()
if not URL.startswith('sqlite:///') or not target.is_relative_to(root/'test-results'):
    raise SystemExit('Browser bootstrap is restricted to disposable test-results databases.')
command.upgrade(Config(str(root/'backend'/'alembic.ini')),'head')
with SessionLocal() as db:
    seed(db)
    db.add(User(id=str(uuid4()),email='browser@example.test',name='Test owner',password=hash_password(os.environ['BROWSER_TEST_PASSWORD']),role='super_admin'))
    db.commit()
print('Disposable browser database prepared.')
