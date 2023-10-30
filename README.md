# DiscordImageUploader
Upload images to Discord using the Discord API. This is a simple node.js module that allows you to upload images to Discord using their API. This module is useful for Discord bot developers who wish to upload images to Discord using their bot. This module is also useful for people who wish to upload images to Discord without using their web browser.

## Installation
```
npm i discordimageuploader
```

## Usage
When you instantiate a new DiscordImageUploader, it requires a token. This can be a user token or a bot token. If you don't know how to get a token, look it up on Google. I'm not going to explain it here. You can also pass in a boolean value to the constructor to tell it whether or not to wait for the upload to finish before moving on to the next job. If you set this to false, you can upload many files very quickly, but at the risk of getting rate limited or banned. The default is true. You can also pass in a number to tell it how long to wait between jobs if waitForUpload is set to true. This is in seconds. The default is 1 second.
```js
const DiscordImageUploader = require('discordimageuploader');


/**
 * @param {string} token - The Discord token to use. 
 * @param {boolean} waitForUpload - Whether or not to wait for the upload to finish before moving on to the next job. If set to false, you can upload many files very quickly, but at the risk of getting rate limited or banned. Default is true.
 * @param {number} waitTime - How long to wait between jobs if waitForUpload is set to true. This is in seconds. Default is 1 second.
 */
var uploader = DiscordImageUploader("YOUR_DISCORD_TOKEN_HERE", waitForUpload = true, waitTime = 1);

uploader.uploadFile("test.jpg", "1159893559839830090", "Test message").then((job) => {
    // job is an object that contains the jobID and a promise that resolves to the URL of the uploaded image.
    console.log("Job: ", job);
    job.promise.then((url) => {
        console.log("URL: ", url, "\njobID: ", job.jobID);
        console.log(uploader.getJob(job.jobID));
    }).catch((e) => {
        console.log("Error: ", e);
    });
}).catch((e) => {
    console.log("Error: ", e);
});

let job = getJob(jobID); // Returns the job object with the specified jobID.
```

## Example
This example will upload 1 image to Discord 10 times. It's basically the same as the code above.
```js
const fs = require('fs');

const DiscordImageUploader = require("DiscordImageUploader");

uploader = new DiscordImageUploader("YOUR_DISCORD_TOKEN_HERE");

// This example will upload 1 image to Discord 10 times.
const doStuff = async () => {
    for (let i = 1; i <= 10; i++) {
        uploader.uploadFile("test.jpg", "1159893559839830090", "Test message: " + i).then((job) => {
            console.log("Job: ", job);
            job.promise.then((url) => {
                console.log("URL: ", url, "\njobID: ", job.jobID);
                console.log(uploader.getJob(job.jobID));
            }).catch((e) => {
                console.log("Error: ", e);
            });
        }).catch((e) => {
            console.log("Error: ", e);
        });
    }
};

doStuff();
while(true) {}
```

## License
GPL-3.0 License - Look up the license on the [GNU website](https://www.gnu.org/licenses/gpl-3.0.en.html).
My take on it is this: if you use, modify or redistribute this code, you must make your code open source and you must give credit to me. Don't steal it. Don't be a jerk.

## Contributing
If you wish to contribute to this project, feel free to make a pull request. I'm not much of a programmer, so if you see something that can be improved, please let me know. I'm always open to suggestions. Feel free to submit an issue if you find a bug or if you have a suggestion.
