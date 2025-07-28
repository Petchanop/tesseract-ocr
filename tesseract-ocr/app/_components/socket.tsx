"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/socket";

export default function SocketComponent() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSource = new MediaSource()
  const videoSource = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001e"')
  const url = URL.createObjectURL(mediaSource);

  useEffect(() => {
    if (socket.connected) {
      onConnect();

    }
    socket.on("receiveData", async (videoData: ArrayBuffer) => {
      // const blob = new Blob([videoData], {
      //   type: 'video/mp4'
      // })
      videoSource.appendBuffer(videoData)
    })

    socket.on("stopData", () => {
      if (videoRef.current) {
        console.log("stop recording")
        URL.revokeObjectURL(videoRef.current.src);
      }
    })

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      console.log(socket.io)

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() =>{
     if (videoRef.current)
        videoRef.current.src = url
  },[ videoRef, url ])

  return (
    <>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <p>FileData:</p>
      <video ref={videoRef} controls />
    </>
  )
}