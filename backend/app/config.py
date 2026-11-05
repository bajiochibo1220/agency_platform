"""Validate pasted environment values without putting credentials in errors."""
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def normalize_database_url(value: str) -> str:
    value = value.strip()
    # A hosting environment field expects the value alone. Tolerate copying the
    # dotenv assignment or its outer quotes, including a missing closing quote.
    if value.startswith('DATABASE_URL='):
        value = value.split('=', 1)[1].strip()
    value = value.strip('\"\'').strip()
    if not value or any(character.isspace() for character in value):
        raise RuntimeError('DATABASE_URL must contain one complete connection URL on one line. Paste only the connection string into Render, without a psql command.')
    if value.startswith(('postgres://', 'postgresql://')):
        value = value.replace('postgres://', 'postgresql+psycopg://', 1).replace('postgresql://', 'postgresql+psycopg://', 1)
    try:
        parsed = make_url(value)
        if parsed.drivername not in {'sqlite', 'postgresql+psycopg'}:
            raise ValueError('Unsupported driver')
        if parsed.drivername == 'postgresql+psycopg':
            if not parsed.host or not parsed.database:
                raise ValueError('Missing host or database')
            _ = parsed.port
    except (ArgumentError, ValueError):
        # Suppress the parser's original exception, which could include a value
        # copied from the connection string in a future SQLAlchemy version.
        raise RuntimeError('DATABASE_URL is invalid. In Render, set its value to the full Neon PostgreSQL connection string; do not include a psql command, code block or extra text.') from None
    return value
