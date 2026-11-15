import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Message.css";

function Message() {
    const { id } = useParams();

    const [message, setMessage] = React.useState("");
    const [messages, setMessages] = React.useState([]);

    const token = localStorage.getItem("token");
    const currentUserId = token
        ? JSON.parse(atob(token.split(".")[1])).userid
        : "";

    useEffect(function() {
        function getMessages(){
        fetch("http://localhost:5000/message/" + id, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);
            setMessages(data);
        }),[]}


        getMessages();

        const interval=setInterval(function(){
            getMessages();
        },2000);

        return function(){
            clearInterval(interval)
        };
    },[id]);
    

    function sendMessage() {
        if (message.trim() === "") {
            return;
        }

        fetch("http://localhost:5000/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                message: message,
                rece: id
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);

            setMessages(function(previous) {
                return [...previous, data];
            });

            setMessage("");
        });
    }

    return (
        <div className="message-page">
            <div className="message-glow message-glow-one"></div>
            <div className="message-glow message-glow-two"></div>

            <div className="message-window">
                <header className="message-header">
                    <div className="message-contact-avatar">
                        {String(id || "?").charAt(0).toUpperCase()}
                    </div>

                    <div className="message-contact-info">
                        <h2>Chat</h2>
                        <p>Conversation</p>
                    </div>

                    <div className="message-header-icons">
                        <span>●</span>
                        <span>⋮</span>
                    </div>
                </header>

                <div className="message-list">
                    {messages.map(function(item) {
                        const isMine =
                            String(item.server) === String(currentUserId);

                        return (
                            <div
                                className={
                                    isMine
                                        ? "message-row message-row-sent"
                                        : "message-row message-row-received"
                                }
                                key={item._id}
                            >
                                <div
                                    className={
                                        isMine
                                            ? "message-bubble message-bubble-sent"
                                            : "message-bubble message-bubble-received"
                                    }
                                >
                                    <p>{item.message}</p>
                                    <span className="message-time">
                                        {isMine ? "You" : "Contact"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {messages.length === 0 && (
                        <div className="message-empty">
                            <div>✦</div>
                            <h3>Start a conversation</h3>
                            <p>Send your first message below.</p>
                        </div>
                    )}
                </div>

                <div className="message-input-bar">
                    <input
                        placeholder="Type a message..."
                        value={message}
                        onChange={function(e) {
                            setMessage(e.target.value);
                        }}
                        onKeyDown={function(e) {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                    />

                    <button
                        className="message-send-button"
                        onClick={sendMessage}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Message;