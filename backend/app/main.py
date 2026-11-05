"""HTTP boundary: explicit permissions, validated content and auditable writes."""
import hashlib
import hmac
import io
import logging
import os
import re
import secrets
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request, Response, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select, delete
from sqlalchemy.orm import Session as DBSession
from .db import ROOT, Base, engine, SessionLocal, Record, User, Session, Audit, Revision
from .seed import seed
from .admin_setup import setup_complete, create_initial_admin, SetupClosed
from . import storage
from starlette.concurrency import run_in_threadpool
from starlette.responses import JSONResponse
from sqlalchemy.orm.exc import StaleDataError

log = logging.getLogger('agency')
UPLOADS = Path(os.getenv('UPLOAD_DIR', str(ROOT / 'uploads'))).resolve()
UPLOADS.mkdir(parents=True, exist_ok=True)
ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://127.0.0.1:3100,http://localhost:3100').split(',')
PRODUCTION = os.getenv('ENVIRONMENT') == 'production'
PUBLIC = {'services','projects','team','videos','testimonials','pages','navigation','sections'}
OPS = {'enquiries','clients','quotations'}
KINDS = PUBLIC | OPS | {'media'}
ROLES = {'super_admin','administrator','content_manager','sales','team_member'}
STATUSES = {'draft','published','archived'}
STAGES = {'New','Contacted','Consultation Scheduled','Quotation Sent','Negotiating','Won','Lost'}
LIMITS = defaultdict(deque)

def now():
    return datetime.now(timezone.utc).isoformat()

def fail(code, message):
    raise HTTPException(code, message)

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f'{salt}:{digest}'

def verify_password(password, encoded):
    salt, expected = encoded.split(':')
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(expected, actual)

def limit(request, bucket, maximum, seconds=60):
    # Single-process local deployment. A shared limiter is required before multiple workers.
    key = (request.client.host if request.client else 'local', bucket)
    stamp = time.monotonic()
    if len(LIMITS) > 10000:
        for old in list(LIMITS):
            if not LIMITS[old] or LIMITS[old][-1] < stamp - 3600:
                del LIMITS[old]
    entries = LIMITS[key]
    while entries and entries[0] < stamp - seconds:
        entries.popleft()
    if len(entries) >= maximum:
        fail(429, 'Too many requests. Please try again later.')
    entries.append(stamp)

def get_db():
    with SessionLocal() as db:
        yield db

def audit(db, user, action, target):
    db.add(Audit(id=str(uuid4()), actor=user.email, action=action, target=target, created=now()))

def current_user(request: Request, db: DBSession = Depends(get_db)):
    token = request.cookies.get('agency_session', '')
    entry = db.get(Session, hashlib.sha256(token.encode()).hexdigest()) if token else None
    user = db.get(User, entry.user_id) if entry and entry.expires > time.time() else None
    if not user or not user.active:
        fail(401, 'Please sign in to continue.')
    return user

def can(user, kind, write=False):
    if user.role == 'super_admin':
        return True
    if user.role == 'administrator':
        return kind in KINDS or kind in {'overview','analytics'}
    if user.role == 'content_manager':
        return kind in PUBLIC | {'media','overview'}
    if user.role == 'sales':
        return kind in OPS | {'overview'}
    return kind in {'team','overview'}

def require(user, kind, write=False):
    if not can(user, kind, write):
        fail(403, 'Your role does not permit this action.')

def visible(user, record):
    if user.role == 'sales' and record.kind in OPS:
        return record.data.get('assignedTo') == user.id
    if user.role == 'team_member' and record.kind == 'team':
        return record.data.get('userId') == user.id
    return True

def packed(record):
    return dict(id=record.id, kind=record.kind, version=record.version, updated=record.updated, **record.data)

def public_user(user):
    return dict(id=user.id, email=user.email, name=user.name, role=user.role, active=bool(user.active))

def url(value):
    return not value or (value.startswith('/') and not value.startswith('//') and '\\' not in value) or bool(re.match(r'^https?://[^\s]+$', value))

COMMON = {'title','description','status','order'}
FIELDS = {
 'services': COMMON | {'subtitle','icon','benefits','price','image'},
 'projects': COMMON | {'category','problem','functionality','technologies','developmentStatus','image','gallery','video','liveUrl','sourceUrl','client','services','featured','demo'},
 'team': COMMON | {'role','expertise','image','url','video','userId','demo'},
 'videos': COMMON | {'category','url','poster'},
 'testimonials': COMMON | {'client','role','company','approved','image'},
 'pages': COMMON | {'slug','seoTitle','seoDescription'},
 'navigation': COMMON | {'url','placement'},
 'sections': COMMON | {'subtitle','page','position','image','url'},
 'enquiries': {'title','name','email','phone','service','requirements','source','assignedTo','priority','notes','stage','followUp','created'},
 'clients': {'title','email','phone','company','notes','assignedTo'},
 'quotations': {'title','client','email','enquiryId','assignedTo','items','taxPercent','currency','validUntil','notes','stage','number','total','subtotal','tax','created'},
}

def clean(kind, data, db, current_id=''):
    if kind not in FIELDS:
        fail(400, 'Unsupported content type.')
    extra = set(data) - FIELDS[kind]
    if extra:
        fail(422, 'Unknown fields: ' + ', '.join(sorted(extra)))
    result = {}
    for key, value in data.items():
        if key not in {'items','order','taxPercent','featured','demo','approved'} and not isinstance(value,str):
            fail(422,f'{key} must be text.')
        if key == 'items':
            result[key] = value
        elif isinstance(value, (str, bool, int, float)):
            if isinstance(value, str):
                value = value.strip()
                if len(value) > (20000 if key in {'description','notes','requirements'} else 4000):
                    fail(422, f'{key} is too long.')
            result[key] = value
        else:
            fail(422, f'Invalid {key}.')
    if not isinstance(result.get('title'), str) or not result['title'] or len(result['title']) > 200:
        fail(422, 'A title of 1–200 characters is required.')
    for key in {'image','poster','url','video','liveUrl','sourceUrl'} & result.keys():
        if not isinstance(result[key], str) or not url(result[key]):
            fail(422, f'{key} must be an HTTP(S) URL or local path.')
    if result.get('gallery') and any(not url(v.strip()) for v in result['gallery'].splitlines()):
        fail(422,'Every screenshot must use an HTTP(S) URL or local path.')
    for key in ('featured','demo','approved'):
        if key in result and not isinstance(result[key], bool):
            fail(422, f'{key} must be a boolean.')
    if 'email' in result and result['email'] and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', str(result['email'])):
        fail(422, 'Enter a valid email address.')
    if 'order' in result and (not isinstance(result['order'], int) or isinstance(result['order'], bool)):
        fail(422, 'Order must be an integer.')
    if kind in PUBLIC:
        result.setdefault('status', 'draft')
        if result['status'] not in STATUSES:
            fail(422, 'Invalid publication status.')
    if kind == 'enquiries' and result.get('stage', 'New') not in STAGES:
        fail(422, 'Invalid enquiry stage.')
    if kind == 'pages':
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', result.get('slug','')):
            fail(422, 'Use a lowercase page slug with hyphens.')
        if result['slug'] in {'services','work','team','videos','contact','quote','admin','api'}:
            fail(422, 'This page slug is reserved.')
        for row in db.scalars(select(Record).where(Record.kind == 'pages')):
            if row.id != current_id and row.data.get('slug') == result['slug']:
                fail(409, 'That page slug already exists.')
    if kind == 'testimonials' and result.get('status') == 'published' and result.get('approved') is not True:
        fail(422, 'Confirm permission to publish this genuine testimonial.')
    assigned = result.get('assignedTo') or result.get('userId')
    if assigned and not db.get(User, assigned):
        fail(422, 'Assigned user does not exist.')
    if kind == 'quotations':
        items = result.get('items', [])
        if not isinstance(items, list) or not 1 <= len(items) <= 50:
            fail(422, 'Add 1–50 quotation line items.')
        subtotal = Decimal('0')
        normalized = []
        try:
            for item in items:
                if not isinstance(item, dict) or not isinstance(item.get('description'), str) or not item['description'].strip():
                    fail(422, 'Every line needs a description.')
                qty, price = Decimal(str(item.get('quantity',0))), Decimal(str(item.get('unitPrice',0)))
                if not qty.is_finite() or not price.is_finite() or not 0 < qty <= 100000 or not 0 <= price <= 100000000:
                    fail(422, 'Invalid line quantity or price.')
                amount = (qty * price).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
                subtotal += amount
                normalized.append(dict(description=item['description'][:500], quantity=str(qty), unitPrice=str(price), amount=str(amount)))
            tax_rate = Decimal(str(result.get('taxPercent',0)))
            if not tax_rate.is_finite() or not 0 <= tax_rate <= 100:
                fail(422, 'Tax must be between 0 and 100 percent.')
        except (InvalidOperation, TypeError, ValueError):
            fail(422, 'Invalid quotation numbers.')
        tax = (subtotal * tax_rate / 100).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
        result.update(items=normalized, subtotal=str(subtotal), tax=str(tax), total=str(subtotal + tax), taxPercent=str(tax_rate))
        result.setdefault('number', 'Q-' + datetime.now().strftime('%Y%m%d') + '-' + secrets.token_hex(3).upper())
        result.setdefault('currency', 'KES')
        if result.get('stage','Draft') not in {'Draft','Sent','Accepted','Declined','Expired'}:
            fail(422, 'Invalid quotation stage.')
    return result

@asynccontextmanager
async def lifespan(app):
    # Schema changes are applied explicitly by Alembic, never by server startup.
    storage.configure()
    with SessionLocal() as db:
        seed(db)
    yield

app = FastAPI(title='Agency Platform API', lifespan=lifespan, docs_url=None if PRODUCTION else '/docs')
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True, allow_methods=['GET','POST','PUT','DELETE'], allow_headers=['Content-Type','X-Requested-With'])

@app.exception_handler(StaleDataError)
async def stale_write(request,exc):
    return JSONResponse(status_code=409,content={'detail':'This record changed. Reload it before saving.'})

@app.middleware('http')
async def security(request, call_next):
    if request.method in {'POST','PUT','DELETE','PATCH'}:
        origin = request.headers.get('origin')
        if origin and origin not in ORIGINS:
            return Response('Untrusted origin', status_code=403)
        # Non-simple header blocks cross-site form submissions, including login CSRF.
        if request.url.path.startswith('/api/') and request.headers.get('x-requested-with') != 'agency-platform':
            return Response('Missing request protection', status_code=403)
        try: content_length=int(request.headers.get('content-length','0') or 0)
        except ValueError: return Response('Invalid request length',status_code=400)
        if content_length > 12 * 1024 * 1024:
            return Response('Request too large', status_code=413)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.get('/api/health')
def health(db: DBSession = Depends(get_db)):
    db.execute(select(Record.id).limit(1))
    return {'status':'ok'}

@app.get('/api/public/site')
def site(db: DBSession = Depends(get_db)):
    settings = db.get(Record, 'settings')
    safe = {k:v for k,v in settings.data.items() if k not in {'notificationsEmail'}}
    result = {'settings':safe}
    for kind in PUBLIC:
        rows = [packed(r) for r in db.scalars(select(Record).where(Record.kind == kind)) if r.data.get('status') == 'published' and (kind != 'testimonials' or r.data.get('approved') is True)]
        result[kind] = sorted(rows, key=lambda r: r.get('order',0))
    return result

class EnquiryInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=200)
    phone: str = Field(default='', max_length=40)
    service: str = Field(default='', max_length=200)
    requirements: str = Field(min_length=15, max_length=10000)
    source: str = Field(default='Website', max_length=100)
    consent: bool
    website: str = Field(default='', max_length=200)

@app.post('/api/public/enquiries', status_code=201)
def submit_enquiry(body: EnquiryInput, request: Request, db: DBSession = Depends(get_db)):
    limit(request, 'enquiry', 5, 600)
    if body.website:
        return {'message':'Thank you. Your enquiry has been received.'}
    if not body.consent or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', body.email):
        fail(422, 'A valid email and consent to respond are required.')
    data = body.model_dump(exclude={'consent','website'})
    data.update(title=f'Enquiry from {body.name}', created=now(), stage='New', priority='Normal', assignedTo='', notes='', followUp='')
    db.add(Record(id=str(uuid4()), kind='enquiries', data=data, updated=now()))
    db.commit()
    return {'message':'Thank you. Your enquiry has been received. Our team will follow up using the details you provided.'}

class Visit(BaseModel):
    path: str = Field(max_length=200, pattern=r'^/[a-zA-Z0-9/\-_]*$')

@app.post('/api/public/visit', status_code=204)
def visit(body: Visit, request: Request, db: DBSession = Depends(get_db)):
    limit(request, 'visit', 60)
    if db.get(Record,'settings').data.get('analyticsEnabled',True):
        id = 'visits-' + datetime.now(timezone.utc).strftime('%Y-%m-%d')
        record = db.get(Record,id)
        if not record:
            record = Record(id=id, kind='analytics', data={'views':0,'paths':{}}, updated=now())
            db.add(record)
        data = dict(record.data)
        paths = dict(data.get('paths',{}))
        paths[body.path] = paths.get(body.path,0)+1
        record.data = dict(views=data.get('views',0)+1, paths=paths)
        db.commit()
    return Response(status_code=204)

class Login(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)

def setup_key():
    key = os.getenv('ADMIN_SETUP_KEY', '')
    return key if len(key) >= 32 else ''

@app.get('/api/auth/setup')
def setup_status(db: DBSession = Depends(get_db)):
    return {'available': bool(setup_key()) and not setup_complete(db)}

class AdminSetup(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=12, max_length=200)
    setupKey: str = Field(min_length=1, max_length=512)

@app.post('/api/auth/setup', status_code=201)
def register_admin(body: AdminSetup, request: Request, db: DBSession = Depends(get_db)):
    limit(request, 'admin_setup', 5, 600)
    if setup_complete(db):
        fail(409, 'Administrator registration is closed. Please sign in.')
    key = setup_key()
    if not key or not hmac.compare_digest(body.setupKey.encode(), key.encode()):
        fail(403, 'Administrator setup is unavailable or the setup key is incorrect.')
    email = body.email.strip().lower()
    name = body.name.strip()
    if len(name) < 2 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        fail(422, 'Enter your name and a valid email address.')
    try:
        create_initial_admin(db, email=email, name=name, password_hash=hash_password(body.password))
    except SetupClosed as error:
        fail(409, str(error))
    return {'message': 'Administrator account created. Sign in to continue.'}

@app.post('/api/auth/login')
def login(body: Login, request: Request, response: Response, db: DBSession = Depends(get_db)):
    limit(request, 'login', 8, 600)
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    # Always perform password work to reduce account enumeration through timing.
    encoded = user.password if user else '0'*32 + ':' + '0'*128
    valid = verify_password(body.password, encoded)
    if not user or not user.active or not valid:
        fail(401, 'Email or password is incorrect.')
    token = secrets.token_urlsafe(48)
    db.execute(delete(Session).where(Session.expires < int(time.time())))
    db.add(Session(token=hashlib.sha256(token.encode()).hexdigest(), user_id=user.id, expires=int(time.time())+28800))
    audit(db,user,'sign_in','session')
    db.commit()
    response.set_cookie('agency_session',token, max_age=28800, httponly=True, secure=PRODUCTION, samesite='lax', path='/')
    return public_user(user)

@app.get('/api/auth/me')
def me(user: User = Depends(current_user)):
    return public_user(user)

@app.post('/api/auth/logout', status_code=204)
def logout(request: Request, response: Response, db: DBSession = Depends(get_db)):
    db.execute(delete(Session).where(Session.token == hashlib.sha256(request.cookies.get('agency_session','').encode()).hexdigest()))
    db.commit()
    response.delete_cookie('agency_session', path='/')
    response.status_code = 204

@app.get('/api/admin/overview')
def overview(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    records = list(db.scalars(select(Record)))
    counts = {k:sum(1 for r in records if r.kind == k and visible(user,r)) for k in KINDS if can(user,k)}
    activities = list(db.scalars(select(Audit).order_by(Audit.created.desc()).limit(8))) if user.role in {'super_admin','administrator'} else []
    views = sum(r.data.get('views',0) for r in records if r.kind == 'analytics') if can(user,'analytics') else None
    return dict(counts=counts, views=views, activity=[dict(actor=a.actor,action=a.action,target=a.target,created=a.created) for a in activities])

@app.get('/api/admin/settings')
def settings(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'settings')
    return packed(db.get(Record,'settings'))

class Change(BaseModel):
    data: dict
    version: int | None = None

@app.put('/api/admin/settings')
def update_settings(body: Change, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'settings',True)
    record = db.get(Record,'settings')
    from .seed import DEFAULT_SETTINGS
    if set(body.data) - set(DEFAULT_SETTINGS):
        fail(422,'Unknown setting.')
    data = {**record.data, **body.data}
    for key,value in data.items():
        if key == 'analyticsEnabled':
            if not isinstance(value,bool): fail(422,'Analytics setting must be a boolean.')
        elif not isinstance(value,str) or len(value)>10000:
            fail(422,f'Invalid {key}.')
    for key in ['primary','accent','background']:
        if not re.fullmatch(r'#[0-9a-fA-F]{6}',data[key]): fail(422,'Use six-digit hex colors.')
    for key in ['logo','favicon','socialLinkedin','socialInstagram','socialGithub']:
        if not url(data[key]): fail(422,'Invalid link.')
    if data['whatsapp'] and not re.fullmatch(r'\d{8,15}',data['whatsapp']): fail(422,'WhatsApp must use 8–15 international digits without +.')
    for key in ['email','notificationsEmail']:
        if data[key] and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',data[key]): fail(422,'Invalid contact email.')
    if not data['name'].strip(): fail(422,'Brand name is required.')
    if data['font'] not in {'sans','serif'} or data['layout'] not in {'comfortable','compact'}: fail(422,'Unsupported appearance setting.')
    save_revision(db,record,data,body.version,user)
    return packed(record)

def save_revision(db,record,data,version,user):
    if version is None or version != record.version:
        fail(409,'This record changed. Reload it before saving.')
    db.add(Revision(id=str(uuid4()),record_id=record.id,version=record.version,data=record.data,created=now()))
    record.data = data
    record.version += 1
    record.updated = now()
    audit(db,user,'update',record.kind + '/' + record.id)
    db.commit()

@app.get('/api/admin/records/{kind}')
def records(kind: str, q: str = '', page: int = 1, status: str = '', user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if kind not in KINDS: fail(404,'Unknown module.')
    require(user,kind)
    rows = [packed(r) for r in db.scalars(select(Record).where(Record.kind == kind).order_by(Record.updated.desc())) if visible(user,r)]
    rows = [r for r in rows if (not q or q.lower() in str(r).lower()) and (not status or r.get('status',r.get('stage','')) == status)]
    start = (max(1,page)-1)*20
    return dict(items=rows[start:start+20], total=len(rows), page=max(1,page))

@app.post('/api/admin/records/{kind}', status_code=201)
def create_record(kind: str, body: Change, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,kind,True)
    if user.role == 'team_member': fail(403,'Only your assigned team profile may be edited.')
    if kind == 'media': fail(400,'Use the upload endpoint.')
    data = clean(kind,body.data,db)
    if user.role == 'sales': data['assignedTo'] = user.id
    if kind in OPS: data.setdefault('created',now()) if kind != 'clients' else None
    record = Record(id=str(uuid4()),kind=kind,data=data,updated=now())
    db.add(record)
    audit(db,user,'create',kind + '/' + record.id)
    db.commit()
    return packed(record)

@app.put('/api/admin/records/{kind}/{id}')
def update_record(kind: str, id: str, body: Change, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,kind,True)
    record = db.get(Record,id)
    if not record or record.kind != kind: fail(404,'Record not found.')
    if not visible(user,record): fail(403,'This record is assigned to another user.')
    data = clean(kind,body.data,db,id)
    if user.role == 'sales': data['assignedTo'] = user.id
    if user.role == 'team_member':
        data['userId'] = user.id
        data['status'] = record.data.get('status','draft')
    save_revision(db,record,data,body.version,user)
    return packed(record)

@app.delete('/api/admin/records/{kind}/{id}', status_code=204)
def remove_record(kind: str, id: str, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if kind not in KINDS: fail(404,'Unknown module.')
    require(user,kind,True)
    if user.role == 'team_member': fail(403,'Team members cannot delete profiles.')
    record = db.get(Record,id)
    if not record or record.kind != kind: fail(404,'Record not found.')
    if not visible(user,record): fail(403,'This record is assigned to another user.')
    if kind == 'media':
        # Keep the operation explicit: referenced content may need updating first.
        if record.data.get('provider') == 'cloudinary':
            try: storage.delete_asset(record.data)
            except Exception:
                log.exception('Cloudinary delete failed')
                fail(502,'The media provider could not delete the asset. Please try again.')
        else:
            path = UPLOADS / record.data['filename']
            if path.parent == UPLOADS: path.unlink(missing_ok=True)
    db.execute(delete(Revision).where(Revision.record_id==id))
    db.delete(record)
    audit(db,user,'delete',kind + '/' + id)
    db.commit()
    return Response(status_code=204)

@app.get('/api/admin/history/{id}')
def history(id: str, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    record = db.get(Record,id)
    if not record: fail(404,'Record not found.')
    require(user,record.kind)
    if not visible(user,record): fail(403,'Not assigned to you.')
    return [dict(id=r.id,version=r.version,data=r.data,created=r.created) for r in db.scalars(select(Revision).where(Revision.record_id==id).order_by(Revision.version.desc()).limit(20))]

@app.get('/api/admin/audit')
def audit_list(page: int = 1, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'audit')
    return [dict(id=a.id,actor=a.actor,action=a.action,target=a.target,created=a.created) for a in db.scalars(select(Audit).order_by(Audit.created.desc()).offset((max(page,1)-1)*50).limit(50))]

@app.get('/api/admin/analytics')
def analytics(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'analytics')
    rows = list(db.scalars(select(Record)))
    visits = sorted([dict(date=r.id.removeprefix('visits-'),**r.data) for r in rows if r.kind=='analytics'],key=lambda r:r['date'])[-30:]
    enquiries = [r for r in rows if r.kind=='enquiries']
    sources = {}
    stages = {}
    for r in enquiries:
        src = r.data.get('source','Website')
        sources[src] = sources.get(src,0)+1
        stage = r.data.get('stage','New')
        stages[stage] = stages.get(stage,0)+1
    return dict(days=visits,sources=sources,stages=stages,enquiries=len(enquiries),won=stages.get('Won',0))

class UserInput(BaseModel):
    name: str = Field(min_length=2,max_length=120)
    email: str = Field(min_length=5,max_length=200)
    role: str
    active: bool = True
    password: str = Field(default='',max_length=200)

@app.get('/api/admin/users')
def users(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'users')
    return [public_user(u) for u in db.scalars(select(User))]

@app.get('/api/admin/assignees')
def assignees(user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    if user.role in {'sales','team_member'}:
        return [dict(id=user.id,name=user.name,role=user.role)]
    return [dict(id=u.id,name=u.name,role=u.role) for u in db.scalars(select(User).where(User.active==1))]

@app.get('/api/admin/integrations')
def integrations(user: User = Depends(current_user)):
    require(user,'settings')
    from .db import URL
    return dict(database='Neon / PostgreSQL' if URL.startswith('postgresql') else 'SQLite · explicit local preview',media=storage.provider(),cloudinaryConfigured=all(os.getenv(k) for k in ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']))

def change_user(body,db,user,existing=None):
    require(user,'users',True)
    if body.role not in ROLES: fail(422,'Invalid role.')
    email = body.email.strip().lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email): fail(422,'Invalid email.')
    other = db.scalar(select(User).where(User.email==email))
    if other and (not existing or other.id != existing.id): fail(409,'That email is already registered.')
    if body.password and len(body.password)<12: fail(422,'Use at least 12 characters for passwords.')
    if existing and existing.id == user.id and (not body.active or body.role != 'super_admin'): fail(422,'You cannot remove your own super-admin access.')
    if not existing and not body.password: fail(422,'A password is required.')
    target = existing or User(id=str(uuid4()),password=hash_password(body.password))
    target.name,target.email,target.role,target.active = body.name,email,body.role,int(body.active)
    if body.password: target.password = hash_password(body.password)
    db.add(target)
    if existing: db.execute(delete(Session).where(Session.user_id==target.id))
    audit(db,user,'update_user' if existing else 'create_user',target.id)
    db.commit()
    return public_user(target)

@app.post('/api/admin/users',status_code=201)
def create_user(body: UserInput, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    return change_user(body,db,user)

@app.put('/api/admin/users/{id}')
def update_user(id: str, body: UserInput, user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'users',True)
    target = db.get(User,id)
    if not target: fail(404,'User not found.')
    return change_user(body,db,user,target)

@app.post('/api/admin/media',status_code=201)
async def upload(request: Request, file: UploadFile = File(...), user: User = Depends(current_user), db: DBSession = Depends(get_db)):
    require(user,'media',True)
    limit(request,'upload',20,600)
    content = await file.read(10*1024*1024+1)
    if len(content)>10*1024*1024: fail(413,'Files must be 10 MB or smaller.')
    suffix, mime = '', ''
    if file.content_type in {'image/jpeg','image/png','image/webp'}:
        try:
            Image.MAX_IMAGE_PIXELS=20_000_000
            image=Image.open(io.BytesIO(content))
            image.load()
            output=io.BytesIO()
            image.convert('RGB').save(output,format='WEBP',quality=88)
            content=output.getvalue()
            suffix,mime='.webp','image/webp'
        except (UnidentifiedImageError,OSError,Image.DecompressionBombError):
            fail(422,'The image could not be decoded safely.')
    elif file.content_type=='application/pdf' and content.startswith(b'%PDF-'):
        suffix,mime='.pdf','application/pdf'
    elif file.content_type=='video/mp4' and len(content)>12 and content[4:8]==b'ftyp':
        suffix,mime='.mp4','video/mp4'
    else:
        fail(422,'Upload JPEG, PNG, WebP, PDF or MP4 files only. SVG and executable files are not accepted.')
    id=str(uuid4())
    filename=id+suffix
    if storage.provider()=='cloudinary':
        try: asset=await run_in_threadpool(storage.upload_asset,content,mime,id)
        except Exception:
            log.exception('Cloudinary upload failed')
            fail(502,'The media provider could not accept this file. Check Cloudinary configuration or try again.')
    else:
        (UPLOADS/filename).write_bytes(content)
        asset=dict(provider='local',filename=filename,url='/api/media/'+filename)
    record=Record(id=id,kind='media',data=dict(title=(file.filename or 'Upload')[:200],mime=mime,size=len(content),**asset),updated=now())
    db.add(record)
    audit(db,user,'upload','media/'+id)
    db.commit()
    return packed(record)

@app.get('/api/media/{filename}')
def media(filename: str):
    if not re.fullmatch(r'[a-f0-9-]{36}\.(webp|pdf|mp4)',filename): fail(404,'File not found.')
    path=UPLOADS/filename
    if not path.is_file(): fail(404,'File not found.')
    mime={'.webp':'image/webp','.pdf':'application/pdf','.mp4':'video/mp4'}[path.suffix]
    return FileResponse(path,media_type=mime,headers={'Content-Disposition':f'{"attachment" if path.suffix==".pdf" else "inline"}; filename="{filename}"'})
