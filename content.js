chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scanImages') {
    const images = window.scanImagesOnPage();
    sendResponse({images: images});
  }
  else if (request.action === 'scanVideos') {
    const videos = window.scanVideosOnPage();
    sendResponse({videos: videos});
  }
  return true;
}); 