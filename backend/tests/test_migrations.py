from unittest.mock import patch
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine,inspect
from pathlib import Path
from app.db import Base

def test_fresh_schema_upgrade_and_downgrade(tmp_path):
    disposable=create_engine('sqlite:///'+str(tmp_path/'migration-only.db'))
    config=Config(str(Path(__file__).resolve().parents[1]/'alembic.ini'))
    with patch('app.db.engine',disposable):
        command.upgrade(config,'head')
        assert set(inspect(disposable).get_table_names())==set(Base.metadata.tables)|{'alembic_version'}
        command.downgrade(config,'base')
        assert inspect(disposable).get_table_names()==['alembic_version']
    disposable.dispose()
