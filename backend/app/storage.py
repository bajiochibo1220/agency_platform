"""Cloudinary is the deployed media provider; local storage is explicit preview only."""
import io
import os
import cloudinary
import cloudinary.api
import cloudinary.uploader

def provider():
    name=os.getenv('MEDIA_STORAGE','cloudinary')
    if name not in {'cloudinary','local'}:
        raise RuntimeError('MEDIA_STORAGE must be cloudinary or local.')
    if name=='local' and os.getenv('ENVIRONMENT')=='production':
        raise RuntimeError('Production requires Cloudinary media storage.')
    return name

def configure():
    if provider()=='local': return
    values={key:os.getenv(env,'').strip() for key,env in [
        ('cloud_name','CLOUDINARY_CLOUD_NAME'),('api_key','CLOUDINARY_API_KEY'),('api_secret','CLOUDINARY_API_SECRET')]}
    if not all(values.values()):
        raise RuntimeError('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in agency-platform/.env.')
    cloudinary.config(**values,secure=True)

def upload_asset(content,mime,id):
    configure()
    resource='video' if mime=='video/mp4' else 'raw' if mime=='application/pdf' else 'image'
    public_id='agency-platform/'+id+('.pdf' if resource=='raw' else '')
    result=cloudinary.uploader.upload(io.BytesIO(content),resource_type=resource,public_id=public_id,overwrite=False,timeout=45)
    return dict(provider='cloudinary',publicId=result['public_id'],resourceType=result['resource_type'],url=result['secure_url'])

def delete_asset(data):
    configure()
    result=cloudinary.uploader.destroy(data['publicId'],resource_type=data['resourceType'],invalidate=True,timeout=30)
    if result.get('result') not in {'ok','not found'}:
        raise RuntimeError('Cloudinary could not remove this asset.')

def check():
    configure()
    return cloudinary.api.ping()
