chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'downloadMedia') {
    downloadMediaFiles(request.files);
    sendResponse({success: true});
  }
  return true;
});

function downloadMediaFiles(files) {
  if (!files || files.length === 0) {
    return;
  }
  
  files.forEach((file, index) => {
    let filename = file.src.split('/').pop().split('?')[0];
    
    const mediaType = file.type || 'image';
    
    if (!filename || filename.length < 4) {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      if (mediaType === 'video') {
        filename = `video_${timestamp}_${index}.${file.format || 'mp4'}`;
      } else {
        filename = `image_${timestamp}_${index}.jpg`;
      }
    }
    
    if (mediaType === 'video') {
      if (!filename.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
        filename = `${filename}.${file.format || 'mp4'}`;
      }
    } else {
      if (!filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        filename = `${filename}.jpg`;
      }
    }
    
    if (mediaType === 'video' && !filename.startsWith('video_')) {
      filename = `video_${filename}`;
    } else if (mediaType === 'image' && !filename.startsWith('image_')) {
      filename = `image_${filename}`;
    }
    
    chrome.downloads.download({
      url: file.src,
      filename: `MediaDownloader/${filename}`,
      saveAs: false
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error(`Ошибка скачивания ${mediaType}:`, chrome.runtime.lastError, file.src);
      }
    });
  });
} 