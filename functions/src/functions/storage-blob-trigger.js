const { app } = require('@azure/functions');
const { fetchBlockBlobClient, processBLOBAndPushToQueue } = require('../../utils/blob-storage-util');
require('dotenv').config();

const blobContainer = process.env.BLOB_CONTAINER;

app.storageBlob('storage-blob-trigger', {
    path: `${blobContainer}/{name}`,
    connection: 'AzureWebJobsStorage',
    handler: async (blob, context) => {
        context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes`);
        const blockBlobClient = await fetchBlockBlobClient(context.triggerMetadata.name);
        const blobContentBuffer = await blockBlobClient.downloadToBuffer(0);
        processBLOBAndPushToQueue(blobContentBuffer.toString().trim())
            .then(() => console.log("BLOB processed successfully"))
            .catch((err) => console.log(`ERROR => ${err}`));
    }
});
