import fs from "fs";

let discord_token = null;
let jobID = 1;
let finishedJobs = [];
let runningJobs = [];

class DiscordImageUploader{
    /**
     * DiscordImageUploader is a class that allows you to upload files to Discord. It will automatically handle rate limiting and other errors. It will also automatically queue jobs so you don't get rate limited.
     * @param {string} token - The Discord token to use. 
     * @param {boolean} waitForUpload - Whether or not to wait for the upload to finish before moving on to the next job. If set to false, you can upload many files very quickly, but at the risk of getting rate limited or banned. Default is true.
     * @param {number} waitTime - How long to wait between jobs if waitForUpload is set to true. This is in seconds. Default is 1 second.
     */
    constructor(token, waitForUpload = true, waitTime = 1){
        discord_token = token;
        this.jobQueue = [];
        this.isRunning = false;
        this.waitForUpload = waitForUpload;
        this.waitTime = waitTime;
    }

    /**
     * Queues a file to be uploaded to discord. Returns an object with a promise and a jobID. The promise will resolve with the URL of the uploaded file. The jobID can be used to check the status of the job.
     * @param {string} fileName - The path to the file to upload. Must be a string. Must be a valid path that fs.readFileSync can read.
     * @param {string} channel_id - The channel ID to upload to. AKA guild ID
     * @param {string} message - Optional message to send with the file
     * @returns Object with a promise and a jobID. The promise will resolve with the URL of the uploaded file. The jobID can be used to check the status of the job.
     */
    uploadFile(fileName, channel_id, message = ""){
        return {promise: new Promise(async (resolve, reject) => {
            // check for token
            if(discord_token == null) reject("No token set");
            // check if file exists
            let file = null;
            try {
                file = fs.readFileSync(fileName);
            }catch(e){
                console.log(e);
                reject(e);
            }
            if(file == null) reject("Unable to read file");
            this.jobQueue.push({
                fileName: fileName,
                channel_id: channel_id,
                message: message,
                resolve: resolve,
                reject: reject,
                status: "pending",
                id: jobID,
                url: null
            });
            if(!this.isRunning) this.run();
        }), jobID: jobID++};
    }

    /**
     * Start the queue. This is called automatically when a job is added to the queue. You should never need to call this manually.
     * @returns Nothing
     */
    async run(){
        this.isRunning = true;
        while(this.jobQueue.length > 0){
            let job = this.jobQueue.shift();
            runningJobs.push(job);
            job.status = "running";
            uploadFileToDiscordWithMessage(job.fileName, job.channel_id, job.message).then((url) => {
                job.resolve(url);
                job.status = "done";
                job.url = url;
            }).catch((e) => {
                job.reject(e);
                job.status = "failed";
            }).finally(() => {
                runningJobs.splice(runningJobs.indexOf(job), 1);
                job.resolve = null;
                job.reject = null;
                finishedJobs.push(job);
            });
            while(this.waitForUpload && job.status == "running"){
                await waitSeconds(0.5);
            }
            if(this.waitForUpload && this.jobQueue.length > 0) await waitSeconds(this.waitTime);
        }
        // this line shouldn't be necessary but just in case the async-ness catches up to us, we'll check again
        if(this.jobQueue.length == 0) this.isRunning = false;
        else this.run();
    }

    /**
     * Get a job object. 
     * @param {number} jobID - The job ID to check. Get this from the object returned by uploadFile()
     * @returns - An object containing the status of the job. The status will be one of the following: "pending", "running", "done", "failed". Also contains the URL of the uploaded file if the job is done, the file name, the message, and the channel ID.
     */
    getJob(_jobID){
        for(let i = 0; i < this.jobQueue.length; i++){
            if(this.jobQueue[i].id == _jobID) return this.jobQueue[i];
        }
        for(let i = 0; i < runningJobs.length; i++){
            if(runningJobs[i].id == _jobID) return runningJobs[i];
        }
        for(let i = 0; i < finishedJobs.length; i++){
            if(finishedJobs[i].id == _jobID) return finishedJobs[i];
        }
        return null;
    }
};

const waitSeconds = (seconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

const uploadFileToDiscordWithMessage = async (fileName, channel_id, message = "") => {
    return new Promise(async (resolve, reject) => {
        if(discord_token == null) reject("No token set");
        let file = null;
        try {
            file = fs.readFileSync(fileName);
        } catch (e) {
            console.log(e);
            reject(e);
        }
        if (file == null || file == undefined || file.length == undefined) reject("Problem with file");
        if (fileName.includes("/")) fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
        let filesize = file.length;
        let files_obj = {
            files: [
                {
                    filename: fileName,
                    file_size: filesize,
                    is_clip: false
                }
            ]
        };
        let res = await fetch("https://discord.com/api/v9/channels/" + channel_id + "/attachments", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": discord_token,
                "cache-control": "no-cache",
                "content-type": "application/json",
            },
            "body": JSON.stringify(files_obj),
            "method": "POST"
        });
        let res2 = await res.text();
        let putData = JSON.parse(res2).attachments[0];
        await waitSeconds(0.1);
        res = await fetch(putData.upload_url, {
            method: "PUT",
            body: file
        });
        res2 = await res.text();
        const payload = {
            content: message,
            channel_id: channel_id,
            type: 0,
            sticker_ids: [],
            attachments: [
                {
                    id: "0",
                    filename: fileName,
                    uploaded_filename: putData.upload_filename
                }
            ]
        };
        await waitSeconds(0.1);
        res = await fetch("https://discord.com/api/v9/channels/" + channel_id + "/messages", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "authorization": discord_token,
                "cache-control": "no-cache",
                "content-type": "application/json",
            },
            "body": JSON.stringify(payload),
            "method": "POST"
        });
        res2 = await res.text();
        res2 = JSON.parse(res2);
        if (res2.hasOwnProperty("attachments")) {
            if (res2.attachments.length > 0) {
                if (res2.attachments[0].hasOwnProperty("url")) {
                    resolve(res2.attachments[0].url);
                }
            }
        }
        reject("No URL found");
    });
};

export default DiscordImageUploader;