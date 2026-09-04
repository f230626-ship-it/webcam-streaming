# Webcam & Microphone Security Exercise

## Overview
A client-server application demonstrating webcam/microphone capture and streaming between two devices. The "capture/client" captures media on one device, and the "viewer" receives the live stream on a second device.

---

## Architecture

```
[Device 1: Capture]          [Signaling Server]          [Device 2: Viewer]
      |                            |                            |
      |--- getUserMedia() -------->|                            |
      |    (camera + mic)          |                            |
      |                            |                            |
      |--- WebRTC Offer --------->|--- Offer ----------------->|
      |                            |                            |
      |<-- WebRTC Answer ---------|<-- Answer -----------------|
      |                            |                            |
      |<========= P2P Stream (video + audio) =================>|
```

**Key point:** After initial signaling, the media streams directly peer-to-peer. The server is not involved in the actual video/audio transfer.

---

## What I Wrote vs Libraries Used

### What I Wrote (Custom Code)
| Component | File | What It Does |
|-----------|------|--------------|
| Signaling server | `server.js` | Routes WebRTC offer/answer/ICE candidates between clients using Socket.IO rooms |
| Capture logic | `capture.html` | Calls `getUserMedia()`, creates `RTCPeerConnection`, generates offer, handles answer |
| Viewer logic | `viewer.html` | Creates `RTCPeerConnection`, handles offer, generates answer, attaches stream to video element |
| ICE candidate handling | Both HTML files | Exchanges network path information for peer-to-peer connection |
| Role-based room joining | `server.js` | Tracks which socket is "capture" vs "viewer" and routes messages accordingly |

### Libraries Used (Standard/Allowed)
| Library | Version | Purpose | Why It's Allowed |
|---------|---------|---------|------------------|
| **getUserMedia** | Browser API | Access camera/microphone | Standard browser API, not a "pre-built webcam-sharing library" |
| **WebRTC (RTCPeerConnection)** | Browser API | Peer-to-peer streaming | Standard browser API for real-time communication |
| **Socket.IO** | 4.7.2 | WebSocket signaling | Only used to help browsers exchange WebRTC offers/answers. Does NOT handle the actual streaming |
| **Express** | 4.18.2 | HTTP server | Serves static HTML files |

### What I Did NOT Use
- PeerJS
- simple-peer
- Any pre-built screen/webcam sharing library
- Any remote access tool

---

## Setup & Running

### Quick Start
```bash
cd webcam-streaming
npm install
npm start
```

### Two-Device Setup

Both devices must be on the **same WiFi network**.

1. Start the server on Device 1 (the laptop with camera):
   ```bash
   npm start
   ```
   The server will print URLs for both localhost and the local IP address.

2. **Device 1 (Capture):** Open `http://localhost:3000/capture.html`

3. **Device 2 (Viewer):** Open `http://<local-ip>:3000/viewer.html` (use the IP printed by the server)

4. On Device 1, click **Start Capture** and allow the permission prompt

5. The live stream should appear on Device 2

---

## Permission Prompt Behavior

**Important clarification:** localhost does NOT bypass permission prompts. When you click "Start Capture":

1. The browser calls `getUserMedia()` which requests camera and microphone access
2. The browser displays a **permission popup** asking you to allow or deny access
3. You must click "Allow" for the camera/mic to activate
4. After allowing, the media is captured and streamed to the viewer

This is standard browser security behavior that applies to all origins (localhost, HTTP, HTTPS).

---

## Security Indicators Observed

### Testing Environment
- **OS:** macOS
- **Browser:** Safari
- **Devices:** MacBook (capture) + second device on same network (viewer)

### Indicator Findings

| Level | Indicator | Observed? | Details |
|-------|-----------|-----------|---------|
| **OS-level** | Green dot in menu bar | Yes | Appears when camera is active |
| **OS-level** | Orange dot in menu bar | Yes | Appears when microphone is active |
| **Browser-level** | Camera icon in tab | Yes | Shows site has active camera access |
| **Browser-level** | Green dot in tab | Yes | Indicates active media capture |
| **Hardware-level** | Green LED next to camera | Yes | Illuminates when camera sensor is powered |

### Conclusion
All three indicator levels were active during testing:
1. **OS-level:** macOS displays colored dots in the menu bar when camera (green) or microphone (orange) is in use
2. **Browser-level:** Safari shows camera icon and green dot in the tab
3. **Hardware-level:** The physical LED next to the camera lens illuminates

These indicators are **not bypassed** by using localhost or any other technique. They are designed to alert users whenever their camera or microphone is accessed, regardless of the requesting origin.

---

## File Structure
```
webcam-streaming/
├── package.json          # Dependencies: express, socket.io
├── server.js             # Express + Socket.IO signaling server
├── README.md             # This file
└── public/
    ├── capture.html      # Client: captures webcam/mic, sends via WebRTC
    └── viewer.html       # Viewer: receives and displays the stream
```

---

## How WebRTC Signaling Works

1. **Capture** creates an `RTCPeerConnection` and generates an SDP offer
2. **Offer** is sent to the server, which forwards it to the viewer
3. **Viewer** receives the offer, creates its own `RTCPeerConnection`, generates an SDP answer
4. **Answer** is sent back to the server, which forwards it to the capture
5. **ICE candidates** are exchanged to find the best network path
6. Once connected, media flows **directly peer-to-peer** without passing through the server
