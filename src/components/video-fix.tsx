'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
}

export default function VideoPlayer({ src, className, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    if (videoRef.current) {
      const video = videoRef.current;
      
      // Handle iOS specific video loading
      const handleCanPlay = () => {
        setCanPlay(true);
        if (iOS) {
          // For iOS, try to play after a short delay
          setTimeout(() => {
            video.play().catch((error) => {
              console.log('iOS autoplay blocked:', error);
              // Fallback: show poster or static image
            });
          }, 100);
        }
      };

      const handleLoadedData = () => {
        if (!iOS) {
          video.play().catch(() => {
            console.log('Autoplay prevented');
          });
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);

      // iOS specific: Try to load the video
      if (iOS) {
        video.load();
      }

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      playsInline
      loop
      autoPlay={!isIOS} // Disable autoplay on iOS initially
      muted
      webkit-playsinline="true"
      x-webkit-airplay="allow"
      preload="metadata"
      poster={poster}
      controls={false}
      disablePictureInPicture
      style={{
        // Ensure video covers the container on iOS
        objectFit: 'cover',
        width: '100%',
        height: '100%',
      }}
      onTouchStart={() => {
        // Enable play on first touch for iOS
        if (isIOS && videoRef.current) {
          videoRef.current.play().catch(() => {
            console.log('Manual play failed');
          });
        }
      }}
    />
  );
}