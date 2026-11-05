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
from app.admin_setup import create_initial_admin, reset_admin_setup, SetupClosed

parser=argparse.ArgumentParser()
parser.add_argument('command',choices=['create-admin','reset-admin-setup','seed','backup','check-integrations'])
parser.add_argument('--confirm-reset', action='store_true', help='Explicitly remove every login account/session and reopen first-owner registration.')
args=parser.parse_args()
if args.command=='reset-admin-setup':
    if not args.confirm_reset:
        raise SystemExit('This removes ALL login accounts and sessions, while preserving website content and enquiries. Run reset-admin-setup --confirm-reset to proceed.')
    if len(os.getenv('ADMIN_SETUP_KEY', '')) < 32:
        raise SystemExit('Set a private ADMIN_SETUP_KEY of at least 32 characters before resetting accounts. No accounts were removed.')
    with SessionLocal() as db:
        reset_admin_setup(db)
    print('Login accounts and sessions removed. First-owner registration is open. Website content and enquiries were preserved.')
elif args.command=='create-admin':
    email=(os.getenv('ADMIN_EMAIL') or input('Admin email: ')).strip().lower()
    password=os.getenv('ADMIN_PASSWORD') or getpass.getpass('Password (4+ characters): ')
    if len(password)<4 or '@' not in email:
        raise SystemExit('Use a valid email and a password of at least 4 characters.')
    with SessionLocal() as db:
        seed(db)
        try:
            create_initial_admin(db, email=email, name='Studio owner', password_hash=hash_password(password))
        except SetupClosed as error:
            raise SystemExit(str(error)) from None
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
