import React from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [register, setRegister] = React.useState([]);
    const [name, setName] = React.useState("");
    const [image, setImage] = React.useState(null);
    const [phone, setPhone] = React.useState("");

    return (
        <div className="register-page">
            <div className="logo">
                Pulse<span>Chat</span>
            </div>

            <div className="register-card">
                <div className="register-logo">
                    Pulse<span>Register</span>
                </div>

                <h1 className="register-heading">
                    Connect with everyone
                </h1>

                <p className="register-description">
                    Enter your details to get started.
                </p>

                <input
                    className="register-input"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={function(e) {
                        setName(e.target.value);
                    }}
                />

                <label className="register-image-box">
                    {image ? (
                        <div className="register-image-preview">
                            <img
                                src={URL.createObjectURL(image)}
                                alt="Profile preview"
                            />
                            <span>{image.name}</span>
                        </div>
                    ) : (
                        <div className="register-image-placeholder">
                            <span className="register-image-icon">＋</span>
                            <span>Choose profile image</span>
                            <small>Click here to select a photo</small>
                        </div>
                    )}

                    <input
                        className="register-file-input"
                        type="file"
                        accept="image/*"
                        onChange={function(e) {
                            setImage(e.target.files[0] || null);
                        }}
                    />
                </label>

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
                        if (!name.trim()) {
                            return alert("Please enter your name");
                        }

                        if (!phone || phone.replace(/\D/g, "").length < 10) {
                            return alert("Please enter a valid phone number");
                        }
var formData = new FormData();
formData.append("name", name);
formData.append("phone", phone);
if (image) {
    formData.append("image", image);
}

fetch("http://localhost:5000/register", {
    method: "POST",
    body: formData
})
.then(function(response) {
    return response.json();
})
.then(function(data) {
    console.log(data);
    setRegister(data);
    navigate("/login");
});
                        
                    }}
                >
                    Continue <span>→</span>
                </button>

                <p
                    className="register-footer"
                    onClick={function() {
                        navigate("/login");
                    }}
                >
                    Already have an account? <span>Login</span>
                </p>
            </div>
        </div>
    );
}

export default Register;