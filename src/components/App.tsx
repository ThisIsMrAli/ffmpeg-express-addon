import React, { useEffect, useState } from "react";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

import { Provider, Button } from "@adobe/react-spectrum";
import { theme as spectrumTheme } from "@react-spectrum/theme-express";

import { createFFmpegInstance } from "../helper";

const App = ({ addOnUISdk }: { addOnUISdk: AddOnSDKAPI }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    createFFmpegInstance();
  }, []);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    }
  };

  const handleGetVideoInfo = async () => {
    if (!videoFile) return;
    try {
      const ffmpeg = await createFFmpegInstance();

      ffmpeg.on("log", ({ message }) => {
        console.log("Video Info", message);
      });

      await ffmpeg.writeFile(
        "input.mp4",
        new Uint8Array(await videoFile.arrayBuffer())
      );
      await ffmpeg.exec(["-i", "input.mp4", "-hide_banner"]);

      // Clean up
      await ffmpeg.terminate();
    } catch (error) {
      console.error("Error getting video metadata:", error);
      return "Error getting video metadata";
    }
  };

  const handleExtractFirstFrame = async () => {
    if (!videoFile) return;
    
    try {
      const ffmpeg = await createFFmpegInstance();
      
      // Load video into FFmpeg
      await ffmpeg.writeFile("input.mp4", new Uint8Array(await videoFile.arrayBuffer()));
      
      // Extract the first frame
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", "00:00:00", // Start from the beginning (0 seconds)
        "-vframes", "1",    // Capture only 1 frame
        "first-frame.jpg"   // Save as a jpg image
      ]);
  
      // Get the frame as a blob
      const frameBlob = await ffmpeg.readFile("first-frame.jpg");
     
      
      // Display the image
      addOnUISdk.app.document.addImage(
        new Blob([frameBlob], { type: "image/jpeg" })
      );
  
      // Clean up
      await ffmpeg.terminate();
  
    } catch (error) {
      console.error("Error extracting first frame:", error);
    }
  };

  const handleApplyBlur = async () => {
    if (!videoFile) return;
  
    try {
      const ffmpeg = await createFFmpegInstance();
  
      // Load the video into FFmpeg
      await ffmpeg.writeFile("input.mp4", new Uint8Array(await videoFile.arrayBuffer()));
      ffmpeg.on("progress", ({ progress }) => {
        console.log("Progress", progress);
      });
      // Apply blur effect with sigma=10 (adjust sigma for more or less blur)
      await ffmpeg.exec([
        "-i", "input.mp4",          // Input file
        "-vf", "gblur=sigma=20",    // Gaussian blur effect
        "-c:v", "libx264",          // Efficient video encoding
        "-preset", "ultrafast",     // Speed up processing
        "-tune", "fastdecode",      // Optimize for fast decoding
        "-crf", "23",               // Good balance between speed & quality
        "-c:a", "copy",             // Copy audio without re-encoding
        "output-blur.mp4"           // Output file
      ]);

  
      // Fetch the output file and create a Blob URL to display the video
      const outputBlob = await ffmpeg.readFile("output-blur.mp4");
      const outputURL = URL.createObjectURL(new Blob([outputBlob]));
  
      // Import it
      addOnUISdk.app.document.addVideo(
        new Blob([outputBlob], { type: "video/mp4" })
      );

      // Clean up and terminate FFmpeg instance after processing
      await ffmpeg.terminate();
    } catch (error) {
      console.error("Error applying blur effect:", error);
    }
  };
  
  
  return (
    <Provider theme={spectrumTheme}>
      <div>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        {videoFile && (
          <video controls width="100%">
            <source
              src={URL.createObjectURL(videoFile)}
              type={videoFile.type}
            />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Button variant="cta" onPress={handleGetVideoInfo}>
          Get Video Info
        </Button>
        <Button variant="cta" onPress={handleExtractFirstFrame}>
          Extract First Frame
        </Button>
        <Button variant="cta" onPress={handleApplyBlur}>
          Apply Blur
        </Button>
      </div>
    </Provider>
  );
};

export default App;
