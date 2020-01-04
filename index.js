'use strict';

const HCCrawler = require('headless-chrome-crawler');
const request = require('request');
const tf = require('@tensorflow/tfjs');
const tfnode = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const extractDomain = require('extract-domain');
const chalk = require('chalk');
const args = require('yargs').argv;
const progress = require('cli-progress');

(async () => {
    let url = args.url;
    let query = args.query;
    let depth = args.depth;

    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    console.log(`Searching ${chalk.green(url)} for images containg a ${chalk.green(query)}...`);

    let imageUrls = await crawlForImages(url, depth);
    let classifications = await processImages(imageUrls);
    let urlsThatMatch = classifications[query];

    if (urlsThatMatch && urlsThatMatch.size > 0) {
        console.log(`Images that contain a ${query}`);

        for (let match of urlsThatMatch.values()) {
            console.log(match);
        }
    } else {
        console.log('No matches found');
    }
})();

async function processImages(imageUrls) {
    console.log(`Classifying ${imageUrls.size} images...`);
    let bar = new progress.SingleBar({}, progress.Presets.shades_classic);
    let imageToPredictionMap = {};
    let model = await cocoSsd.load({ base: 'mobilenet_v2' });
    bar.start(imageUrls.size, 0);
    let i = 0;

    for (let imageUrl of imageUrls.values()) {
        let predictions = await classifyImage(model, imageUrl);

        for (let prediction of predictions) {

            if (prediction.class in imageToPredictionMap) {
                let urls = imageToPredictionMap[prediction.class];
                urls.add(imageUrl);
                imageToPredictionMap[prediction.class] = urls;
            } else {
                let urlSet = new Set();
                urlSet.add(imageUrl);
                imageToPredictionMap[prediction.class] = urlSet;
            }
        }
        bar.update(++i);
    }
    bar.stop();
    return imageToPredictionMap;
}

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

async function crawlForImages(url, depth) {
    let domain = extractDomain(url);
    console.log(`The domain for the URL is ${domain}...`);
    let imageUrls = new Set();
    let numUrlsCrawled = 0;

    let crawler = await HCCrawler.launch({

        customCrawl: async (page, crawl) => {
            await page.setRequestInterception(true);

            page.on('request', request => {
                let requestUrl = request.url();
                
                if (request.resourceType() == 'image' && !imageUrls.has(requestUrl)) {
                    imageUrls.add(requestUrl);
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
          numUrlsCrawled++;
        },
    });
    let options = {
        url: url, 
        maxDepth: depth, 
        allowedDomains: [ domain, `www.${domain}` ]};
    await crawler.queue(options);
    console.log(`Starting crawl of ${url}...`);
    await crawler.onIdle();
    await crawler.close();
    console.log(`Crawled ${numUrlsCrawled} urls and found ${imageUrls.size} images...`);
    return imageUrls;
}

async function classifyImage(model, url) {
    let prediction = [];

    try {
        let imageBuffer = await getImagePixelData(url);

        if (imageBuffer) {
            let input = tfnode.node.decodeImage(imageBuffer);
            prediction = await model.detect(input);
        }
    } catch (err) {
        //console.error(err);
    }
    return prediction;
}