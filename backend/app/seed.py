"""Illustrative content, never presented as delivered client work."""
from uuid import uuid4
from datetime import datetime, timezone
from .db import Record

DEFAULT_SETTINGS = {
    'name': 'Nexa Studio', 'slogan': 'Ideas into impact.',
    'headline': 'Your vision.\nOur technology.\nReal possibilities.',
    'description': 'Thoughtful websites, powerful applications and practical digital tools. Built around your business, right here in Nairobi.',
    'eyebrow': 'A digital partner for your next chapter',
    'about': 'We bring design and engineering together to help ambitious businesses make their next move. From your first website to the software behind your operations, we start by understanding the people who will use it.',
    'email': '', 'phone': '', 'whatsapp': '', 'location': 'Nairobi, Kenya',
    'hours': 'Monday – Friday, 9:00 – 17:00 EAT', 'logo': '', 'favicon': '',
    'primary': '#102d52', 'accent': '#b7ed70', 'background': '#f5f7f9',
    'font': 'sans', 'layout': 'comfortable',
    'seoTitle': 'Digital solutions for ambitious businesses',
    'seoDescription': 'Explore our digital services, sample concepts and approach. Tell us what you want to build.',
    'socialLinkedin': '', 'socialInstagram': '', 'socialGithub': '',
    'footer': 'Good people. Thoughtful technology. New possibilities.',
    'notice': 'Sample brand and illustrative portfolio. Replace demo content and add your contact details in the dashboard before launch.',
    'consultation': 'Tell us about your next big idea.',
    'consultationBody': 'A new venture, a tricky process, or something you wish worked better. We would love to hear about it.',
    'notificationsEmail': '', 'analyticsEnabled': True,
}
SERVICES = [
 ('Website development', 'A great first impression. A better next step.', 'Fast, accessible business websites that make your offer clear and help customers get in touch.', 'Globe', 'Business websites,Corporate websites,Portfolios,Institutional websites'),
 ('Web applications', 'Your business, working smarter.', 'Purpose-built portals, online stores and booking tools that make everyday work feel effortless.', 'PanelsTopLeft', 'E-commerce,Booking systems,Client portals,Dashboards'),
 ('Software development', 'Less busywork. More possibility.', 'Practical inventory, sales and management software built around how your team actually works.', 'Code2', 'Inventory systems,Sales tools,Workflow software,Accounting integrations'),
 ('Mobile applications', 'Meet your customers where they are.', 'Useful Android and mobile-first experiences, with clear journeys and reliable performance.', 'Smartphone', 'Android apps,Mobile-first products,Product prototypes'),
 ('Artificial intelligence', 'Make room for the work that matters.', 'Focused assistants and automations that solve specific business problems with human oversight.', 'Sparkles', 'AI assistants,Chatbots,Process automation'),
 ('Data analytics', 'Turn information into your next move.', 'Clear reporting and dashboards that help you understand performance and act with confidence.', 'ChartNoAxesCombined', 'Business dashboards,Reporting,Power BI'),
 ('Database solutions', 'A dependable foundation for your data.', 'Database design, integration and optimization for organized, reliable business information.', 'Database', 'Data modelling,Database integration,Performance optimization'),
 ('API development', 'Connect the tools you depend on.', 'Well-documented APIs and integrations that let your systems work together.', 'Network', 'REST APIs,Third-party integrations,Payment provider integrations'),
 ('Search engine optimization', 'Help the right people find you.', 'Technical and on-page improvements that give useful content a stronger foundation for discovery.', 'Search', 'Technical SEO,On-page optimization,Search visibility'),
 ('Maintenance & support', 'Keep moving with confidence.', 'Ongoing updates, monitoring and improvements that keep your digital tools useful.', 'ShieldCheck', 'Updates,Monitoring,Bug fixes,Ongoing improvements'),
]

def seed(db):
    if db.get(Record, 'settings'):
        return
    now = datetime.now(timezone.utc).isoformat()
    def add(kind, data, id=None):
        db.add(Record(id=id or str(uuid4()), kind=kind, data=data, updated=now))
    add('settings', DEFAULT_SETTINGS, 'settings')
    for i, (name, subtitle, description, icon, benefits) in enumerate(SERVICES):
        add('services', dict(title=name, subtitle=subtitle, description=description, icon=icon, benefits=benefits, price='', status='published', order=i))
    for i, (name, category, desc, tech, color) in enumerate([
        ('A better way to shop local', 'Commerce', 'An illustrative storefront concept for a neighbourhood retailer. Product discovery, a clear shopping journey and space for a growing catalogue.', 'Next.js,Python,PostgreSQL', 'mint'),
        ('Every booking, in one place', 'Web applications', 'An illustrative booking dashboard for a service business. A practical view of appointments, customers and daily operations.', 'React,FastAPI,SQLAlchemy', 'blue'),
        ('Your numbers. A clearer picture.', 'Data & analytics', 'An illustrative reporting concept that brings business metrics into a single, easy-to-read workspace.', 'Python,Power BI,SQL', 'peach'),
    ]):
        add('projects', dict(title=name, category=category, description=desc, problem='Demonstrate a possible digital solution; this is not a commissioned or delivered client project.', functionality='Responsive interface,Clear navigation,Accessible layouts', technologies=tech, developmentStatus='Concept', image=f'/work-{color}.svg', gallery='', video='', liveUrl='', sourceUrl='', client='Illustrative concept', services='', featured=True, demo=True, status='published', order=i))
    for i, (name, role, bio) in enumerate([
        ('Your design lead', 'Design & experience', 'Introduce the person who turns business goals into clear, thoughtful digital experiences.'),
        ('Your engineering lead', 'Software engineering', 'Introduce the person who builds dependable software and connects the moving parts.'),
        ('Your client partner', 'Strategy & delivery', 'Introduce the person who keeps communication clear and delivery focused.'),
    ]):
        add('team', dict(title=name, role=role, description=bio, expertise='Design,Technology,Collaboration', image='', url='', video='', userId='', demo=True, status='published', order=i))
    for i, (title, slug, body) in enumerate([
        ('About us', 'about', DEFAULT_SETTINGS['about']),
        ('Industry solutions', 'solutions', 'Retail: clear storefronts and inventory tools.\n\nProfessional services: booking and client portals.\n\nInstitutions: accessible information and practical management systems.\n\nEvery engagement begins with understanding your workflow and agreeing a realistic scope.'),
        ('Privacy policy', 'privacy', 'Launch checklist: replace this draft with your approved privacy policy before public use.\n\nThis platform stores the contact details and requirements you submit so the team can respond to your enquiry. Administrative sessions use an essential cookie. Optional analytics record aggregate page counts without storing visitor IP addresses.\n\nOnly authorized staff can access enquiries and client records. Contact the business using its published email to request access, correction or deletion. Configure an appropriate retention period and document any hosting or storage providers before launch.'),
        ('Terms of service', 'terms', 'Launch checklist: replace this draft with your approved terms before public use.\n\nInformation on this website introduces available services. Scope, fees, timelines, ownership and support must be agreed in a separate written quotation or contract. Illustrative projects are demonstrations and are not claims of delivered client work.'),
    ]):
        add('pages', dict(title=title, slug=slug, description=body, seoTitle=title, seoDescription='', status='published', order=i))
    for i, (title, url) in enumerate([('Services','/services'),('Work','/work'),('About','/about'),('Team','/team'),('Videos','/videos')]):
        add('navigation', dict(title=title, url=url, placement='header', status='published', order=i))
    for i, (title, subtitle, desc) in enumerate([
        ('Discover', '01', 'We listen, ask useful questions and understand what success means for your business.'),
        ('Design & build', '02', 'You see the work as it takes shape, with clear milestones and room for feedback.'),
        ('Launch & grow', '03', 'We test, hand over and help you take the next step with confidence.'),
    ]):
        add('sections', dict(title=title, subtitle=subtitle, description=desc, page='home', position='process', status='published', order=i))
    db.commit()
