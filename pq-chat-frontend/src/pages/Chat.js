import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './styles/chat.css';

const socket = io('http://localhost:5000', { transports: ['websocket'] });

function Chat() {
    const [username] = useState(localStorage.getItem('username') || '');
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    // Fetch rooms
    useEffect(() => {
        axios.get('http://localhost:5000/rooms')
            .then(res => setRooms(res.data.rooms || []))
            .catch(err => console.error(err));
    }, []);

    // Join room & fetch messages
    useEffect(() => {
        if (!room) return;
        socket.emit('join', { username, room });

        axios.get(`http://localhost:5000/messages?room=${room}`)
            .then(res => setMessages(res.data.messages || []))
            .catch(err => console.error(err));
    }, [room, username]);

    // Listen for messages
    useEffect(() => {
        socket.on('message', data => setMessages(prev => [...prev, data]));
        return () => socket.off('message');
    }, []);

    // Listen for room creation & deletion
    useEffect(() => {
        socket.on('room_created', data => setRooms(prev => [...prev, data]));
        socket.on('room_deleted', data => setRooms(prev => prev.filter(r => r.name !== data.room_name)));
        return () => {
            socket.off('room_created');
            socket.off('room_deleted');
        }
    }, []);

    // Auto scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = e => {
        e.preventDefault();
        if (!message.trim() || !room) return;

        const msgData = { username, room, text: message, timestamp: new Date().toISOString() };
        socket.emit('send_message', msgData);
        setMessage('');
    };

    const createRoom = async () => {
        const roomName = prompt('Enter new room name:');
        if (!roomName) return;

        try {
            await axios.post('http://localhost:5000/create_room', { room_name: roomName });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRoom = async (roomName) => {
        if (!window.confirm(`Delete room "${roomName}"?`)) return;
        try {
            await axios.post('http://localhost:5000/delete_room', { room_name: roomName });
            if (room === roomName) setRoom('');
        } catch (err) {
            console.error(err);
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const formatTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="chat-wrapper">
            <div className="sidebar">
                <div className="sidebar-header"><h3>Rooms</h3></div>
                <div className="sidebar-content">
                    {rooms.map((r, i) => (
                        <div key={i} className={`room-item ${r.name === room ? 'active' : ''}`}>
                            <span onClick={() => setRoom(r.name)}>{r.name}</span>
                            <span className="delete-room" onClick={() => deleteRoom(r.name)}>🗑️</span>
                        </div>
                    ))}
                </div>
                <div className="sidebar-footer">
                    <button onClick={createRoom}>+ Add Room</button>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </div>

            <div className="chat-main">
                <div className="chat-header-desktop">
                    <h2>{room || 'Select a room'}</h2>
                    <span>Logged in as <strong>{username}</strong></span>
                </div>

                <div className="chat-box">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-message ${msg.username === username ? 'self' : 'other'}`}>
                            <div className="msg-text"><strong>{msg.username}</strong>: {msg.text}</div>
                            <div className="timestamp">{formatTime(msg.timestamp)}</div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form className="chat-form" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        required
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
}

export default Chat;
