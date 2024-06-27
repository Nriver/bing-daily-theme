console.log("Check new wallpaper");

// sync before do anything, avoid duplicated update
await api.waitUntilSynced();

/* Run the fetch request in the backend to avoid CORS in frontend */

var [didUpdate, imageUrl, imageMessage] = await api.runAsyncOnBackendWithManualTransactionHandling(async () => {
    async function fetchBingImage() {
      try {
        // `mkt` param does not work here, Bing return the result based on your IP address
        const response = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        var data = await response.json();
        return data;
      } catch (error) {
        log.error('Bing image fetch error:', error);
        throw error;
      }
    }
    
    var didUpdate = false;
    var bingDailyNote = await api.searchForNote(`#BingDailyNote`);
    var data = await fetchBingImage();
    var newUrl = `https://www.bing.com${data.images[0].url}`;
    var cssText = await bingDailyNote.getContent();
    var regex = /(--background-image-url:\s*url\(")([^"]+)("\);)/;
    var match = cssText.match(regex);
    if (match) {
        var oldUrl = match[2];
        // replace if not equal
        if (oldUrl != newUrl) {
            cssText = cssText.replace(oldUrl, newUrl);
            bingDailyNote.setContent(cssText);
            didUpdate = true;
        }
    }
    return [didUpdate, newUrl, data.images[0].title + ' -- ' + data.images[0].copyright];
}, [])

console.log(imageUrl);
console.log(imageMessage);

await api.waitUntilSynced();

/* apply new image */
if (didUpdate) {
    document.documentElement.style.setProperty('--background-image-url', `url(${imageUrl})`);
}

if (config.showMessage) {
    if (window.glob?.device === "mobile") {
        api.showMessage(imageMessage, 3000);
    } else {
        api.showMessage(imageMessage, 5000);
    }
}