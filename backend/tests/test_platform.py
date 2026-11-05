import io
import os
from unittest.mock import patch
from PIL import Image
from sqlalchemy import select
from app.db import SessionLocal,Record,Session
from app import storage

def login(client,role):
    response=client.post('/api/auth/login',json={'email':f'{role}@test.example','password':'Disposable-Test-Password!'})
    assert response.status_code==200
    return response

def create(client,kind,data):
    response=client.post('/api/admin/records/'+kind,json={'data':data})
    assert response.status_code==201,response.text
    return response.json()

def update(client,kind,row,changes):
    data={k:v for k,v in row.items() if k not in {'id','kind','version','updated'}}
    return client.put(f'/api/admin/records/{kind}/{row["id"]}',json={'data':{**data,**changes},'version':row['version']})

def test_public_site_and_drafts(admin):
    response=admin.get('/api/public/site')
    assert response.status_code==200
    data=response.json()
    assert len(data['services'])==10
    assert all(p['demo'] for p in data['projects'])
    assert 'notificationsEmail' not in data['settings']
    draft=create(admin,'pages',{'title':'Private draft','slug':'private-draft','status':'draft'})
    assert not any(p['id']==draft['id'] for p in admin.get('/api/public/site').json()['pages'])
    result=update(admin,'pages',draft,{'status':'published'})
    assert result.status_code==200
    assert any(p['id']==draft['id'] for p in admin.get('/api/public/site').json()['pages'])
    assert update(admin,'pages',draft,{'description':'Stale update'}).status_code==409
    assert admin.get('/api/admin/history/'+draft['id']).json()[0]['data']['status']=='draft'
    assert update(admin,'pages',result.json(),{'status':'archived'}).status_code==200
    assert not any(p['id']==draft['id'] for p in admin.get('/api/public/site').json()['pages'])

def test_settings_propagation_and_validation(admin):
    assert admin.delete('/api/admin/records/settings/settings').status_code==404
    original=admin.get('/api/admin/settings').json()
    result=admin.put('/api/admin/settings',json={'version':original['version'],'data':{'name':'A new identity','primary':'#123456','whatsapp':'254700000000'}})
    assert result.status_code==200,result.text
    assert admin.get('/api/public/site').json()['settings']['name']=='A new identity'
    assert admin.put('/api/admin/settings',json={'version':result.json()['version'],'data':{'primary':'red;display:none'}}).status_code==422
    assert admin.put('/api/admin/settings',json={'version':result.json()['version'],'data':{'logo':'javascript:alert(1)'}}).status_code==422

def test_enquiry_persistence_and_validation(client):
    body=dict(name='Test Person',email='person@example.test',phone='',service='Website',requirements='A business website with a service catalogue.',consent=True)
    assert client.post('/api/public/enquiries',json={**body,'consent':False}).status_code==422
    assert client.post('/api/public/enquiries',json={**body,'email':'bad'}).status_code==422
    assert client.post('/api/public/enquiries',json=body).status_code==201
    assert client.get('/api/admin/records/enquiries').status_code==401
    login(client,'super_admin')
    row=client.get('/api/admin/records/enquiries').json()['items'][0]
    assert row['requirements']==body['requirements'] and row['stage']=='New'
    assert update(client,'enquiries',row,{'stage':'Contacted','notes':'First call completed.'}).status_code==200

def test_session_security_csrf_and_logout(client):
    response=login(client,'super_admin')
    assert 'HttpOnly' in response.headers['set-cookie'] and 'SameSite=lax' in response.headers['set-cookie']
    with SessionLocal() as db:
        entry=db.scalar(select(Session))
        assert len(entry.token)==64
        assert entry.token!=client.cookies.get('agency_session')
    assert client.post('/api/auth/logout',headers={'X-Requested-With':''}).status_code==403
    assert client.post('/api/auth/logout',headers={'Origin':'https://evil.example'}).status_code==403
    assert client.post('/api/auth/logout').status_code==204
    assert client.get('/api/auth/me').status_code==401

def test_roles_and_sales_assignment(admin):
    one=create(admin,'clients',dict(title='Sales lead',assignedTo='sales',notes='Assigned'))
    two=create(admin,'clients',dict(title='Other lead',assignedTo='administrator'))
    login(admin,'sales')
    rows=admin.get('/api/admin/records/clients').json()['items']
    assert [r['id'] for r in rows]==[one['id']]
    assert update(admin,'clients',two,{'notes':'Unauthorized'}).status_code==403
    assert admin.delete('/api/admin/records/clients/'+two['id']).status_code==403
    assert admin.get('/api/admin/settings').status_code==403
    assert admin.get('/api/admin/users').status_code==403
    assert admin.post('/api/admin/records/projects',json={'data':{'title':'No'}}).status_code==403
    login(admin,'content_manager')
    assert admin.get('/api/admin/records/enquiries').status_code==403
    assert admin.get('/api/admin/records/services').status_code==200
    assert admin.get('/api/admin/audit').status_code==403

def test_team_member_only_own_profile(admin):
    own=create(admin,'team',dict(title='Assigned profile',userId='team_member',status='draft'))
    other=create(admin,'team',dict(title='Other profile',userId='administrator',status='published'))
    login(admin,'team_member')
    assert [r['id'] for r in admin.get('/api/admin/records/team').json()['items']]==[own['id']]
    response=update(admin,'team',own,{'description':'My new biography','status':'published'})
    assert response.status_code==200 and response.json()['status']=='draft'
    assert update(admin,'team',other,{'description':'No'}).status_code==403
    assert admin.delete('/api/admin/records/team/'+own['id']).status_code==403

def test_quotation_server_totals(admin):
    row=create(admin,'quotations',dict(title='Website proposal',client='Client',items=[dict(description='Design',quantity='2.5',unitPrice='1000.25')],taxPercent='16',total='1',stage='Draft'))
    assert row['subtotal']=='2500.63' and row['tax']=='400.10' and row['total']=='2900.73'
    assert row['number'].startswith('Q-')
    assert update(admin,'quotations',row,{'items':[dict(description='Bad',quantity='-1',unitPrice='4')]}).status_code==422
    assert update(admin,'quotations',row,{'taxPercent':'NaN'}).status_code==422

def test_testimonial_approval_and_page_slug(admin):
    assert admin.post('/api/admin/records/testimonials',json={'data':{'title':'Feedback','description':'Good','status':'published','approved':False}}).status_code==422
    row=create(admin,'pages',dict(title='Story',slug='our-story',status='draft'))
    assert admin.post('/api/admin/records/pages',json={'data':{'title':'Duplicate','slug':'our-story'}}).status_code==409
    assert admin.post('/api/admin/records/pages',json={'data':{'title':'Reserved','slug':'admin'}}).status_code==422
    assert admin.post('/api/admin/records/navigation',json={'data':{'title':'Unsafe','url':'javascript:alert(1)'}}).status_code==422
    assert admin.post('/api/admin/records/services',json={'data':{'title':'Bad','description':123}}).status_code==422
    assert admin.post('/api/admin/records/services',json={'data':{'title':'Bad','secret':'value'}}).status_code==422

def test_upload_local_and_cloudinary_mock(admin):
    stream=io.BytesIO();Image.new('RGB',(20,20),'green').save(stream,'PNG')
    result=admin.post('/api/admin/media',files={'file':('image.png',stream.getvalue(),'image/png')})
    assert result.status_code==201,result.text
    row=result.json()
    assert row['mime']=='image/webp' and admin.get(row['url']).status_code==200
    assert admin.post('/api/admin/media',files={'file':('evil.svg',b'<svg/>','image/svg+xml')}).status_code==422
    assert admin.post('/api/admin/media',files={'file':('fake.png',b'not an image','image/png')}).status_code==422
    with patch.dict(os.environ,{'MEDIA_STORAGE':'cloudinary'}),patch.object(storage,'upload_asset',return_value=dict(provider='cloudinary',publicId='agency-platform/test',resourceType='image',url='https://res.cloudinary.com/demo/image/upload/test.webp')) as upload:
        result=admin.post('/api/admin/media',files={'file':('image.png',stream.getvalue(),'image/png')})
        assert result.status_code==201 and result.json()['provider']=='cloudinary'
        upload.assert_called_once()
        with patch.object(storage,'delete_asset') as remove:
            assert admin.delete('/api/admin/records/media/'+result.json()['id']).status_code==204
            remove.assert_called_once()
    assert admin.delete('/api/admin/records/media/'+row['id']).status_code==204
    assert admin.get(row['url']).status_code==404

def test_cloudinary_sdk_contract():
    with patch.dict(os.environ,{'MEDIA_STORAGE':'cloudinary','CLOUDINARY_CLOUD_NAME':'demo','CLOUDINARY_API_KEY':'test','CLOUDINARY_API_SECRET':'test'}),patch('cloudinary.uploader.upload',return_value={'public_id':'agency-platform/test','resource_type':'video','secure_url':'https://res.cloudinary.com/demo/video/upload/test.mp4'}) as upload:
        row=storage.upload_asset(b'video','video/mp4','test')
        assert row['resourceType']=='video'
        assert upload.call_args.kwargs['resource_type']=='video'
        assert upload.call_args.kwargs['overwrite'] is False

def test_user_management_revokes_sessions(admin):
    response=admin.post('/api/admin/users',json=dict(name='New editor',email='new@example.test',role='content_manager',password='A-secure-password-123',active=True))
    assert response.status_code==201 and 'password' not in response.json()
    id=response.json()['id']
    assert admin.post('/api/admin/users',json=dict(name='Duplicate',email='new@example.test',role='sales',password='A-secure-password-123')).status_code==409
    assert admin.put('/api/admin/users/super_admin',json=dict(name='Owner',email='super_admin@test.example',role='sales',active=True)).status_code==422
    login(admin,'administrator')
    assert admin.get('/api/admin/users').status_code==403
    assert admin.get('/api/admin/records/enquiries').status_code==200

def test_rate_limit_and_analytics(client):
    for _ in range(8):client.post('/api/auth/login',json={'email':'missing@test.example','password':'bad'})
    assert client.post('/api/auth/login',json={'email':'missing@test.example','password':'bad'}).status_code==429
    assert client.post('/api/public/visit',json={'path':'/work'}).status_code==204
    with SessionLocal() as db:
        record=db.scalar(select(Record).where(Record.kind=='analytics'))
        assert record.data=={'views':1,'paths':{'/work':1}}

def test_search_pagination_and_audit(admin):
    for i in range(22):create(admin,'clients',{'title':f'Client {i:02d}'})
    first=admin.get('/api/admin/records/clients').json()
    second=admin.get('/api/admin/records/clients?page=2').json()
    assert len(first['items'])==20 and len(second['items'])==2 and first['total']==22
    assert admin.get('/api/admin/records/clients?q=Client%2001').json()['total']==1
    assert any(a['action']=='create' for a in admin.get('/api/admin/audit').json())
