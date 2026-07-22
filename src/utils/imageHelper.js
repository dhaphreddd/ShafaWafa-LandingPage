import React from "react";

export function formatImageUrl(path) {
  if (!path) return "/storage/logo.webp";
  let url = path.trim();

  // If Google Drive link or Googleusercontent link
  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    // Extract file ID
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  url.match(/id=([a-zA-Z0-9_-]+)/) || 
                  url.match(/\/drive-viewer\/([a-zA-Z0-9_-]+)/);
    
    if (match && match[1] && !match[1].startsWith("AKGpi")) {
      const fileId = match[1];
      // Use wsrv.nl high-performance image CDN proxy for Google Drive files
      return `https://wsrv.nl/?url=https://drive.google.com/uc?id=${fileId}`;
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `/storage/${url}`;
}
