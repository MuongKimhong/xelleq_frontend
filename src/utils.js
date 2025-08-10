function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(url)
}

function isVideo(url) {
  return /\.(mp4|webm|mkv|mov|mpg|avi)$/i.test(url)
}

function isAudio(url) {
  return /\.(mp3|mid|m4a|ogg|wav)$/i.test(url)
}

function isPdf(url) {
  return /\.pdf$/i.test(url)
}

function isDoc(url) {
  return /\.(doc|docx|odp)$/i.test(url)
}

const staticSiteUrl = "https://info.xelleq.com"

function openStaticLink(endpoint) {
  window.open(`${staticSiteUrl}/${endpoint}`, '_blank')
}
 export { isImage, isVideo, isAudio, isPdf, isDoc, staticSiteUrl, openStaticLink }
