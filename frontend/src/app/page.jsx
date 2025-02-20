'use client';
import VideoCall from "@/components/VideoCall";
import React, { useState } from "react";
import styles from "./globals.css";



const HomePage = () => {
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    setRoomId(randomId);
    setInputValue(randomId);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setRoomId(inputValue.trim());
      setJoinedRoom(true);
    }
  };

  const handleLeaveRoom = () => {
    setJoinedRoom(false);
    setRoomId("");
    setInputValue("");
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
                placeholder="Enter room ID or generate one"
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
                  Generate Room ID
                </button>
              </div>
            </form>
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