// src/pages/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './styles/chat.css';

const socket = io('http://localhost:5000');

function Chat({ username }) {
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        axios.get('http://localhost:5000/rooms')
            .then(res => setRooms(res.data.rooms))
            .catch(err => console.error('❌ Failed to load rooms:', err));
    }, []);

    useEffect(() => {
        if (room) {
            socket.emit('join_room', room);
            axios.get(`http://localhost:5000/messages?room=${room}`)
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
        setMessage('');  // ✅ Clear input only
    };

    const createRoom = async (e) => {
        e.preventDefault();
        const roomName = prompt("Enter new room name:");
        if (roomName) {
            try {
                await axios.post('http://localhost:5000/create_room', { room_name: roomName });
                setRooms(prev => [...prev, { name: roomName }]);
            } catch (err) {
                console.error("❌ Room creation failed:", err);
            }
        }
    };

    const formatTime = iso => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Welcome, {username}</h2>
                <button onClick={logout}>Logout</button>
            </div>

            <div className="chat-controls">
                <select value={room} onChange={e => setRoom(e.target.value)}>
                    <option value="" disabled>Select Room</option>
                    {rooms.map((r, i) => (
                        <option key={i} value={r.name}>{r.name}</option>
                    ))}
                </select>
                <button onClick={createRoom}>+ Room</button>
            </div>

            <div className="chat-box">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`chat-message ${msg.user === username ? 'self' : 'other'}`}
                    >
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
    );
}

export default Chat;
