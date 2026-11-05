"""Persist first-admin registration closure, including existing installations."""
from datetime import datetime, timezone
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'

def upgrade():
    table = op.create_table('setup_completion',
        sa.Column('id', sa.String(40), primary_key=True),
        sa.Column('created', sa.String(40), nullable=False))
    if op.get_bind().execute(sa.text('SELECT id FROM users LIMIT 1')).first():
        op.bulk_insert(table, [{'id': 'initial-admin', 'created': datetime.now(timezone.utc).isoformat()}])

def downgrade():
    op.drop_table('setup_completion')
