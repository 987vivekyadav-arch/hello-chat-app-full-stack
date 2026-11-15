import React, {useEffect} from "react"
import {io} from "socket.io-client"
import "./Calls.css"

function Calls(){

    const [showaudio,setShowAudio] = React.useState(false)
    const [phone,setPhone] = React.useState("")
    const [user,setUser] = React.useState(null)
    const [incomingCall,setIncomingCall] = React.useState(null)
    const [callStatus,setCallStatus] = React.useState("")
    const [isCalling,setIsCalling] = React.useState(false)
    const [isMuted,setIsMuted] = React.useState(false)

    const socketRef = React.useRef(null)
    const peerConnectionRef = React.useRef(null)
    const localStreamRef = React.useRef(null)
    const remoteAudioRef = React.useRef(null)
    const currentCallRef = React.useRef(null)
    const pendingCandidatesRef = React.useRef([])

    const iceServers = {
        iceServers:[
            {urls:"stun:stun.l.google.com:19302"}
        ]
    }


    // SOCKET CONNECTION

    useEffect(function(){

        const newSocket = io("http://localhost:5000",{
            auth:{
                token:localStorage.getItem("token")
            }
        })

        socketRef.current=newSocket

        newSocket.on("connect",function(){
            console.log("CALL SOCKET CONNECTED:",newSocket.id)
        })

        newSocket.on("connect_error",function(error){
            console.log("SOCKET ERROR:",error.message)
        })


        // INCOMING CALL

        newSocket.on("incoming-call",function(data){

            if(currentCallRef.current){
                newSocket.emit("call-response",{
                    to:data.fromSocketId,
                    status:"rejected"
                })
                return
            }

            setIncomingCall(data)
            setCallStatus("Incoming call...")
        })


        // CALL RESPONSE

        newSocket.on("call-response",function(data){

            if(data.status==="accepted"){
                setCallStatus("Call accepted. Connecting...")
                startCallerOffer()
            }
            else{
                cleanupCall()
                setCallStatus("Call rejected")
            }
        })


        // WEBRTC EVENTS

        newSocket.on("webrtc-offer",function(data){
            receiveOffer(data)
        })

        newSocket.on("webrtc-answer",function(data){
            receiveAnswer(data)
        })

        newSocket.on("webrtc-ice-candidate",function(data){
            receiveIceCandidate(data)
        })

        newSocket.on("end-call",function(){
            cleanupCall()
            setCallStatus("Call ended by other user")
        })


        return function(){
            cleanupCall()
            newSocket.disconnect()
            socketRef.current=null
        }

    },[])



    // MICROPHONE

    function getMicrophone(){

        if(!navigator.mediaDevices ||
           !navigator.mediaDevices.getUserMedia){

            return Promise.reject(
                new Error("Microphone unavailable. Use localhost or HTTPS.")
            )
        }

        return navigator.mediaDevices.getUserMedia({
            audio:true,
            video:false
        })
    }



    // CREATE PEER CONNECTION

    function createPeerConnection(){

        const peerConnection=new RTCPeerConnection(iceServers)

        peerConnectionRef.current=peerConnection

        peerConnection.onicecandidate=function(event){

            if(event.candidate && currentCallRef.current){

                socketRef.current.emit("webrtc-ice-candidate",{
                    to:currentCallRef.current.peerId,
                    candidate:event.candidate
                })
            }
        }

        peerConnection.ontrack=function(event){

            if(remoteAudioRef.current){

                remoteAudioRef.current.srcObject=event.streams[0]

                remoteAudioRef.current.play().catch(function(error){
                    console.log("AUDIO ERROR:",error)
                })
            }
        }

        peerConnection.onconnectionstatechange=function(){

            console.log("WEBRTC STATE:",peerConnection.connectionState)

            if(peerConnection.connectionState==="connected"){
                setCallStatus("Voice call connected")
            }

            if(peerConnection.connectionState==="failed"){
                setCallStatus("Connection failed. TURN server may be required.")
            }

            if(peerConnection.connectionState==="disconnected"){
                setCallStatus("Connection interrupted")
            }
        }

        return peerConnection
    }



    // ADD LOCAL TRACKS

    function addLocalTracks(peerConnection){

        localStreamRef.current.getTracks().forEach(function(track){

            peerConnection.addTrack(
                track,
                localStreamRef.current
            )
        })
    }



    // MAKE CALL

    function makeCall(){

        if(phone.trim()===""){
            alert("Enter phone number")
            return
        }

        if(!socketRef.current || !socketRef.current.connected){
            setCallStatus("Calling server is not connected")
            return
        }

        fetch("http://localhost:5000/calls",{

            method:"POST",

            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+localStorage.getItem("token")
            },

            body:JSON.stringify({
                phone:phone.trim()
            })

        })

        .then(function(response){

            return response.json().then(function(data){

                if(!response.ok){
                    throw new Error(data.message || "User not found")
                }

                return data
            })
        })

        .then(function(data){

            if(!data || !data._id){
                throw new Error("User not found")
            }

            setUser(data)

            currentCallRef.current={
                peerId:String(data._id),
                role:"caller"
            }

            setIsCalling(true)
            setShowAudio(false)

            setCallStatus("Calling "+data.name+"...")

            socketRef.current.emit("call-user",{
                to:String(data._id)
            })
        })

        .catch(function(error){

            console.log("MAKE CALL ERROR:",error)
            setCallStatus(error.message)
        })
    }



    // ACCEPT CALL

    function acceptCall(){

        if(!incomingCall || !socketRef.current){
            return
        }

        currentCallRef.current={
            peerId:String(incomingCall.from),
            role:"receiver"
        }

        getMicrophone()

        .then(function(stream){

            localStreamRef.current=stream

            const peerConnection=createPeerConnection()

            addLocalTracks(peerConnection)

            socketRef.current.emit("call-response",{
                to:incomingCall.fromSocketId,
                status:"accepted"
            })

            setIncomingCall(null)
            setIsCalling(true)
            setShowAudio(false)

            setCallStatus("Call accepted. Waiting for connection...")
        })

        .catch(function(error){

            console.log("MICROPHONE ERROR:",error)

            socketRef.current.emit("call-response",{
                to:incomingCall.fromSocketId,
                status:"rejected"
            })

            cleanupCall()
            setCallStatus("Microphone permission denied")
        })
    }



    // REJECT CALL

    function rejectCall(){

        if(!incomingCall || !socketRef.current){
            return
        }

        socketRef.current.emit("call-response",{
            to:incomingCall.fromSocketId,
            status:"rejected"
        })

        setIncomingCall(null)
        setCallStatus("Call rejected")
    }



    // CALLER OFFER

    function startCallerOffer(){

        getMicrophone()

        .then(function(stream){

            localStreamRef.current=stream

            const peerConnection=createPeerConnection()

            addLocalTracks(peerConnection)

            return peerConnection.createOffer()
        })

        .then(function(offer){

            return peerConnectionRef.current.setLocalDescription(offer)
        })

        .then(function(){

            socketRef.current.emit("webrtc-offer",{
                to:currentCallRef.current.peerId,
                offer:peerConnectionRef.current.localDescription
            })

        })

        .catch(function(error){

            console.log("OFFER ERROR:",error)
            setCallStatus("Unable to start voice call")
            endCall()
        })
    }



    // RECEIVE OFFER

    function receiveOffer(data){

        const peerConnection=peerConnectionRef.current

        if(!peerConnection){
            console.log("PEER CONNECTION NOT READY")
            return
        }

        peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
        )

        .then(function(){
            return peerConnection.createAnswer()
        })

        .then(function(answer){
            return peerConnection.setLocalDescription(answer)
        })

        .then(function(){

            socketRef.current.emit("webrtc-answer",{
                to:data.from,
                answer:peerConnection.localDescription
            })

            return processPendingCandidates()
        })

        .catch(function(error){

            console.log("RECEIVE OFFER ERROR:",error)
            setCallStatus("Unable to connect call")
        })
    }



    // RECEIVE ANSWER

    function receiveAnswer(data){

        if(!peerConnectionRef.current){
            return
        }

        peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        )

        .then(function(){
            return processPendingCandidates()
        })

        .catch(function(error){
            console.log("ANSWER ERROR:",error)
        })
    }



    // RECEIVE ICE

    function receiveIceCandidate(data){

        if(!peerConnectionRef.current){
            return
        }

        if(peerConnectionRef.current.remoteDescription){

            peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            )

            .catch(function(error){
                console.log("ICE ERROR:",error)
            })
        }
        else{
            pendingCandidatesRef.current.push(data.candidate)
        }
    }



    // PROCESS PENDING ICE

    function processPendingCandidates(){

        const peerConnection=peerConnectionRef.current

        if(!peerConnection || !peerConnection.remoteDescription){
            return Promise.resolve()
        }

        const candidates=pendingCandidatesRef.current

        pendingCandidatesRef.current=[]

        return candidates.reduce(function(promise,candidate){

            return promise.then(function(){

                return peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                )
            })

        },Promise.resolve())
    }



    // MUTE

    function toggleMute(){

        if(!localStreamRef.current){
            return
        }

        localStreamRef.current.getAudioTracks().forEach(function(track){
            track.enabled=!track.enabled
        })

        setIsMuted(!isMuted)
    }



    // CLEANUP

    function cleanupCall(){

        if(localStreamRef.current){

            localStreamRef.current.getTracks().forEach(function(track){
                track.stop()
            })

            localStreamRef.current=null
        }

        if(peerConnectionRef.current){
            peerConnectionRef.current.close()
            peerConnectionRef.current=null
        }

        if(remoteAudioRef.current){
            remoteAudioRef.current.srcObject=null
        }

        currentCallRef.current=null
        pendingCandidatesRef.current=[]

        setIncomingCall(null)
        setIsCalling(false)
        setIsMuted(false)
    }



    // END CALL

    function endCall(){

        if(currentCallRef.current && socketRef.current){

            socketRef.current.emit("end-call",{
                to:currentCallRef.current.peerId
            })
        }

        cleanupCall()
        setCallStatus("Call ended")
    }



    // FRONTEND

    return(

        <div className="calls-page">

            <div className="calls-header">

                <div>
                    <h2>Calls</h2>
                    <p>Stay connected with your people</p>
                </div>

                <div className="calls-header-icon">
                    ☎
                </div>

            </div>


            {/* INITIAL CALL BUTTON */}

            {!incomingCall && !isCalling && (

                <div className="calls-home">

                    <button
                        className="calls-main-button"
                        onClick={function(){
                            setShowAudio(!showaudio)
                            setCallStatus("")
                        }}
                    >
                        ☎
                    </button>

                    <h3>Call</h3>

                </div>

            )}


            {/* DIAL PANEL */}

            {showaudio && !incomingCall && !isCalling && (

                <div className="calls-overlay">

                    <div className="calls-dial-card">

                        <button
                            className="calls-close-button"
                            onClick={function(){
                                setShowAudio(false)
                            }}
                        >
                            ✕
                        </button>

                        <div className="calls-dial-icon">
                            ☎
                        </div>

                        <h3>Make a call</h3>

                        <p>
                            Enter a phone number to start a conversation
                        </p>

                        <div className="calls-input-group">

                            <span className="calls-country-code">
                                +91
                            </span>

                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={function(e){
                                    setPhone(e.target.value)
                                }}
                            />

                        </div>

                        <button
                            className="calls-start-button"
                            onClick={makeCall}
                            disabled={!phone.trim()}
                        >
                            ☎ &nbsp; Start Voice Call
                        </button>

                    </div>

                </div>

            )}


            {/* INCOMING CALL */}

            {incomingCall && (

                <div className="calls-screen">

                    <div className="calls-screen-content">

                        <span className="calls-status-pill">
                            INCOMING VOICE CALL
                        </span>

                        <div className="calls-avatar">
                            ☎
                        </div>

                        <h2>Incoming call</h2>

                        <p className="calls-screen-subtitle">
                            Someone is calling you...
                        </p>

                        <div className="calls-action-buttons">

                            <button
                                className="calls-reject-button"
                                onClick={rejectCall}
                            >
                                <span>✕</span>
                                <small>Reject</small>
                            </button>

                            <button
                                className="calls-accept-button"
                                onClick={acceptCall}
                            >
                                <span>☎</span>
                                <small>Accept</small>
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ACTIVE CALL */}

            {isCalling && (

                <div className="calls-screen">

                    <div className="calls-screen-content">

                        <span className="calls-status-pill">
                            VOICE CALL
                        </span>

                        <div className="calls-avatar">

                            {user && user.image ?

                                <img
                                    src={"http://localhost:5000/"+user.image}
                                    alt="Profile"
                                />

                                :

                                <span>☎</span>
                            }

                        </div>

                        <h2>
                            {user ? user.name : "Calling..."}
                        </h2>

                        <p className="calls-screen-subtitle">
                            {callStatus}
                        </p>

                        <div className="calls-active-buttons">

                            <button
                                className="calls-mute-button"
                                onClick={toggleMute}
                            >
                                {isMuted ? "Unmute" : "Mute"}
                            </button>

                            <button
                                className="calls-end-button"
                                onClick={endCall}
                            >
                                <span>☎</span>
                                <small>End Call</small>
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* STATUS */}

            {!incomingCall && !isCalling && callStatus && (

                <p className="calls-message">
                    {callStatus}
                </p>

            )}

            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
            />

        </div>

    )
}

export default Calls