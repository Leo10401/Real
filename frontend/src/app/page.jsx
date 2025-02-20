'use client';
import VideoCall from "@/components/VideoCall";
import React, { useState } from "react";
import styles from "./globals.css";

const HomePage = () => {
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [passcode, setPasscode] = useState("");
  const [correctPasscode, setCorrectPasscode] = useState("");
  const [generatedPasscode, setGeneratedPasscode] = useState(""); // To show the generated passcode

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    const randomPasscode = Math.random().toString(36).substring(2, 6); // Generate a 4-character passcode
    setRoomId(randomId);
    setInputValue(randomId);
    setCorrectPasscode(randomPasscode);
    setGeneratedPasscode(randomPasscode); // Store the passcode for display
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputValue.trim() && passcode.trim() === correctPasscode) {
      setRoomId(inputValue.trim());
      setJoinedRoom(true);
    } else {
      alert("Incorrect passcode or room ID. Please try again.");
    }
  };

  const handleLeaveRoom = () => {
    setJoinedRoom(false);
    setRoomId("");
    setInputValue("");
    setPasscode("");
    setGeneratedPasscode("");
  };

  return (
    <div className={styles.container}>
      {!joinedRoom ? (
        <div className={styles.joinSection}>
          <h1>Video Chat Rooms</h1>
          <div className={styles.formContainer}>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter room ID"
                className={styles.input}
              />
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className={styles.input}
              />
              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.joinButton}>
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={generateRoomId}
                  className={styles.generateButton}
                >
                  Generate Room ID & Passcode
                </button>
              </div>
            </form>
            {generatedPasscode && (
              <div className={styles.generatedInfo}>
                <p><strong>Room ID:</strong> {roomId}</p>
                <p><strong>Passcode:</strong> {generatedPasscode}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.roomSection}>
          <div className={styles.roomHeader}>
            <h1>Room: {roomId}</h1>
            <button onClick={handleLeaveRoom} className={styles.leaveButton}>
              Leave Room
            </button>
          </div>
          <VideoCall roomId={roomId} />
        </div>
      )}
    </div>
  );
};

export default HomePage;
