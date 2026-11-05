"""Run from backend: python manage.py create-admin / backup / seed."""
import argparse
import getpass
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from sqlalchemy import select
from app.db import SessionLocal, User, URL, ROOT
from app.main import hash_password
from app.seed import seed

parser=argparse.ArgumentParser()
parser.add_argument('command',choices=['create-admin','seed','backup','check-integrations'])
args=parser.parse_args()
if args.command=='create-admin':
    email=(os.getenv('ADMIN_EMAIL') or input('Admin email: ')).strip().lower()
    password=os.getenv('ADMIN_PASSWORD') or getpass.getpass('Password (12+ characters): ')
    if len(password)<12 or '@' not in email:
        raise SystemExit('Use a valid email and a password of at least 12 characters.')
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email==email)):
            raise SystemExit('That user already exists. Use the dashboard to change their password.')
        db.add(User(id=str(uuid4()),email=email,name='Studio owner',password=hash_password(password),role='super_admin'))
        seed(db)
        db.commit()
    print('Super admin created. No default password is stored in the project.')
elif args.command=='seed':
    with SessionLocal() as db: seed(db)
    print('Sample content is ready.')
elif args.command=='check-integrations':
    from sqlalchemy import text
    from app import storage
    with SessionLocal() as db: db.execute(text('SELECT 1'))
    print('Database connection verified.')
    if storage.provider()=='cloudinary':
        storage.check()
        print('Cloudinary credentials verified.')
    else: print('Explicit local preview: Cloudinary connection was not tested.')
else:
    if not URL.startswith('sqlite:///'):
        raise SystemExit('For PostgreSQL, use pg_dump with your own database URL. See docs/OPERATIONS.md.')
    folder=ROOT/'data'/'backups'
    folder.mkdir(exist_ok=True)
    target=folder/f'agency-{datetime.now():%Y%m%d-%H%M%S}.db'
    with sqlite3.connect(URL.removeprefix('sqlite:///')) as source, sqlite3.connect(target) as dest:
        source.backup(dest)
    print(f'Backup saved to {target}. Back up backend/uploads separately.')
