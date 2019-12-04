'use strict';

const HCCrawler = require('headless-chrome-crawler');
const request = require('request');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');

const NUMBER_OF_CHANNELS = 3


let model = null;

function saveImage(url) {
    let filename = `./tmp/${new Date().getTime()}.jpg`;
    let file = fs.createWriteStream(filename);
    request(url).pipe(file).on('close', async () => {

        let image = readImage(filename);
        const input = imageToInput(image, NUMBER_OF_CHANNELS);
        let predictions = await model.classify(input);
        console.log(`${filename} -> ${JSON.stringify(predictions)}`);
    });
}

const readImage = path => {
    const buf = fs.readFileSync(path)
    const pixels = jpeg.decode(buf, true)
    return pixels
  }

const imageByteArray = (image, numChannels) => {
    const pixels = image.data
    const numPixels = image.width * image.height;
    const values = new Int32Array(numPixels * numChannels);
  
    for (let i = 0; i < numPixels; i++) {
      for (let channel = 0; channel < numChannels; ++channel) {
        values[i * numChannels + channel] = pixels[i * 4 + channel];
      }
    }
  
    return values
  }
  
  const imageToInput = (image, numChannels) => {
    const values = imageByteArray(image, numChannels)
    const outShape = [image.height, image.width, numChannels];
    const input = tf.tensor3d(values, outShape, 'int32');
  
    return input
  }
  

(async () => {
    model = await mobilenet.load();
    const crawler = await HCCrawler.launch({
        customCrawl: async (page, crawl) => {
            // You can access the page object before requests
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (request.resourceType() == 'image') {
                    saveImage(request.url());
                    console.log(`Image url: ${request.url()}`);
                    // TODO machine learning things here
                    request.abort();
                } else {
                    request.continue();
                }
            });
          // The result contains options, links, cookies and etc.
          const result = await crawl();
          // You can access the page object after requests
          result.content = await page.content();
          // You need to extend and return the crawled result
          return result;
        },
        onSuccess: result => {
          console.log(`Got ${result.options.url}.`);
        },
    });
    // Queue a request
    await crawler.queue({ 
        url: 'https://www.apsofdurham.org/', 
        maxDepth: 1, 
        allowedDomains: [ 'www.apsofdurham.org' ],
        followSitemapXml: true });
    await crawler.onIdle(); // Resolved when no queue is left
    await crawler.close(); // Close the crawler
  })();
