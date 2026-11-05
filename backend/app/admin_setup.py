"""Shared, transaction-safe first-owner setup for the form and CLI."""
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from .db import SetupCompletion, User, Audit

CLAIM = 'initial-admin'

class SetupClosed(Exception):
    pass

def setup_complete(db):
    return db.get(SetupCompletion, CLAIM) is not None or db.scalar(select(User.id).limit(1)) is not None

def create_initial_admin(db, *, email, name, password_hash):
    if setup_complete(db):
        raise SetupClosed('Administrator registration is closed. Please sign in.')
    stamp = datetime.now(timezone.utc).isoformat()
    try:
        # The fixed primary key serializes concurrent claims across processes.
        # Claim, account and audit commit together, so failed setup can be retried.
        db.add(SetupCompletion(id=CLAIM, created=stamp))
        db.flush()
        user = User(id=str(uuid4()), email=email, name=name, password=password_hash, role='super_admin')
        db.add(user)
        db.add(Audit(id=str(uuid4()), actor=email, action='initial_admin_setup', target=user.id, created=stamp))
        db.commit()
        return user
    except IntegrityError:
        db.rollback()
        raise SetupClosed('Administrator registration is closed. Please sign in.') from None
