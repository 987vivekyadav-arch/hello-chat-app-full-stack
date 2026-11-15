import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

    const navigate = useNavigate();

    const [show, setShow] = React.useState(false);
    const [phone, setPhone] = React.useState("");
    const [home, setHome] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [adding, setAdding] = React.useState(false);

    function getContacts() {

        fetch("http://localhost:5000/home", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "authorization": "Bearer " + localStorage.getItem("token")
            }
        })

        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load contacts");
            }

            return response.json();
        })

        .then(function (data) {
            setHome(data);
            setLoading(false);
        })

        .catch(function (error) {
            console.log(error);
            setLoading(false);
        });
    }


    useEffect(function () {
        getContacts();
    }, []);


    const filteredHome = home.filter(function (item) {

        return (
            (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (item.phoneNo || "").includes(search)
        );

    });


    function addContact() {

        if (!phone.trim()) {
            alert("Please enter a phone number.");
            return;
        }

        setAdding(true);

        fetch("http://localhost:5000/add", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "authorization": "Bearer " + localStorage.getItem("token")
            },

            body: JSON.stringify({
                phone: phone.trim()
            })

        })

        .then(function (response) {

            return response.json().then(function (data) {

                if (!response.ok) {
                    throw new Error(data.message || "Could not add contact");
                }

                return data;
            });

        })

        .then(function (data) {

            console.log("CONTACT ADDED:", data);

            setPhone("");
            setShow(false);

            getContacts();

        })

        .catch(function (error) {

            console.log(error);
            alert(error.message || "Could not add contact");

        })

        .finally(function () {
            setAdding(false);
        });
    }


    function logout() {

        localStorage.removeItem("token");
        localStorage.removeItem("currentUserId");

        navigate("/login");
    }


    function getImage(item) {

        if (!item.image) {
            return "";
        }

        if (item.image.startsWith("http")) {
            return item.image;
        }

        return "http://localhost:5000/" + item.image.replace(/^\/+/, "");
    }


    return (

        <div className="home-page">

            <main className="home-main">


                {/* HEADER */}

                <header className="home-header">

                    <div className="home-brand">

                        <div className="brand-icon">
                            P
                            <span></span>
                        </div>

                        <div className="brand-name">
                            Pulse<span>Chat</span>
                        </div>

                    </div>


                    <div className="home-search">

                        <span className="home-search-icon">
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search people by name or phone..."
                            value={search}
                            onChange={function (e) {
                                setSearch(e.target.value);
                            }}
                        />

                        {search && (

                            <button
                                className="search-clear"
                                onClick={function () {
                                    setSearch("");
                                }}
                            >
                                ×
                            </button>

                        )}

                    </div>


                    <div className="home-header-right">

                        <div className="home-user-label">
                            <span>YOUR SPACE</span>
                            <strong>YOUR PEOPLE</strong>
                        </div>

                        <button
                            className="home-logout"
                            onClick={logout}
                        >
                            <span>↪</span>
                            Logout
                        </button>

                    </div>

                </header>



                {/* CONTACT SECTION */}

                <section className="contacts-section">

                    <div className="section-heading">

                        <div>

                          
                            

                            <p>
                                {home.length} people in your circle
                            </p>

                        </div>


                        <button
                            className="add-contact-button"
                            onClick={function () {
                                setShow(true);
                            }}
                        >
                            <span>＋</span>
                            Add contact
                        </button>

                    </div>



                    {/* LOADING */}

                    {loading && (

                        <div className="home-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your contacts...</p>
                        </div>

                    )}



                    {/* EMPTY */}

                    {!loading && filteredHome.length === 0 && (

                        <div className="empty-contacts">

                            <div className="empty-icon">
                                {search ? "⌕" : "✦"}
                            </div>

                            <h3>
                                {search
                                    ? "No contacts found"
                                    : "Your circle starts here"}
                            </h3>

                            <p>
                                {search
                                    ? "Try another name or phone number."
                                    : "Add people to your circle and start conversations."}
                            </p>

                            {!search && (

                                <button
                                    className="empty-add-button"
                                    onClick={function () {
                                        setShow(true);
                                    }}
                                >
                                    ＋ Add your first contact
                                </button>

                            )}

                        </div>

                    )}



                    {/* CONTACT GRID */}

                    {!loading && filteredHome.length > 0 && (

                        <div className="contact-grid">

                            {filteredHome.map(function (item) {

                                const imageUrl = getImage(item);

                                return (

                                    <div
                                        className="contact-card"
                                        key={item._id}
                                        onClick={function () {
                                            navigate("/message/" + item.phone);
                                        }}
                                    >

                                        <div className="contact-card-top">

                                            <div className="contact-avatar">

                                                {imageUrl ? (

                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name || "Contact"}
                                                    />

                                                ) : (

                                                    <span>
                                                        {(item.name || "?").charAt(0).toUpperCase()}
                                                    </span>

                                                )}

                                                <i></i>

                                            </div>

                                            <span className="contact-menu">
                                                •••
                                            </span>

                                        </div>


                                        <div className="contact-info">

                                            <h3>
                                                {item.name || "Unknown"}
                                            </h3>

                                            <p>
                                                {item.phoneNo || "No phone number"}
                                            </p>

                                        </div>


                                        <div className="contact-card-bottom">

                                            <div className="contact-card-status">
                                                <span className="contact-status-dot"></span>
                                                Contact
                                            </div>

                                            <span className="contact-arrow">
                                                ↗
                                            </span>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </section>



                {/* ADD CONTACT MODAL */}

                {show && (

                    <div
                        className="add-modal-backdrop"
                        onClick={function () {
                            setShow(false);
                        }}
                    >

                        <div
                            className="add-modal"
                            onClick={function (e) {
                                e.stopPropagation();
                            }}
                        >

                            <button
                                className="modal-close"
                                onClick={function () {
                                    setShow(false);
                                }}
                            >
                                ×
                            </button>


                            <div className="modal-icon">
                                ＋
                            </div>

                            <div className="modal-eyebrow">
                                GROW YOUR NETWORK
                            </div>

                            <h2>
                                Add a contact
                            </h2>

                            <p className="modal-description">
                                Connect with someone on PulseChat.
                            </p>


                            <label htmlFor="contact-phone">
                                Phone number
                            </label>


                            <div className="modal-phone-input">

                                <span>+91</span>

                                <input
                                    id="contact-phone"
                                    type="tel"
                                    placeholder="Enter registered phone number"
                                    value={phone}
                                    onChange={function (e) {
                                        setPhone(e.target.value);
                                    }}
                                />

                            </div>


                            <button
                                className="modal-submit"
                                onClick={addContact}
                                disabled={adding}
                            >
                                {adding ? "Adding..." : "Add to contacts"}
                                <span>→</span>
                            </button>


                            <div className="modal-note">
                                Make sure this person is registered on PulseChat.
                            </div>

                        </div>

                    </div>

                )}

            </main>

        </div>

    );

}

export default Home;