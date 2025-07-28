'use client'
import React, { useRef, useState, useEffect } from 'react';
import { socket } from '@/socket'

enum CameraMode {
  FRONT = "user",
  BACK = "environment"
}

export default function CamScreen() {

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [camera, setCamera] = useState<CameraMode>(CameraMode.FRONT)
  const [open, setOpen] = useState(true)

  const sendVideoData = (data: ArrayBuffer) => {
    socket.emit("videoData", data);
  };

  // const recordScreen: MediaStream = async () => {
  //   const mediaConstraints: DisplayMediaStreamOptions = {
  //     video: true
  //   };
  //   const screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
  //   return screenStream;
  // }

  useEffect(() => {
    const enableVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camera } })
        setMediaStream(stream)
      } catch (error) {
        console.error('Error accessing webcam', error);
      }
    };
    if (open) {
      console.log("open camera")
      enableVideoStream();
    }
  }, [camera, open]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      console.log("active stream", mediaStream)
      videoRef.current.srcObject = mediaStream;
      setRecorder(new MediaRecorder(videoRef.current.srcObject))
    }
  }, [videoRef, mediaStream]);

  useEffect(() => {
    if (recorder) {
      console.log(recorder)
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((data) => {
            sendVideoData(data)
          })
          chunks.push(event.data)
        }
      }
      console.log("record", recorder)
      recorder.start(200)
      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: 'video/mp4',
        })
        const blobUrl = URL.createObjectURL(blob)
        console.log(blobUrl)
      }
    }
  }, [recorder])

  useEffect(() => {
    const closeCamera = async () => {
      if (!open && mediaStream && videoRef.current) {
        console.log(open, "close camera")
        mediaStream.getTracks().forEach((track) => {
          track.stop();
          mediaStream.removeTrack(track)
        });
        videoRef.current.srcObject = null

        recorder?.stop()
        recorder?.stream.getTracks().forEach((track) => track.stop())
        socket.emit("stopRecording", "stop")
      }
    };

    closeCamera()
  }, [mediaStream, open, recorder]);

  return (
    <>
      <video ref={videoRef} autoPlay={true} />
      <button onClick={() => setCamera(camera == CameraMode.BACK ? CameraMode.FRONT : CameraMode.BACK)} >camera</button>
      <button onClick={() => setOpen((prev) => !prev)} >{open ? "close" : "open"}</button>
    </>
  )
}