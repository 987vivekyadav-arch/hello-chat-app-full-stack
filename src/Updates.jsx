import React, { useEffect } from "react"
import "./Updates.css"

function Updates() {

    const [up, setUp] = React.useState([])
    const [updates, setUpdates] = React.useState([])
    const [status, setStatus] = React.useState(null)
    const [loading, setLoading] = React.useState(true)

    useEffect(function() {
        fetch("http://localhost:5000/updates", {
            method: "GET",
            headers: {
                "authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Failed to load updates")
            }
            return response.json()
        })
        .then(function(data) {
            setUp(data)
        })
        .catch(function(error) {
            console.log(error)
        })
        .finally(function() {
            setLoading(false)
        })
    }, [])

    function getMediaUrl(path) {
        if (!path) {
            return ""
        }

        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path
        }

        return "http://localhost:5000/" + path
    }

    function isVideo(path) {
        return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path || "")
    }

    function addStatus() {

        if (!status) {
            alert("Please select a photo or video")
            return
        }

        var formdata = new FormData()
        formdata.append("status", status)

        fetch("http://localhost:5000/updates", {
            method: "POST",
            headers: {
                "authorization": "Bearer " + localStorage.getItem("token")
            },
            body: formdata
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Status upload failed")
            }
            return response.json()
        })
        .then(function(data) {
            // Reload statuses so the new status also gets its name and image.
            return fetch("http://localhost:5000/updates", {
                method: "GET",
                headers: {
                    "authorization": "Bearer " + localStorage.getItem("token")
                }
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("Could not refresh updates")
                }
                return response.json()
            })
            .then(function(allUpdates) {
                setUp(allUpdates)
                setUpdates([])
                setStatus(null)

                var fileInput = document.querySelector(".updates-file-input")
                if (fileInput) {
                    fileInput.value = ""
                }
            })
        })
        .catch(function(error) {
            console.log(error)
            alert("Status upload or refresh failed")
        })
    }

    const allUpdates = up.concat(updates)

    return (
        <div className="updates-page">

            <div className="updates-header">
                <div className="updates-header-icon">◉</div>

                <div>
                    <h1>Updates</h1>
                    <p>Share moments with your contacts</p>
                </div>
            </div>

            <div className="updates-upload-card">

                <div className="updates-upload-heading">
                    <div className="updates-plus-icon">＋</div>

                    <div>
                        <h2>Add your status</h2>
                        <p>Choose a photo or video to share</p>
                    </div>
                </div>

                <input
                    className="updates-file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={function(e) {
                        setStatus(e.target.files[0] || null)
                    }}
                />

                {status && (
                    <p className="updates-file-name">
                        Selected: {status.name}
                    </p>
                )}

                <button
                    className="updates-add-button"
                    onClick={addStatus}
                >
                    ＋ Add Status
                </button>

            </div>

            <div className="updates-list-section">

                <div className="updates-list-heading">
                    <div>
                        <h2>Recent updates</h2>
                        <p>Your status and your contacts' statuses</p>
                    </div>

                    <span className="updates-total">
                        {allUpdates.length}
                    </span>
                </div>

                {loading ? (

                    <div className="updates-empty">
                        <p>Loading updates...</p>
                    </div>

                ) : allUpdates.length === 0 ? (

                    <div className="updates-empty">
                        <div className="updates-empty-icon">◉</div>
                        <h3>No updates yet</h3>
                        <p>Be the first to share a moment.</p>
                    </div>

                ) : (

                    <div className="updates-grid">

                        {allUpdates.map(function(item) {

                            return (
                                <div
                                    className="updates-card"
                                    key={item._id}
                                >

                                    <div className="updates-card-media">

                                        {item.status && isVideo(item.status) ? (

                                            <video
                                                className="updates-media"
                                                src={getMediaUrl(item.status)}
                                                controls
                                                playsInline
                                            />

                                        ) : item.status ? (

                                            <img
                                                className="updates-media"
                                                src={getMediaUrl(item.status)}
                                                alt={(item.name || "User") + " status"}
                                            />

                                        ) : (

                                            <div className="updates-media-placeholder">
                                                No media available
                                            </div>

                                        )}

                                    </div>

                                    <div className="updates-card-footer">

                                        <img
                                            className="updates-profile-image"
                                            src={
                                                item.image
                                                    ? getMediaUrl(item.image)
                                                    : "https://placehold.co/100x100/201943/c4b5fd?text=User"
                                            }
                                            alt={item.name || "User"}
                                            onError={function(e) {
                                                e.currentTarget.onerror = null
                                                e.currentTarget.src =
                                                    "https://placehold.co/100x100/201943/c4b5fd?text=User"
                                            }}
                                        />

                                        <div className="updates-profile-info">
                                            <span className="updates-profile-name">
                                                {item.name || "Unknown"}
                                            </span>

                                            <span className="updates-profile-label">
                                                {item.userid === localStorage.getItem("userid")
                                                    ? "Your status"
                                                    : "Recent update"}
                                            </span>
                                        </div>

                                        <span className="updates-status-dot"></span>

                                    </div>

                                </div>
                            )
                        })}

                    </div>

                )}

            </div>

        </div>
    )
}

export default Updates