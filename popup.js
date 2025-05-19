let pageImages = [];
let pageVideos = [];

document.getElementById('tab-images').addEventListener('click', function() {
  document.getElementById('tab-images').classList.add('active');
  document.getElementById('tab-videos').classList.remove('active');
  document.getElementById('content-images').classList.add('active');
  document.getElementById('content-videos').classList.remove('active');
});

document.getElementById('tab-videos').addEventListener('click', function() {
  document.getElementById('tab-videos').classList.add('active');
  document.getElementById('tab-images').classList.remove('active');
  document.getElementById('content-videos').classList.add('active');
  document.getElementById('content-images').classList.remove('active');
});

document.getElementById('scan-images').addEventListener('click', function() {
  document.getElementById('images-status').textContent = 'Scan...';
  document.getElementById('images-container').innerHTML = '';
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'scanImages'}, function(response) {
      if (!response || chrome.runtime.lastError) {
        document.getElementById('images-status').textContent = 'Error. Reload...';
        return;
      }
      
      pageImages = response.images;
      displayImages(pageImages);
      
      if (pageImages.length === 0) {
        document.getElementById('images-status').textContent = 'No imgs found.';
      } else {
        document.getElementById('images-status').textContent = `Found imgs: ${pageImages.length}`;
      }
    });
  });
});

document.getElementById('scan-videos').addEventListener('click', function() {
  document.getElementById('videos-status').textContent = 'Scan...';
  document.getElementById('videos-container').innerHTML = '';
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'scanVideos'}, function(response) {
      if (!response || chrome.runtime.lastError) {
        document.getElementById('videos-status').textContent = 'Error on scan. Reload...';
        return;
      }
      
      pageVideos = response.videos;
      displayVideos(pageVideos);
      
      if (pageVideos.length === 0) {
        document.getElementById('videos-status').textContent = 'No videos found.';
      } else {
        document.getElementById('videos-status').textContent = `Found vid: ${pageVideos.length}`;
      }
    });
  });
});

document.getElementById('download-all-images').addEventListener('click', function() {
  if (pageImages.length === 0) {
    document.getElementById('images-status').textContent = 'No imgages for download.';
    return;
  }
  
  document.getElementById('images-status').textContent = 'Download all images...';
  
  chrome.runtime.sendMessage({
    action: 'downloadMedia',
    files: pageImages
  }, function(response) {
    document.getElementById('images-status').textContent = 'Downloading.';
  });
});

document.getElementById('download-all-videos').addEventListener('click', function() {
  if (pageVideos.length === 0) {
    document.getElementById('videos-status').textContent = 'No videos for download.';
    return;
  }
  
  document.getElementById('videos-status').textContent = 'Download all videos...';
  
  chrome.runtime.sendMessage({
    action: 'downloadMedia',
    files: pageVideos
  }, function(response) {
    document.getElementById('videos-status').textContent = 'Downloading.';
  });
});

function displayImages(images) {
  const container = document.getElementById('images-container');
  container.innerHTML = '';
  
  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'item';
    
    const thumbnail = document.createElement('img');
    thumbnail.className = 'thumbnail';
    thumbnail.src = img.src;
    thumbnail.onerror = function() {
      this.src = 'icons/icon48.png';
    };
    
    const info = document.createElement('div');
    info.className = 'info';
    const fileName = img.src.split('/').pop().split('?')[0];
    info.innerHTML = `
      <div title="${img.src}">${fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}</div>
      <div>${img.width}x${img.height}</div>
    `;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({
        action: 'downloadMedia',
        files: [img]
      });
    });
    
    item.appendChild(thumbnail);
    item.appendChild(info);
    item.appendChild(downloadBtn);
    container.appendChild(item);
  });
}

function displayVideos(videos) {
  const container = document.getElementById('videos-container');
  container.innerHTML = '';
  
  videos.forEach((video, index) => {
    const item = document.createElement('div');
    item.className = 'item';
    
    const thumbnail = document.createElement('div');
    thumbnail.className = 'video-thumbnail';
    
    const info = document.createElement('div');
    info.className = 'info';
    const fileName = video.src.split('/').pop().split('?')[0];
    let durationStr = '';
    if (video.duration) {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      durationStr = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }
    
    info.innerHTML = `
      <div title="${video.src}">${fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName} 
        <span class="format-badge">${video.format || 'mp4'}</span>
      </div>
      <div>${video.width && video.height ? `${video.width}x${video.height}` : ''} 
        ${durationStr ? `(${durationStr})` : ''}
      </div>
    `;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({
        action: 'downloadMedia',
        files: [video]
      });
    });
    
    item.appendChild(thumbnail);
    item.appendChild(info);
    item.appendChild(downloadBtn);
    container.appendChild(item);
  });
} 