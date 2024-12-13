/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
);

// Path to user private key directory.
const keyDirectoryPath = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore'
    )
);

// Path to user certificate directory.
const certDirectoryPath = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts'
    )
);

// Path to peer tls certificate.
const tlsCertPath = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
);

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();
const assetId = `asset${String(Date.now())}`;

async function main() {
    displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        hash: hash.sha256,
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'ENLIST_DOC':
            const [docID, title, dataHash, data, price, seller] = args.slice(1);
            await contract.submitTransaction('addDocumentToMarketplace', docID, title, dataHash, data, price, seller);
            console.log(`Document ${docID} added to marketplace.`);
            break;

        case 'WISHLIST':
            const wishlistDocID = args[1];
            wishlist.push(wishlistDocID);
            console.log(`Document ${wishlistDocID} added to wishlist.`);
            break;

        case 'ALL_DOCS':
            const allDocs = await contract.evaluateTransaction('getAllDocumentsInMarketplace');
            console.log(`Marketplace documents: ${allDocs.toString()}`);
            break;

        case 'ALL_RECORDS':
            const allRecords = await contract.evaluateTransaction('getAllPurchaseRecords');
            console.log(`Purchase records: ${allRecords.toString()}`);
            break;

        default:
            console.log('Unknown command');
    }
    // Listen for DocumentAdded events
    const listener = async (event) => {
        if (event.eventName === 'DocumentAdded') {
            const eventPayload = JSON.parse(event.payload.toString());
            if (wishlist.includes(eventPayload.docID)) {
                console.log(`Document ${eventPayload.docID} is in wishlist. Triggering purchase...`);
                try {
                    await contract.submitTransaction('buyDocument', eventPayload.docID, 'Org1User');
                    console.log(`Purchased document ${eventPayload.docID} from marketplace.`);
                } catch (err) {
                    console.error(`Failed to purchase document ${eventPayload.docID}: ${err.message}`);
                }
            }
        }
    };
    await network.addBlockListener(listener);

    } finally {
        gateway.close();
        client.close();
    }
}

main().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

