/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 PART (A) */

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
// Read user commands from the terminal
const command = process.argv[2];

switch (command) {
    case 'ADD_MONEY':
        const amount = parseFloat(process.argv[3]);
        await addMoney(contract, amount);
        break;

    case 'ADD_DOC':
        const docID = process.argv[3];
        const docTitle = process.argv[4];
        const docData = process.argv[5];
        const price = parseFloat(process.argv[6]);
        await addDocument(contract, docID, docTitle, docData, price);
        break;

    case 'QUERY_BALANCE':
        await queryBalance(contract);
        break;

    case 'UPDATE_DOC_DATA':
        const idToUpdate = process.argv[3];
        const newDocData = process.argv[4];
        const updateHash = process.argv[5] === 'true';
        await updateDocument(contract, idToUpdate, newDocData, updateHash);
        break;

    case 'GET_ALL_DOCS':
        await getAllDocuments(contract);
        break;

    case 'GET_DOC':
        const docToGet = process.argv[3];
        await getDocument(contract, docToGet);
        break;

    default:
        console.log('Invalid command!');
        break;
}
        
    } finally {
        gateway.close();
        client.close();
    }
}

main().catch((error) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});
async function addMoney(contract, amount) {
    const transientData = { amount: Buffer.from(amount.toString()) };
    await contract.createTransaction('AddBalance').setTransient(transientData).submit();
    console.log(`Added ${amount} to account balance.`);
}

async function addDocument(contract, docID, docTitle, docData, price) {
    const transientData = {
        docID: Buffer.from(docID),
        docTitle: Buffer.from(docTitle),
        docData: Buffer.from(docData),
        price: Buffer.from(price.toString())
    };
    await contract.createTransaction('AddDocument').setTransient(transientData).submit();
    console.log(`Added document ${docID}.`);
}

async function queryBalance(contract) {
    const result = await contract.evaluateTransaction('GetBalance');
    console.log(`Account balance: ${result.toString()}`);
}

async function updateDocument(contract, docID, newDocData, updateHash) {
    const transientData = { newDocData: Buffer.from(newDocData) };
    await contract.createTransaction('UpdateDocument').setTransient(transientData).submit(docID, newDocData, updateHash.toString());
    console.log(`Updated document ${docID}.`);
}

async function getAllDocuments(contract) {
    const result = await contract.evaluateTransaction('GetAllDocuments');
    console.log(`Documents: ${result.toString()}`);
}

async function getDocument(contract, docID) {
    const result = await contract.evaluateTransaction('GetDocument', docID);
    console.log(`Document details: ${result.toString()}`);
}

