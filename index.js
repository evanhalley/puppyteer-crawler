'use strict';

const HCCrawler = require('headless-chrome-crawler');
const request = require('request');
const fs = require('fs');

function saveImage(url) {
    let file = fs.createWriteStream(`./tmp/${new Date().getTime()}.jpg`);
    request(url).pipe(file).on('close', () => {});
}

(async () => {
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
        maxDepth: 3, 
        allowedDomains: [ 'www.apsofdurham.org' ],
        followSitemapXml: true });
    await crawler.onIdle(); // Resolved when no queue is left
    await crawler.close(); // Close the crawler
  })();
