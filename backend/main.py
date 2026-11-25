"""Swasthrahi demo API. SQLite persistence; replace demo auth/integrations before production."""
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Any
import sqlite3, json, uuid, hashlib, hmac, secrets, os, base64
from datetime import datetime, timezone, date
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get('SWASTHRAHI_DATA_DIR', str(Path(__file__).resolve().parent)))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.environ.get('SWASTHRAHI_DB_PATH', str(DATA_DIR / 'swasthrahi.db')))
UPLOAD_DIR = Path(os.environ.get('SWASTHRAHI_UPLOAD_DIR', str(DATA_DIR / 'uploads')))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app = FastAPI(title='Swasthrahi API', version='3.0.0', description='Personal health vault, medicine reminders and emergency QR health cards')
TOKEN_SECRET = os.environ.get('SWASTHRAHI_SECRET', os.environ.get('GRAMRAHI_SECRET', 'CHANGE_THIS_DEMO_SECRET_BEFORE_DEPLOYMENT')).encode()
TOKEN_TTL = 60 * 60 * 24 * 7
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=False, allow_methods=['*'], allow_headers=['*'])

def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

@app.on_event('startup')
def startup():
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS patients (patient_id TEXT PRIMARY KEY, phone TEXT, payload TEXT NOT NULL, updated_at TEXT NOT NULL, user_id TEXT);
        CREATE TABLE IF NOT EXISTS donors (id TEXT PRIMARY KEY, name TEXT NOT NULL, blood_group TEXT NOT NULL, area TEXT, phone TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS emergencies (request_id TEXT PRIMARY KEY, hospital TEXT, shared INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS access_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT, hospital TEXT, accessed_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, department TEXT NOT NULL, preferred_date TEXT NOT NULL, notes TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS medical_documents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, document_type TEXT NOT NULL, file_name TEXT, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS medicine_reminders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, medicine TEXT NOT NULL, dosage TEXT NOT NULL, schedule TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT, notes TEXT, taken_dates TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS emergency_qr_cards (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT UNIQUE NOT NULL, payload TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
        ''')
        # Safe additive migration for databases created by earlier app versions.
        cols = [r['name'] for r in c.execute('PRAGMA table_info(patients)').fetchall()]
        if 'user_id' not in cols: c.execute('ALTER TABLE patients ADD COLUMN user_id TEXT')
        doc_cols = [r['name'] for r in c.execute('PRAGMA table_info(medical_documents)').fetchall()]
        if 'storage_path' not in doc_cols: c.execute('ALTER TABLE medical_documents ADD COLUMN storage_path TEXT')


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 310000)
    return base64.urlsafe_b64encode(salt).decode() + '$' + base64.urlsafe_b64encode(digest).decode()

def check_password(password: str, stored: str) -> bool:
    try:
        salt_s, digest_s = stored.split('$', 1)
        salt = base64.urlsafe_b64decode(salt_s.encode())
        expected = base64.urlsafe_b64decode(digest_s.encode())
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 310000)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

def issue_token(user_id: str) -> str:
    expires = int(datetime.now(timezone.utc).timestamp()) + TOKEN_TTL
    body = f'{user_id}.{expires}'
    sig = hmac.new(TOKEN_SECRET, body.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f'{body}.{sig}'.encode()).decode()

def current_user(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Sign in required')
    try:
        raw = base64.urlsafe_b64decode(authorization[7:].encode()).decode()
        user_id, expires, signature = raw.rsplit('.', 2)
        body = f'{user_id}.{expires}'
        expected = hmac.new(TOKEN_SECRET, body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected) or int(expires) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError('expired')
    except Exception:
        raise HTTPException(401, 'Invalid or expired session. Please sign in again.')
    with db() as c:
        row = c.execute('SELECT id,email,created_at FROM users WHERE id=?', (user_id,)).fetchone()
    if not row: raise HTTPException(401, 'Account not found')
    return dict(row)

class AuthInput(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)

class AppointmentInput(BaseModel):
    department: str = Field(min_length=2, max_length=100)
    preferredDate: str = Field(min_length=8, max_length=40)
    notes: Optional[str] = Field(default='', max_length=1000)

class DocumentInput(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    documentType: str = Field(min_length=2, max_length=60)
    fileName: Optional[str] = Field(default=None, max_length=255)

class MedicineInput(BaseModel):
    medicine: str = Field(min_length=1, max_length=120)
    dosage: str = Field(min_length=1, max_length=80)
    schedule: str = Field(min_length=1, max_length=160)
    startDate: str = Field(min_length=8, max_length=20)
    endDate: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = Field(default='', max_length=500)

class MedicineTakenInput(BaseModel):
    taken: bool = True

class QRCardInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    bloodGroup: Optional[str] = Field(default='', max_length=10)
    allergies: Optional[str] = Field(default='', max_length=500)
    conditions: Optional[str] = Field(default='', max_length=500)
    emergencyContact: Optional[str] = Field(default='', max_length=30)
    medications: Optional[str] = Field(default='', max_length=500)
    patientId: Optional[str] = Field(default='', max_length=40)
    age: Optional[str] = Field(default='', max_length=20)
    sharePatientId: bool = True
    gender: Optional[str] = Field(default='', max_length=30)
    phone: Optional[str] = Field(default='', max_length=30)
    pastIssues: Optional[str] = Field(default='', max_length=500)
    treatment: Optional[str] = Field(default='', max_length=500)
    ayushman: Optional[str] = Field(default='', max_length=100)
    shareAge: bool = True
    sharePhone: bool = False
    sharePastIssues: bool = True
    shareAyushman: bool = False
    shareBloodGroup: bool = True
    shareAllergies: bool = True
    shareConditions: bool = True
    shareEmergencyContact: bool = True
    shareMedications: bool = False

class Patient(BaseModel):
    patientId: str = Field(min_length=4, max_length=40)
    phone: Optional[str] = None
    email: Optional[str] = None
    name: str = Field(min_length=1, max_length=100)
    age: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    pastIssues: Optional[str] = None
    treatment: Optional[str] = None
    ayushman: Optional[str] = None
    emergencyContact: Optional[str] = None
    consent: bool = False

class Donor(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    group: str
    area: str = Field(default='', max_length=100)
    phone: str = Field(pattern=r'^\d{10}$')
    consent: bool = True

class Emergency(BaseModel):
    requestId: Optional[str] = None
    sentAt: Optional[str] = None
    hospital: str = 'Nearest listed hospital'
    healthDataShared: bool = False
    patient: dict[str, Any] = Field(default_factory=dict)
    location: Optional[dict[str, float]] = None
    incident: Optional[str] = None


@app.post('/api/auth/register')
def register_account(data: AuthInput):
    email = data.email.strip().lower()
    if '@' not in email or '.' not in email.rsplit('@', 1)[-1]: raise HTTPException(400, 'Enter a valid email address')
    uid = str(uuid.uuid4()); now = datetime.now(timezone.utc).isoformat()
    try:
        with db() as c: c.execute('INSERT INTO users(id,email,password_hash,created_at) VALUES (?,?,?,?)', (uid,email,hash_password(data.password),now))
    except sqlite3.IntegrityError:
        raise HTTPException(409, 'An account with this email already exists. Please sign in.')
    return {'registered':True,'accessToken':issue_token(uid),'tokenType':'bearer','expiresIn':TOKEN_TTL,'user':{'id':uid,'email':email,'createdAt':now},'emailVerification':'NOT_CONFIGURED'}

@app.post('/api/auth/login')
def login_account(data: AuthInput):
    email=data.email.strip().lower()
    with db() as c: row=c.execute('SELECT id,email,password_hash,created_at FROM users WHERE email=?',(email,)).fetchone()
    if not row or not check_password(data.password,row['password_hash']): raise HTTPException(401,'Incorrect email or password')
    return {'accessToken':issue_token(row['id']),'tokenType':'bearer','expiresIn':TOKEN_TTL,'user':{'id':row['id'],'email':row['email'],'createdAt':row['created_at']}}

@app.get('/api/auth/me')
def account_me(user=Depends(current_user)):
    return {'user':user}

@app.get('/api/dashboard/summary')
def dashboard_summary(user=Depends(current_user)):
    with db() as c:
        appointments=c.execute('SELECT COUNT(*) n FROM appointments WHERE user_id=?',(user['id'],)).fetchone()['n']
        documents=c.execute('SELECT COUNT(*) n FROM medical_documents WHERE user_id=?',(user['id'],)).fetchone()['n']
        patients=c.execute('SELECT COUNT(*) n FROM patients WHERE user_id=?',(user['id'],)).fetchone()['n']
    return {'appointments':appointments,'medicalDocuments':documents,'patientProfiles':patients}

@app.post('/api/appointments')
def create_appointment(data: AppointmentInput, user=Depends(current_user)):
    aid=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    with db() as c: c.execute('INSERT INTO appointments VALUES (?,?,?,?,?,?,?)',(aid,user['id'],data.department,data.preferredDate,data.notes,'REQUESTED',now))
    return {'created':True,'appointmentId':aid,'status':'REQUESTED','notice':'Request recorded only; no clinic has been contacted.'}

@app.get('/api/appointments')
def get_appointments(user=Depends(current_user)):
    with db() as c: rows=c.execute('SELECT id,department,preferred_date,notes,status,created_at FROM appointments WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'appointments':[dict(r) for r in rows]}

@app.post('/api/medical-documents')
def add_medical_document(data: DocumentInput, user=Depends(current_user)):
    did=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    with db() as c: c.execute('INSERT INTO medical_documents(id,user_id,title,document_type,file_name,created_at,storage_path) VALUES (?,?,?,?,?,?,NULL)',(did,user['id'],data.title,data.documentType,data.fileName,now))
    return {'saved':True,'documentId':did,'notice':'Metadata only. The actual medical file has not been uploaded.'}

@app.get('/api/medical-documents')
def list_medical_documents(user=Depends(current_user)):
    with db() as c: rows=c.execute('SELECT id,title,document_type,file_name,created_at FROM medical_documents WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'documents':[dict(r) for r in rows]}

@app.post('/api/health-vault/upload')
async def upload_health_document(title: str = Form(...), document_type: str = Form(...), file: UploadFile = File(...), user=Depends(current_user)):
    allowed = {'.pdf', '.png', '.jpg', '.jpeg', '.webp'}
    original = Path(file.filename or 'document').name
    ext = Path(original).suffix.lower()
    if ext not in allowed: raise HTTPException(400, 'Only PDF, PNG, JPG and WEBP files are allowed')
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024: raise HTTPException(413, 'File must be 10 MB or smaller')
    doc_id = str(uuid.uuid4())
    folder = UPLOAD_DIR / user['id']; folder.mkdir(parents=True, exist_ok=True)
    stored = folder / (doc_id + ext); stored.write_bytes(content)
    now = datetime.now(timezone.utc).isoformat()
    with db() as c:
        c.execute('INSERT INTO medical_documents(id,user_id,title,document_type,file_name,created_at,storage_path) VALUES (?,?,?,?,?,?,?)', (doc_id,user['id'],title.strip(),document_type.strip(),original,now,str(stored)))
    return {'saved':True,'documentId':doc_id,'title':title,'documentType':document_type,'fileName':original,'createdAt':now}

@app.get('/api/health-vault/documents')
def health_vault_documents(user=Depends(current_user)):
    with db() as c:
        cols=[r['name'] for r in c.execute('PRAGMA table_info(medical_documents)').fetchall()]
        rows=c.execute('SELECT id,title,document_type,file_name,created_at FROM medical_documents WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'documents':[dict(r) for r in rows]}

@app.get('/api/health-vault/documents/{document_id}/download')
def download_health_document(document_id: str, user=Depends(current_user)):
    with db() as c:
        cols=[r['name'] for r in c.execute('PRAGMA table_info(medical_documents)').fetchall()]
        if 'storage_path' not in cols: raise HTTPException(404,'File not found')
        row=c.execute('SELECT storage_path,file_name FROM medical_documents WHERE id=? AND user_id=?',(document_id,user['id'])).fetchone()
    if not row or not row['storage_path'] or not Path(row['storage_path']).is_file(): raise HTTPException(404,'File not found')
    return FileResponse(row['storage_path'], filename=row['file_name'])

@app.delete('/api/health-vault/documents/{document_id}')
def delete_health_document(document_id: str, user=Depends(current_user)):
    with db() as c:
        cols=[r['name'] for r in c.execute('PRAGMA table_info(medical_documents)').fetchall()]
        row=c.execute('SELECT storage_path FROM medical_documents WHERE id=? AND user_id=?',(document_id,user['id'])).fetchone()
        if not row: raise HTTPException(404,'Document not found')
        if 'storage_path' in cols and row['storage_path'] and Path(row['storage_path']).is_file(): Path(row['storage_path']).unlink()
        c.execute('DELETE FROM medical_documents WHERE id=? AND user_id=?',(document_id,user['id']))
    return {'deleted':True}

@app.post('/api/medicines')
def add_medicine(data: MedicineInput, user=Depends(current_user)):
    mid=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    with db() as c: c.execute('INSERT INTO medicine_reminders(id,user_id,medicine,dosage,schedule,start_date,end_date,notes,taken_dates,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',(mid,user['id'],data.medicine,data.dosage,data.schedule,data.startDate,data.endDate,data.notes or '', '[]',now))
    return {'saved':True,'id':mid}

@app.get('/api/medicines')
def get_medicines(user=Depends(current_user)):
    with db() as c: rows=c.execute('SELECT id,medicine,dosage,schedule,start_date,end_date,notes,taken_dates,created_at FROM medicine_reminders WHERE user_id=? ORDER BY created_at DESC',(user['id'],)).fetchall()
    return {'medicines':[dict(r) | {'takenDates':json.loads(r['taken_dates'])} for r in rows]}

@app.post('/api/medicines/{medicine_id}/taken')
def mark_medicine_taken(medicine_id: str, data: MedicineTakenInput, user=Depends(current_user)):
    today=date.today().isoformat()
    with db() as c:
        row=c.execute('SELECT taken_dates FROM medicine_reminders WHERE id=? AND user_id=?',(medicine_id,user['id'])).fetchone()
        if not row: raise HTTPException(404,'Medicine reminder not found')
        dates=json.loads(row['taken_dates'])
        if data.taken and today not in dates: dates.append(today)
        if not data.taken: dates=[d for d in dates if d != today]
        c.execute('UPDATE medicine_reminders SET taken_dates=? WHERE id=? AND user_id=?',(json.dumps(dates),medicine_id,user['id']))
    return {'updated':True,'takenToday':data.taken}

@app.delete('/api/medicines/{medicine_id}')
def delete_medicine(medicine_id: str, user=Depends(current_user)):
    with db() as c: cur=c.execute('DELETE FROM medicine_reminders WHERE id=? AND user_id=?',(medicine_id,user['id']))
    if not cur.rowcount: raise HTTPException(404,'Medicine reminder not found')
    return {'deleted':True}

@app.post('/api/emergency-qr')
def create_emergency_qr(data: QRCardInput, user=Depends(current_user)):
    token=secrets.token_urlsafe(32); card_id=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    payload={'patientId':data.patientId if data.sharePatientId else '', 'name':data.name,'age':data.age if data.shareAge else '', 'gender':data.gender if data.shareAge else '', 'phone':data.phone if data.sharePhone else '', 'pastIssues':data.pastIssues if data.sharePastIssues else '', 'treatment':data.treatment if data.sharePastIssues else '', 'ayushman':data.ayushman if data.shareAyushman else '', 'bloodGroup':data.bloodGroup if data.shareBloodGroup else '', 'allergies':data.allergies if data.shareAllergies else '', 'conditions':data.conditions if data.shareConditions else '', 'emergencyContact':data.emergencyContact if data.shareEmergencyContact else '', 'medications':data.medications if data.shareMedications else ''}
    with db() as c:
        c.execute('UPDATE emergency_qr_cards SET active=0 WHERE user_id=?',(user['id'],))
        c.execute('INSERT INTO emergency_qr_cards(id,user_id,token,payload,active,created_at) VALUES (?,?,?,?,1,?)',(card_id,user['id'],token,json.dumps(payload),now))
    return {'created':True,'cardId':card_id,'token':token,'url':'/emergency-card/'+token,'createdAt':now,'sharedFields':[k for k,v in payload.items() if v]}

@app.get('/api/emergency-qr/{token}')
def read_emergency_qr(token: str):
    with db() as c: row=c.execute('SELECT payload,active FROM emergency_qr_cards WHERE token=?',(token,)).fetchone()
    if not row or not row['active']: raise HTTPException(404,'This emergency card is unavailable or has been revoked')
    return {'card':json.loads(row['payload']),'notice':'Information shared by the card owner. Confirm details with the person or their caregiver.'}

@app.post('/api/emergency-qr/revoke')
def revoke_emergency_qr(user=Depends(current_user)):
    with db() as c: c.execute('UPDATE emergency_qr_cards SET active=0 WHERE user_id=?',(user['id'],))
    return {'revoked':True}

@app.get('/', include_in_schema=False)
def root():
    return FileResponse(PROJECT_ROOT / 'index.html')

@app.get('/api/health')
def health(): return {'status':'ok','database':'sqlite','service':'Swasthrahi','message':'API is running'}

@app.post('/api/patients')
def save_patient(p: Patient):
    now = datetime.now(timezone.utc).isoformat()
    payload = p.model_dump()
    with db() as c:
        user_row = c.execute('SELECT id FROM users WHERE email=?', (p.email.strip().lower(),)).fetchone() if p.email else None
        owner_id = user_row['id'] if user_row else None
        c.execute('INSERT INTO patients(patient_id,phone,payload,updated_at,user_id) VALUES (?,?,?,?,?) ON CONFLICT(patient_id) DO UPDATE SET phone=excluded.phone,payload=excluded.payload,updated_at=excluded.updated_at,user_id=COALESCE(excluded.user_id,patients.user_id)',
                  (p.patientId, p.phone, json.dumps(payload), now, owner_id))
    return {'saved':True,'patientId':p.patientId,'updatedAt':now}

@app.get('/api/patients/{patient_id}')
def get_patient(patient_id: str):
    with db() as c: row = c.execute('SELECT payload,updated_at FROM patients WHERE patient_id=?',(patient_id,)).fetchone()
    if not row: raise HTTPException(404,'Patient record not found')
    return {'patient':json.loads(row['payload']),'updatedAt':row['updated_at']}

@app.post('/api/donors')
def add_donor(d: Donor):
    if not d.consent: raise HTTPException(400,'Explicit consent is required to list donor contact details')
    donor_id = str(uuid.uuid4())
    with db() as c: c.execute('INSERT INTO donors VALUES (?,?,?,?,?,?)',(donor_id,d.name,d.group,d.area,d.phone,datetime.now(timezone.utc).isoformat()))
    return {'saved':True,'donorId':donor_id}

@app.get('/api/donors')
def list_donors(group: Optional[str] = None, area: Optional[str] = None):
    sql='SELECT id,name,blood_group,area,phone,created_at FROM donors WHERE 1=1'; args=[]
    if group: sql+=' AND blood_group=?'; args.append(group)
    if area: sql+=' AND area LIKE ?'; args.append(f'%{area}%')
    with db() as c: rows=c.execute(sql+' ORDER BY created_at DESC LIMIT 100',args).fetchall()
    return {'donors':[dict(r) for r in rows]}

@app.post('/api/emergency')
def create_emergency(e: Emergency):
    rid=e.requestId or ('GRM-'+uuid.uuid4().hex[:10].upper())
    payload=e.model_dump(); payload['requestId']=rid
    # Only retain health details when the user explicitly opted in.
    if not e.healthDataShared: payload['patient']={}
    now=datetime.now(timezone.utc).isoformat()
    with db() as c: c.execute('INSERT INTO emergencies VALUES (?,?,?,?,?)',(rid,e.hospital,int(e.healthDataShared),json.dumps(payload),now))
    return {'accepted':True,'requestId':rid,'recordedAt':now,'delivery':'RECORDED_IN_DEMO_DATABASE','hospitalAcknowledged':False,
            'notice':'This API records the request; it does not dispatch an ambulance or contact a hospital.'}

@app.get('/api/emergencies')
def list_emergencies():
    with db() as c: rows=c.execute('SELECT request_id,hospital,shared,created_at FROM emergencies ORDER BY created_at DESC LIMIT 50').fetchall()
    return {'requests':[dict(r) for r in rows]}

@app.get('/api/hospital/patients/{patient_id}')
def hospital_patient(patient_id: str, hospital: str = 'Demo hospital'):
    with db() as c:
        row=c.execute('SELECT payload FROM patients WHERE patient_id=?',(patient_id,)).fetchone()
        if row: c.execute('INSERT INTO access_logs(patient_id,hospital,accessed_at) VALUES (?,?,?)',(patient_id,hospital,datetime.now(timezone.utc).isoformat()))
    if not row: raise HTTPException(404,'Patient record not found')
    data=json.loads(row['payload'])
    # Hospital access endpoint is a demo; production needs staff authentication, consent enforcement and audit controls.
    return {'patient':data,'accessedBy':hospital,'demo':True}


# Serve the frontend and its assets from this same FastAPI service.
app.mount('/', StaticFiles(directory=PROJECT_ROOT, html=True), name='frontend')
