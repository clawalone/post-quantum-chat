from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import SocketIO, emit, join_room
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"
app.config["JWT_SECRET_KEY"] = "jwt-secret-key"

CORS(app, supports_credentials=True)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# MongoDB setup
client = MongoClient("mongodb+srv://Sarvesh:Veeravarsh123@cluster0.qeiy37p.mongodb.net/?retryWrites=true&w=majority")
db = client["pq_chat"]
users_collection = db["users"]
rooms_collection = db["rooms"]
messages_collection = db["messages"]

# Health check
@app.route("/")
def home():
    return "Server running", 200

# Register user
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
        users_collection.insert_one({"username": username, "password": hashed_pw})
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        print("Register error:", e)
        return jsonify({"error": "Server error during registration"}), 500

# Login user
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        user = users_collection.find_one({"username": username})
        if not user or not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid username or password"}), 401

        token = str(create_access_token(identity=username))
        return jsonify({"username": username, "token": token}), 200
    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Server error during login"}), 500

# Get all rooms
@app.route("/rooms", methods=["GET"])
def get_rooms():
    rooms = list(rooms_collection.find({}, {"_id": 0}))
    return jsonify({"rooms": rooms}), 200

# Create a new room
@app.route("/create_room", methods=["POST"])
def create_room():
    data = request.get_json()
    room_name = data.get("room_name")
    if not room_name:
        return jsonify({"error": "Room name required"}), 400
    if rooms_collection.find_one({"name": room_name}):
        return jsonify({"error": "Room already exists"}), 400

    rooms_collection.insert_one({"name": room_name})

    # Emit the new room to all connected clients
    socketio.emit("new_room", {"name": room_name})

    return jsonify({"message": "Room created successfully"}), 201


# Get messages for a room
@app.route("/messages", methods=["GET"])
def get_messages():
    room = request.args.get("room")
    msgs = list(messages_collection.find({"room": room}, {"_id": 0}))
    return jsonify({"messages": msgs}), 200

# Socket.IO join room
@socketio.on("join")
def on_join(data):
    username = data.get("username")
    room = data.get("room")
    join_room(room)
    emit("receive_message", {"username": "System", "text": f"{username} has joined the room.", "timestamp": datetime.utcnow().isoformat()}, room=room)

# Socket.IO send message
@socketio.on("send_message")
def handle_message(data):
    username = data.get("username")
    room = data.get("room")
    text = data.get("text")
    timestamp = datetime.utcnow().isoformat()

    # Save to MongoDB
    messages_collection.insert_one({"username": username, "room": room, "text": text, "timestamp": timestamp})

    # Emit to all in room
    emit("receive_message", {"username": username, "text": text, "timestamp": timestamp}, room=room)

if __name__ == "__main__":
    print("Starting Flask-SocketIO server on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
