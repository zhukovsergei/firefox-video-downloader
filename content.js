chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scanImages') {
    const images = scanImagesOnPage();
    sendResponse({images: images});
  }
  else if (request.action === 'scanVideos') {
    const videos = scanVideosOnPage();
    sendResponse({videos: videos});
  }
  return true;
});

function scanImagesOnPage() {
  const imgElements = document.querySelectorAll('img');
  const images = [];
  
  imgElements.forEach(img => {
    if (img.width < 100 || img.height < 100) {
      return;
    }
    
    const src = img.src;
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      return;
    }
    
    images.push({
      src: src,
      width: img.width,
      height: img.height,
      alt: img.alt || 'image',
      pageUrl: window.location.href,
      type: 'image'
    });
  });
  
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const style = window.getComputedStyle(element);
    let bgImage = style.backgroundImage;
    
    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
      if (match && match[1]) {
        const src = match[1];
        
        if (src.startsWith('data:') || src.startsWith('blob:')) {
          return;
        }
        
        if (element.offsetWidth < 100 || element.offsetHeight < 100) {
          return;
        }
        
        images.push({
          src: src,
          width: element.offsetWidth,
          height: element.offsetHeight,
          alt: 'background-image',
          pageUrl: window.location.href,
          type: 'image'
        });
      }
    }
  });
  
  const uniqueImages = [];
  const seenUrls = new Set();
  
  images.forEach(img => {
    if (!seenUrls.has(img.src)) {
      seenUrls.add(img.src);
      uniqueImages.push(img);
    }
  });
  
  return uniqueImages;
}

function scanVideosOnPage() {
  const videos = [];
  const seenUrls = new Set();
  
  function normalizeUrl(url) {
    try {
      return url.split('?')[0].split('#')[0];
    } catch (e) {
      return url;
    }
  }
  
  function addVideoIfUnique(video) {
    const normalizedUrl = normalizeUrl(video.src);
    
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      videos.push(video);
      return true;
    }
    return false;
  }
  
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    if (video.src && !video.src.startsWith('blob:') && !video.src.startsWith('data:')) {
      addVideoIfUnique({
        src: video.src,
        width: video.videoWidth || video.clientWidth,
        height: video.videoHeight || video.clientHeight,
        duration: video.duration || 0,
        title: video.title || 'video',
        pageUrl: window.location.href,
        type: 'video',
        format: getFileExtension(video.src) || 'mp4'
      });
    }
    
    const sources = video.querySelectorAll('source');
    sources.forEach(source => {
      if (source.src && !source.src.startsWith('blob:') && !source.src.startsWith('data:')) {
        addVideoIfUnique({
          src: source.src,
          width: video.videoWidth || video.clientWidth,
          height: video.videoHeight || video.clientHeight,
          duration: video.duration || 0,
          title: video.title || source.getAttribute('title') || 'video',
          pageUrl: window.location.href,
          type: 'video',
          format: source.type ? source.type.split('/')[1] : getFileExtension(source.src) || 'mp4'
        });
      }
    });
  });
  
  const sourceElements = document.querySelectorAll('source[src]');
  sourceElements.forEach(source => {
    const src = source.src;
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const type = source.type || '';
      if (type.includes('video') || src.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
        addVideoIfUnique({
          src: src,
          width: 0,
          height: 0,
          duration: 0,
          title: source.getAttribute('title') || 'video',
          pageUrl: window.location.href,
          type: 'video',
          format: type ? type.split('/')[1] : getFileExtension(src) || 'mp4'
        });
      }
    }
  });
  
  const elementsWithVideoAttr = document.querySelectorAll('[src*=".mp4"], [src*=".webm"], [src*=".ogg"], [src*=".mov"], [poster]');
  elementsWithVideoAttr.forEach(el => {
    if (el.src && !el.src.startsWith('blob:') && !el.src.startsWith('data:') && el.src.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
      addVideoIfUnique({
        src: el.src,
        width: el.width || 0,
        height: el.height || 0,
        duration: 0,
        title: el.getAttribute('title') || el.getAttribute('alt') || 'video',
        pageUrl: window.location.href,
        type: 'video',
        format: getFileExtension(el.src) || 'mp4'
      });
    }
  });
  
  document.querySelectorAll('a[href], [data-video], [data-src]').forEach(el => {
    let videoSrc = '';
    
    if (el.href && el.href.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
      videoSrc = el.href;
    } 
    else if (el.dataset.video && el.dataset.video.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
      videoSrc = el.dataset.video;
    }
    else if (el.dataset.src && el.dataset.src.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
      videoSrc = el.dataset.src;
    }
    
    if (videoSrc && !videoSrc.startsWith('blob:') && !videoSrc.startsWith('data:')) {
      addVideoIfUnique({
        src: videoSrc,
        width: 0,
        height: 0,
        duration: 0,
        title: el.getAttribute('title') || el.textContent || 'video',
        pageUrl: window.location.href,
        type: 'video',
        format: getFileExtension(videoSrc) || 'mp4'
      });
    }
  });
  
  const uniqueVideos = [];
  const seenFilenames = new Set();
  
  videos.forEach(video => {
    const fileName = video.src.split('/').pop().split('?')[0];
    if (!seenFilenames.has(fileName) || fileName === '') {
      seenFilenames.add(fileName);
      uniqueVideos.push(video);
    }
  });
  
  return uniqueVideos;
}

function getFileExtension(url) {
  if (!url) return '';
  
  const cleanUrl = url.split('?')[0].split('#')[0];
  const fileName = cleanUrl.split('/').pop();
  const extension = fileName.split('.').pop();
  
  return extension && extension.length < 5 ? extension.toLowerCase() : '';
} 