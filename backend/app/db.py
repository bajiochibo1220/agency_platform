"""Small shared persistence layer; SQLite locally, PostgreSQL via DATABASE_URL."""
import os
from pathlib import Path
from sqlalchemy import create_engine, String, Text, JSON, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from dotenv import load_dotenv
from .config import normalize_database_url

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT.parent / '.env')
load_dotenv(ROOT / '.env')
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)
URL = os.getenv('DATABASE_URL', '').strip()
if not URL:
    if os.getenv('LOCAL_DEVELOPMENT') != 'true':
        raise RuntimeError('Set DATABASE_URL to your Neon connection string in agency-platform/.env. Use npm run dev:local for an explicitly local preview.')
    URL = f'sqlite:///{DATA / "agency.db"}'
URL = normalize_database_url(URL)
if os.getenv('ENVIRONMENT') == 'production' and not URL.startswith('postgresql+psycopg://'):
    raise RuntimeError('Production requires Neon PostgreSQL, not SQLite.')
engine = create_engine(URL, connect_args={'check_same_thread': False} if URL.startswith('sqlite') else {}, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class Record(Base):
    __tablename__ = 'records'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated: Mapped[str] = mapped_column(String(40))
    __mapper_args__ = {'version_id_col': version, 'version_id_generator': False}

class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    password: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(30))
    active: Mapped[int] = mapped_column(Integer, default=1)

class SetupCompletion(Base):
    """Durable one-time claim; never delete this when users change."""
    __tablename__ = 'setup_completion'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    created: Mapped[str] = mapped_column(String(40))

class Session(Base):
    __tablename__ = 'sessions'
    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(40), index=True)
    expires: Mapped[int] = mapped_column(Integer)

class Audit(Base):
    __tablename__ = 'audit'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    actor: Mapped[str] = mapped_column(String(200))
    action: Mapped[str] = mapped_column(String(80))
    target: Mapped[str] = mapped_column(String(100))
    created: Mapped[str] = mapped_column(String(40))

class Revision(Base):
    __tablename__ = 'revisions'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    record_id: Mapped[str] = mapped_column(String(40), index=True)
    version: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON)
    created: Mapped[str] = mapped_column(String(40))
