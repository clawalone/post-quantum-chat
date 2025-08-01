from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import SocketIO, emit, join_room
from datetime import datetime

app = Flask(__name__)

# ✅ Proper CORS config
CORS(app, supports_credentials=True)

# ✅ JWT Config
app.config['JWT_SECRET_KEY'] = 'your-secret-key'
jwt = JWTManager(app)

# ✅ Define SocketIO with async_mode
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")  # Or "gevent"

# ✅ MongoDB connection
mongo_uri = "mongodb+srv://Sarvesh:Veeravarsh123@cluster0.qeiy37p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(mongo_uri)
db = client['pq_chat']
users_collection = db['users']
rooms_collection = db['rooms']
messages_collection = db['messages']

# ✅ Registration
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        if users_collection.find_one({"username": username}):
            return jsonify({"error": "User already exists"}), 400

        hashed_pw = generate_password_hash(password)
        users_collection.insert_one({
            "username": username,
            "password": hashed_pw
        })

        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        print(f"❌ Exception in /api/register: {e}")
        return jsonify({"error": "Server error during registration"}), 500

# ✅ Login
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        print(f"🔐 Login attempt for {username}")

        user = users_collection.find_one({"username": username})
        if not user or not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid username or password"}), 401

        token = create_access_token(identity=username)
        return jsonify({"token": token}), 200

    except Exception as e:
        print(f"❌ Exception in /api/login: {e}")
        return jsonify({"error": "Internal server error"}), 500

# ✅ Get All Rooms
@app.route("/rooms", methods=["GET"])
def get_rooms():
    rooms = list(rooms_collection.find({}, {"_id": 0}))
    return jsonify({"rooms": rooms}), 200

# ✅ Create Room
@app.route("/create_room", methods=["POST"])
def create_room():
    data = request.get_json()
    room_name = data.get("room_name")

    if not room_name:
        return jsonify({"error": "Room name required"}), 400

    if rooms_collection.find_one({"name": room_name}):
        return jsonify({"error": "Room already exists"}), 400

    rooms_collection.insert_one({"name": room_name})
    return jsonify({"message": "Room created successfully"}), 201

# ✅ Get Messages
@app.route("/messages", methods=["GET"])
def get_messages():
    room = request.args.get("room")
    msgs = list(messages_collection.find({"room": room}, {"_id": 0}))
    return jsonify({"messages": msgs}), 200

# ✅ Join Room (Socket.IO)
@socketio.on("join_room")
def handle_join(data):
    room = data
    join_room(room)
    print(f"👥 User joined room: {room}")

# ✅ Send Message (Socket.IO)
@socketio.on("send_message")
def handle_send(data):
    try:
        user = data["user"]
        room = data["room"]
        message = data["message"]
        timestamp = data.get("timestamp") or datetime.utcnow().isoformat()

        print(f"📩 Received message from {user} in room {room}: {message}")

        messages_collection.insert_one({
            "user": user,
            "room": room,
            "message": message,
            "timestamp": timestamp
        })

        emit("receive_message", {
            "user": user,
            "room": room,
            "message": message,
            "timestamp": timestamp
        }, to=room)

    except KeyError as e:
        print(f"❌ KeyError: {e}")
        emit("error", {"error": f"Missing key: {str(e)}"})
    except Exception as e:
        print(f"❌ General Exception in send_message: {e}")
        emit("error", {"error": "Unexpected error occurred"})

# ✅ Health check
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Server running"}), 200

# ✅ Start the server
if __name__ == "__main__":
    print("✅ Starting Flask-SocketIO on http://localhost:5000")
    socketio.run(app, debug=True, port=5000)
