require('dotenv').config();
const { BlobServiceClient } = require('@azure/storage-blob');
const { getReadStreamForFile } = require('../file-service/file-reader');
const path = require('path');

const connectionString = process.env.CONNECTION_STRING;
const blobContainerName = process.env.BLOB_CONTAINER;
const blob = process.env.BLOB;
const filePath = path.join('resources', 'MOCK_DATA_WITH_NAME_AND_DATETIME.csv');

const getBlockBlobClient = async(blob) => {
    const containerClient = await getContainerClient();
    console.log('fetching blob client for blob', blob);
    return containerClient.getBlockBlobClient(blob);
}

const getContainerClient = async() => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(blobContainerName);
    var containerExists = await containerClient.exists();
    if (!containerExists) {
        console.log('creating new container', blobContainerName);
        await containerClient.create();
    }
    console.log('fetched container', containerClient.containerName);

    return containerClient;
}

const uploadToBlobStorage = async(blob, path) => {
    const data = await getReadStreamForFile(path);
    const blockBlobClient = await getBlockBlobClient(blob);
    console.log('uploading to blob', blob);
    return await blockBlobClient.uploadStream(data);
}

const downloadFromBlobStorage = async(blob) => {
    const blockBlobClient = await getBlockBlobClient(blob);
    const blobExists = await blockBlobClient.exists();
    if (!blobExists) {
        throw new Error("Cannot download content - Reason: Blob does not exist")
    }

    const blobContentBuffer = await blockBlobClient.downloadToBuffer();
    return blobContentBuffer.toString('utf-8');
}

const deleteAllBlobsInContainer = async() => {
    const containerClient = await getContainerClient();
    const blobItems = containerClient.listBlobsFlat();
    for await (const blob of blobItems) {
        console.log('deleting blob', blob.name);
        const blobClient = containerClient.getBlobClient(blob.name);
        blobClient.delete();
    }
}

// uploadToBlobStorage(blob, filePath)
//     .then(res => {
//         if (res) console.log(`Blob upload success`, new Date())
//     })
//     .catch(err => console.log(`ERROR ${err}`));

// downloadFromBlobStorage(blob)
//     .then(res => console.log(`Blob Content :- ${res}`))
//     .catch(err => console.log(`Error :- ${err}`));

// deleteAllBlobsInContainer(blob);

module.exports = { uploadToBlobStorage, downloadFromBlobStorage, deleteAllBlobsInContainer };
