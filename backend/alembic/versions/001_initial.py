"""Initial content, sessions, roles, revisions and audit schema."""
from alembic import op
import sqlalchemy as sa

revision='001'
down_revision=None

def upgrade():
    op.create_table('records',sa.Column('id',sa.String(40),primary_key=True),sa.Column('kind',sa.String(40),nullable=False,index=True),sa.Column('data',sa.JSON(),nullable=False),sa.Column('version',sa.Integer(),nullable=False),sa.Column('updated',sa.String(40),nullable=False))
    op.create_table('users',sa.Column('id',sa.String(40),primary_key=True),sa.Column('email',sa.String(200),nullable=False,unique=True),sa.Column('name',sa.String(120),nullable=False),sa.Column('password',sa.Text(),nullable=False),sa.Column('role',sa.String(30),nullable=False),sa.Column('active',sa.Integer(),nullable=False))
    op.create_table('sessions',sa.Column('token',sa.String(64),primary_key=True),sa.Column('user_id',sa.String(40),nullable=False,index=True),sa.Column('expires',sa.Integer(),nullable=False))
    op.create_table('audit',sa.Column('id',sa.String(40),primary_key=True),sa.Column('actor',sa.String(200),nullable=False),sa.Column('action',sa.String(80),nullable=False),sa.Column('target',sa.String(100),nullable=False),sa.Column('created',sa.String(40),nullable=False))
    op.create_table('revisions',sa.Column('id',sa.String(40),primary_key=True),sa.Column('record_id',sa.String(40),nullable=False,index=True),sa.Column('version',sa.Integer(),nullable=False),sa.Column('data',sa.JSON(),nullable=False),sa.Column('created',sa.String(40),nullable=False))

def downgrade():
    for table in ['revisions','audit','sessions','users','records']:
        op.drop_table(table)
