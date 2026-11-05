"""First-owner claims use disposable test databases and fake setup keys only."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from sqlalchemy import select, delete
from app.db import SessionLocal, User, Session, SetupCompletion
from app.main import verify_password

KEY = 'disposable-owner-setup-key-1234567890'
BODY = dict(name='First Owner', email='OWNER@example.test', password='Disposable-Owner-Password!', setupKey=KEY)

def empty_installation(monkeypatch):
    monkeypatch.setenv('ADMIN_SETUP_KEY', KEY)
    with SessionLocal() as db:
        db.execute(delete(Session))
        db.execute(delete(User))
        db.commit()

def test_first_registration_then_permanent_closure(client, monkeypatch):
    empty_installation(monkeypatch)
    assert client.get('/api/auth/setup').json() == {'available': True}
    response = client.post('/api/auth/setup', json=BODY)
    assert response.status_code == 201
    assert 'password' not in response.text and KEY not in response.text
    with SessionLocal() as db:
        user = db.scalar(select(User))
        assert user.email == 'owner@example.test' and user.role == 'super_admin'
        assert user.password != BODY['password'] and verify_password(BODY['password'], user.password)
        assert db.get(SetupCompletion, 'initial-admin')
    assert client.post('/api/auth/login', json={'email': 'owner@example.test', 'password': BODY['password']}).status_code == 200
    assert client.get('/api/auth/setup').json() == {'available': False}
    assert client.post('/api/auth/setup', json={**BODY, 'email': 'second@example.test'}).status_code == 409
    with SessionLocal() as db:
        db.execute(delete(Session))
        db.execute(delete(User))
        db.commit()
    # Removing all accounts or changing the setup key must never reopen setup.
    monkeypatch.setenv('ADMIN_SETUP_KEY', KEY + '-changed')
    assert client.get('/api/auth/setup').json() == {'available': False}
    assert client.post('/api/auth/setup', json={**BODY, 'setupKey': KEY + '-changed'}).status_code == 409

def test_setup_disabled_without_private_key(client, monkeypatch):
    empty_installation(monkeypatch)
    for value in ['', 'too-short']:
        monkeypatch.setenv('ADMIN_SETUP_KEY', value)
        assert client.get('/api/auth/setup').json() == {'available': False}
        assert client.post('/api/auth/setup', json=BODY).status_code == 403

def test_setup_key_validation_and_request_protection(client, monkeypatch):
    empty_installation(monkeypatch)
    assert client.post('/api/auth/setup', json={**BODY, 'setupKey': 'incorrect'}).status_code == 403
    assert client.post('/api/auth/setup', json={**BODY, 'password': 'short'}).status_code == 422
    assert client.post('/api/auth/setup', json={**BODY, 'email': 'invalid'}).status_code == 422
    assert client.post('/api/auth/setup', json={**BODY, 'name': '  '}).status_code == 422
    assert client.post('/api/auth/setup', json=BODY, headers={'Origin': 'https://untrusted.test'}).status_code == 403
    assert client.get('/api/auth/setup').json() == {'available': True}

def test_setup_rate_limit(client, monkeypatch):
    empty_installation(monkeypatch)
    for _ in range(5):
        assert client.post('/api/auth/setup', json={**BODY, 'setupKey': 'wrong'}).status_code == 403
    assert client.post('/api/auth/setup', json=BODY).status_code == 429

def test_existing_accounts_close_registration(client, monkeypatch):
    monkeypatch.setenv('ADMIN_SETUP_KEY', KEY)
    assert client.get('/api/auth/setup').json() == {'available': False}
    assert client.post('/api/auth/setup', json=BODY).status_code == 409

def test_simultaneous_claims_create_exactly_one_owner(client, monkeypatch):
    empty_installation(monkeypatch)
    barrier = Barrier(2)
    def claim(index):
        barrier.wait()
        return client.post('/api/auth/setup', json={**BODY, 'email': f'owner{index}@example.test'}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(claim, [1, 2])) == [201, 409]
    with SessionLocal() as db:
        assert len(list(db.scalars(select(User)))) == 1
        assert len(list(db.scalars(select(SetupCompletion)))) == 1
