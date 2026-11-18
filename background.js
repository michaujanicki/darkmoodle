let iconDataPromise;

const getIconData = () => {
  if (iconDataPromise) return iconDataPromise;

  iconDataPromise = fetch(chrome.runtime.getURL("darkmode_moodle_logo.svg"))
    .then((response) => response.text())
    .then((svg) => createImageBitmap(new Blob([svg], { type: "image/svg+xml" })))
    .then((bitmap) => {
      const canvas = new OffscreenCanvas(128, 128);
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0, 128, 128);
      bitmap.close();
      return context.getImageData(0, 0, 128, 128);
    });

  return iconDataPromise;
};

const setToolbarIcon = () => getIconData()
  .then((imageData) => chrome.action.setIcon({ imageData }))
  .catch(console.error);

chrome.runtime.onInstalled.addListener(setToolbarIcon);
chrome.runtime.onStartup.addListener(setToolbarIcon);
setToolbarIcon();
