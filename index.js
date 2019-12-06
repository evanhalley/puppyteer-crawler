'use strict';

const HCCrawler = require('headless-chrome-crawler');
const request = require('request');
const tf = require('@tensorflow/tfjs');
const tfnode = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const extractDomain = require('extract-domain');

function getImagePixelData(imageUrl) {
    return new Promise((resolve, reject) => {

        let options = {
            url: imageUrl,
            method: "get",
            encoding: null
        };

        request(options, (err, response, buffer) => {
        
            if (err) {
                reject(err)
            } else {
                resolve(buffer);
            }
        });
    });
}

async function crawlForImages(url) {
    let domain = extractDomain(url);
    console.log(domain);
    let imageUrls = [];
    let crawler = await HCCrawler.launch({

        customCrawl: async (page, crawl) => {
            await page.setRequestInterception(true);

            page.on('request', request => {

                if (request.resourceType() == 'image') {
                    imageUrls.push(request.url());
                    request.abort();
                } else {
                    request.continue();
                }
            });
          // The result contains options, links, cookies and etc.
          let result = await crawl();
          // You can access the page object after requests
          result.content = await page.content();
          // You need to extend and return the crawled result
          return result;
        },
        onSuccess: result => {
          console.log(`Got ${result.options.url}.`);
        },
    });
    let options = {
        url: url, 
        maxDepth: 1, 
        allowedDomains: [ domain, `www.${domain}` ]};
    await crawler.queue(options);
    console.log(`Starting crawl of ${url}...`);
    await crawler.onIdle();
    await crawler.close();
    console.log(`Found ${imageUrls.length} images...`);
    return imageUrls;
}

async function classifyImage(model, url) {
    let prediction = [];

    try {
        let imageBuffer = await getImagePixelData(url);

        if (imageBuffer) {
            let input = tfnode.node.decodeImage(imageBuffer);
            prediction = await model.classify(input);
        }
    } catch (err) {
        //console.error(err);
    }
    return prediction;
}

(async () => {
    let imageUrls = await crawlForImages('https://www.apsofdurham.org/');
    let model = await mobilenet.load();

    for (let url of imageUrls) {
        console.log(url);
        let prediction = await classifyImage(model, url);

        if (prediction) {
            console.log(`${url} -> ${JSON.stringify(prediction)}`);
        }
    }
})();