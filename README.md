# puppyteer-crawler

Crawls a website for pictures of big dogs, little dogs, red dogs, blue dogs, yellow dogs, green dogs, black dogs, and white dogs!

## Get Up and Running

Step 1 - Clone the repository

```
git clone git@github.com:evanhalley/puppyteer-crawler.git
```

Step 2 - Download the dependencies

```
cd puppyteer-crawler
npm install
```

Step 3 - Find the photos of dogs

```
node . --url=spcawake.org --depth=1 --query=dog
```

Output

```
Searching https://spcawake.org for images containing a dog...
The domain for the URL is spcawake.org...
Starting crawl of https://spcawake.org...
Crawled 1 urls and found 25 images...
Classifying 25 images...
 ████████████████████████████████████████ 100% | ETA: 0s | 25/25
Images that contain a dog
https://spcawake.org/wp-content/uploads/2019/11/Clinic-Banner-2-820x461.jpg
https://spcawake.org/wp-content/uploads/2019/03/Dog-for-website.jpg
https://spcawake.org/wp-content/uploads/2019/03/volunteer-website-pic.jpg
https://spcawake.org/wp-content/uploads/2019/12/Social-Dog-250x250.jpg
https://spcawake.org/wp-content/uploads/2019/12/Alhanna-for-blog-v2-250x250.jpg
```