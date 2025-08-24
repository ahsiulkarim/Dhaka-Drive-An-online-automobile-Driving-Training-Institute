from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os

from sqlalchemy import or_

app = Flask(__name__, static_folder='Project Dhaka driving institue', static_url_path='')
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dhakadrive.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)

# Ensure the upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- Database Models ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    mobile = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(200), nullable=False) # Increased length for hash
    address = db.Column(db.String(200), nullable=True)
    nid_passport = db.Column(db.String(50), nullable=True)
    document_path = db.Column(db.String(200), nullable=True)
    role = db.Column(db.String(10), nullable=False, default='user') # 'user' or 'admin'
    is_active = db.Column(db.Boolean, default=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_path = db.Column(db.String(200), nullable=False)

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Requested') # Requested, Awaiting Payment, Approved, Rejected
    preferred_slot = db.Column(db.String(100), nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    transaction_id = db.Column(db.String(100), nullable=True)
    final_location = db.Column(db.String(200), nullable=True)
    user = db.relationship('User', backref=db.backref('enrollments', lazy=True))
    course = db.relationship('Course', backref=db.backref('enrollments', lazy=True))

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    sender = db.relationship('User', foreign_keys=[sender_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])

class LoginHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    user = db.relationship('User', backref=db.backref('login_history', lazy=True))


# --- Helper Functions ---

def create_initial_data():
    """Creates the admin user and course data if they don't exist."""
    with app.app_context():
        db.create_all()
        # Create Admin User
        if not User.query.filter_by(email='admin@dhakadrive.com').first():
            hashed_password = generate_password_hash('admin', method='pbkdf2:sha256')
            admin = User(
                full_name='Admin',
                email='admin@dhakadrive.com',
                mobile='01234567890',
                password=hashed_password,
                role='admin'
            )
            db.session.add(admin)

        # Create Courses
        if Course.query.count() == 0:
            courses = [
                Course(name='Car Driving', description='Learn to drive a car with our expert instructors.', price=5000, image_path='Picture/CAR.png'),
                Course(name='Motorcycle Riding', description='Master the art of riding a motorcycle safely.', price=3000, image_path='Picture/BIKE.png'),
                Course(name='Scooter Riding', description='Easy and fun scooter riding lessons for everyone.', price=2500, image_path='Picture/Scooter.png'),
                Course(name='Bicycle Riding', description='Learn to ride a bicycle in a few easy steps.', price=1000, image_path='Picture/Bicyle.png')
            ]
            db.session.bulk_save_objects(courses)
        
        db.session.commit()

# --- API Routes ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    full_name = data.get('fullName')
    email = data.get('email')
    mobile = data.get('mobile')
    password = data.get('password')

    if not all([full_name, email, mobile, password]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email address already registered'}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(
        full_name=full_name,
        email=email,
        mobile=mobile,
        password=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    # Record login history
    login_record = LoginHistory(user_id=user.id)
    db.session.add(login_record)
    db.session.commit()
    
    # In a real session-based auth, you'd create a session here.
    # For now, we'll return user info to be stored in frontend's localStorage.
    return jsonify({
        'success': True, 
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'fullName': user.full_name,
            'email': user.email,
            'role': user.role
        }
    }), 200


@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    courses_data = [{
        'id': course.id,
        'name': course.name,
        'description': course.description,
        'price': course.price,
        'image_path': course.image_path
    } for course in courses]
    return jsonify({'success': True, 'courses': courses_data})

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Course not found'}), 404
    
    course_data = {
        'id': course.id,
        'name': course.name,
        'description': course.description,
        'price': course.price,
        'image_path': course.image_path
    }
    return jsonify({'success': True, 'course': course_data})

@app.route('/api/enrollments', methods=['POST'])
def create_enrollment():
    data = request.get_json()
    user_id = data.get('userId')
    course_id = data.get('courseId')

    if not user_id or not course_id:
        return jsonify({'success': False, 'message': 'User ID and Course ID are required'}), 400

    # Check if user and course exist
    user = User.query.get(user_id)
    course = Course.query.get(course_id)
    if not user or not course:
        return jsonify({'success': False, 'message': 'Invalid User or Course'}), 404

    # Check if already enrolled
    existing_enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing_enrollment:
        return jsonify({'success': False, 'message': 'You are already enrolled in this course'}), 409

    new_enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.session.add(new_enrollment)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Enrollment request sent successfully'}), 201

@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    # This should be a protected route in a real app
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    enrollments_data = []
    for en in enrollments:
        enrollments_data.append({
            'id': en.id,
            'courseName': en.course.name,
            'status': en.status,
            'assignedLocation': en.final_location,
            'userPreferredLocation': '', # This was part of the old structure
            'scheduledSlot': en.preferred_slot
        })

    return jsonify({'success': True, 'enrollments': enrollments_data})

# --- Admin API Routes ---
from functools import wraps

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In a real app, you'd get the user_id from a secure session
        # For now, we'll expect it in the request headers or args for simplicity
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'success': False, 'message': 'User ID is required for admin access'}), 401
        
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/admin/enrollments', methods=['GET'])
@admin_required
def get_all_enrollments():
    enrollments = Enrollment.query.order_by(Enrollment.id.desc()).all()
    enrollments_data = []
    for en in enrollments:
        enrollments_data.append({
            'id': en.id,
            'userName': en.user.full_name,
            'userEmail': en.user.email,
            'courseName': en.course.name,
            'status': en.status,
            'paymentMethod': en.payment_method,
            'transactionId': en.transaction_id
        })
    return jsonify({'success': True, 'enrollments': enrollments_data})

@app.route('/api/admin/enrollments/<int:enrollment_id>/status', methods=['PUT'])
@admin_required
def update_enrollment_status(enrollment_id):
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({'success': False, 'message': 'New status is required'}), 400

    enrollment = Enrollment.query.get(enrollment_id)
    if not enrollment:
        return jsonify({'success': False, 'message': 'Enrollment not found'}), 404

    enrollment.status = new_status
    # Potentially add logic here to handle side-effects, like sending notifications
    db.session.commit()

    return jsonify({'success': True, 'message': f'Enrollment status updated to {new_status}'})


@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    users = User.query.filter(User.role != 'admin').order_by(User.id.desc()).all()
    users_data = [{
        'id': user.id,
        'name': user.full_name,
        'email': user.email,
        'mobile': user.mobile,
        'address': user.address,
        'status': 'Active' if user.is_active else 'Inactive',
        'documentInfo': user.nid_passport # Simplified for now
    } for user in users]
    return jsonify({'success': True, 'users': users_data})

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json()
    user.full_name = data.get('name', user.full_name)
    user.mobile = data.get('mobile', user.mobile)
    user.address = data.get('address', user.address)
    db.session.commit()
    return jsonify({'success': True, 'message': 'User details updated successfully'})

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json()
    is_active = data.get('isActive')

    if isinstance(is_active, bool):
        user.is_active = is_active
        db.session.commit()
        message = 'User activated' if is_active else 'User deactivated'
        return jsonify({'success': True, 'message': message})
    else:
        return jsonify({'success': False, 'message': 'Invalid status provided'}), 400


@app.route('/api/admin/conversations', methods=['GET'])
@admin_required
def get_all_conversations():
    # This query finds the latest message for each user who has ever sent a message.
    # A more optimized approach might be needed for very large datasets.
    users_with_messages = db.session.query(User).join(Message, or_(User.id == Message.sender_id, User.id == Message.receiver_id)).filter(User.role != 'admin').distinct().all()
    
    conversations_data = []
    for user in users_with_messages:
        last_message = Message.query.filter(
            or_(Message.sender_id == user.id, Message.receiver_id == user.id)
        ).order_by(Message.timestamp.desc()).first()
        
        conversations_data.append({
            'userId': user.id,
            'userName': user.full_name,
            'lastMessage': last_message.content if last_message else 'No messages yet',
            'timestamp': last_message.timestamp.isoformat() if last_message else ''
        })
    
    # Sort by most recent message
    conversations_data.sort(key=lambda x: x['timestamp'], reverse=True)

    return jsonify({'success': True, 'conversations': conversations_data})


@app.route('/api/messages/<int:user_id>', methods=['GET'])
def get_message_history(user_id):
    # This should be protected so only the user or an admin can see it
    messages = Message.query.filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.timestamp.asc()).all()

    messages_data = [{
        'id': msg.id,
        'senderId': msg.sender_id,
        'receiverId': msg.receiver_id,
        'content': msg.content,
        'timestamp': msg.timestamp.isoformat()
    } for msg in messages]

    return jsonify({'success': True, 'messages': messages_data})


@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    sender_id = data.get('senderId')
    receiver_id = data.get('receiverId') # Can be the admin or a user
    content = data.get('content')

    if not all([sender_id, receiver_id, content]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    # In a real app, you'd find the admin ID more robustly
    if receiver_id == 'admin':
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            return jsonify({'success': False, 'message': 'Admin account not found'}), 500
        receiver_id = admin.id

    new_message = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
    db.session.add(new_message)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Message sent successfully'}), 201


@app.route('/api/admin/login-history', methods=['GET'])
@admin_required
def get_login_history():
    history = LoginHistory.query.join(User).order_by(LoginHistory.timestamp.desc()).all()
    history_data = [{
        'userName': record.user.full_name,
        'userEmail': record.user.email,
        'loginTime': record.timestamp.isoformat()
    } for record in history]
    return jsonify({'success': True, 'history': history_data})


@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/course-car.html')
def serve_course_car():
    return send_from_directory(app.static_folder, 'course-car.html')

@app.route('/course-bike.html')
def serve_course_bike():
    return send_from_directory(app.static_folder, 'course-bike.html')

@app.route('/course-scooter.html')
def serve_course_scooter():
    return send_from_directory(app.static_folder, 'course-scooter.html')

@app.route('/course-bicycle.html')
def serve_course_bicycle():
    return send_from_directory(app.static_folder, 'course-bicycle.html')

@app.route('/<path:path>')
def serve_static_files(path):
    # This is a simple catch-all to serve static files or the index.html for SPA routing
    if os.path.exists(os.path.join(app.static_folder, path)) and os.path.isfile(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # If the path doesn't match a file, it might be a frontend route
    return send_from_directory(app.static_folder, 'index.html')


# A simple route to check if the server is running
@app.route('/api/status')
def status():
    return jsonify({"status": "Server is running"})

if __name__ == '__main__':
    create_initial_data()
    app.run(debug=True, port=5001)


