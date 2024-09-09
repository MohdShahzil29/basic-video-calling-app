"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const VideoCall = ({ params }) => {
  const { id: roomId } = params; // Get the dynamic room ID from the URL
  const [socket, setSocket] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:5000");
    setSocket(socket);

    const peerConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    peerConnection.current = new RTCPeerConnection(peerConfig);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate, roomId);
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localVideoRef.current.srcObject = stream;

          stream.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, stream);
          });

          socket.emit("join-room", roomId);
        })
        .catch((err) => {
          console.error("Error accessing media devices.", err);
          alert(
            "Could not access camera or microphone. Please check permissions or use a supported browser."
          );
        });
    } else {
      alert(
        "Your browser does not support video calling. Please try a modern browser (Chrome, Firefox, etc.)."
      );
    }

    socket.on("offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", answer, roomId);
    });

    socket.on("answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("candidate", (candidate) => {
      peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Handle end call from the other peer
    socket.on("end-call", () => {
      endCall();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const createOffer = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", offer, roomId);
  };

  const endCall = () => {
    // Close the peer connection and stop media tracks
    peerConnection.current.close();
    const tracks = localVideoRef.current.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;

    // Notify the server that the call has ended
    socket.emit("end-call", roomId);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Room: {roomId}</h1>
      <div className="flex space-x-6">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-1/2 border-4 border-blue-500"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 border-4 border-green-500"
        />
      </div>
      <button onClick={createOffer} className="mt-4 p-2 bg-blue-600 rounded">
        Start Call
      </button>
      <button onClick={endCall} className="mt-4 p-2 bg-red-600 rounded">
        End Call
      </button>
    </div>
  );
};

export default VideoCall;
