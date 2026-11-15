import React from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./Register.css";

function Login() {
    const navigate = useNavigate();

    const [login, setLogin] = React.useState(null);
    const [phone, setPhone] = React.useState("");

    return (
        <div className="register-page">
            <div className="logo">
                Pulse<span>Chat</span>
            </div>

            <div className="register-card">
                <div className="register-logo">
                    Pulse<span>Login</span>
                </div>

                <h1 className="register-heading">
                    Welcome back
                </h1>

                <p className="register-description">
                    Enter your phone number to get started.
                </p>

                <div className="register-phone">
                    <PhoneInput
                        defaultCountry="IN"
                        value={phone}
                        onChange={function(value) {
                            setPhone(value || "");
                        }}
                        placeholder="Enter phone number"
                    />
                </div>

                <button
                    className="register-button"
                    onClick={function() {
                        if (!phone || phone.length < 10) {
                            return alert("Please enter a valid phone number");
                        }

                        fetch("http://localhost:5000/login", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                phone: phone
                            })
                        })
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(data) {
                            console.log(data);

                            if (data.message) {
                                return alert(data.message);
                            }

                            if (!data.token) {
                                return alert("Login failed. Please try again.");
                            }

                            setLogin(data);
                            localStorage.setItem("token", data.token);
                            navigate("/home");
                        })
                        .catch(function(error) {
                            console.log(error);
                            alert("Login failed. Check the server.");
                        });
                    }}
                >
                    Continue <span>→</span>
                </button>

                <p
                    className="register-footer"
                    onClick={function() {
                        navigate("/");
                    }}
                >
                    Don't have an account? <span>Register</span>
                </p>
            </div>
        </div>
    );
}

export default Login;