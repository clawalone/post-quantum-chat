// src/pages/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './styles/chat.css';

const socket = io('http://192.168.1.22:5000');

function Chat({ username }) {
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        axios.get('http://192.168.1.22:5000/rooms')
            .then(res => setRooms(res.data.rooms))
            .catch(err => console.error('❌ Failed to load rooms:', err));
    }, []);

    useEffect(() => {
        if (room) {
            socket.emit('join_room', room);
            axios.get(`http://192.168.1.22:5000/messages?room=${room}`)
                .then(res => setMessages(res.data.messages))
                .catch(err => console.error('❌ Failed to load messages:', err));
        }
    }, [room]);

    useEffect(() => {
        socket.on('receive_message', data => {
            setMessages(prev => [...prev, data]);
        });
        return () => socket.off('receive_message');
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message || !room || !username) return;

        const msgData = {
            user: username,
            room,
            message,
            timestamp: new Date().toISOString()
        };

        socket.emit('send_message', msgData);
        setMessage('');
    };

    const createRoom = async () => {
        const roomName = prompt("Enter new room name:");
        if (roomName) {
            try {
                await axios.post('http://192.168.1.22:5000/create_room', { room_name: roomName });
                setRooms(prev => [...prev, { name: roomName }]);
            } catch (err) {
                console.error("❌ Room creation failed:", err);
            }
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const formatTime = iso => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-wrapper">
            {/* Sidebar - always visible */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h3>Rooms</h3>
                </div>
                <div className="sidebar-content">
                    {rooms.map((r, i) => (
                        <div
                            key={i}
                            className={`room-item ${r.name === room ? 'active' : ''}`}
                            onClick={() => setRoom(r.name)}
                        >
                            {r.name}
                        </div>
                    ))}
                </div>
                <div className="sidebar-footer">
                    <button onClick={createRoom}>+ Add Room</button>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                <div className="chat-header-desktop">
                    <h2>{room || "Select a room"}</h2>
                    <span>Logged in as <strong>{username}</strong></span>
                </div>

                <div className="chat-box">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-message ${msg.user === username ? 'self' : 'other'}`}>
                            <div className="msg-text"><strong>{msg.user}</strong>: {msg.message}</div>
                            <div className="timestamp">{formatTime(msg.timestamp)}</div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form className="chat-form" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
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
