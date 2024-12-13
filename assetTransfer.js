/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');


async function AddBalance(ctx) {
    const transientData = ctx.stub.getTransient();
    const amount = parseFloat(transientData.get('amount').toString());

    const orgId = ctx.clientIdentity.getMSPID();
    const balanceBytes = await ctx.stub.getState(orgId);
    const currentBalance = balanceBytes.length ? parseFloat(balanceBytes.toString()) : 0;

    const newBalance = currentBalance + amount;
    await ctx.stub.putState(orgId, Buffer.from(newBalance.toString()));
}
async function AddDocument(ctx) {
    const transientData = ctx.stub.getTransient();
    const docID = transientData.get('docID').toString();
    const docTitle = transientData.get('docTitle').toString();
    const docData = transientData.get('docData').toString();
    const price = parseFloat(transientData.get('price').toString());

    const docHash = crypto.createHash('sha256').update(docData).digest('hex');
    const orgId = ctx.clientIdentity.getMSPID();

    const document = {
        ID: docID,
        Title: docTitle,
        Data: docData,
        DataHash: docHash,
        Price: price
    };

    await ctx.stub.putPrivateData(orgId, docID, Buffer.from(JSON.stringify(document)));
}
async function GetBalance(ctx) {
    const orgId = ctx.clientIdentity.getMSPID();
    const balanceBytes = await ctx.stub.getState(orgId);
    const balance = balanceBytes.length ? parseFloat(balanceBytes.toString()) : 0;
    return balance.toString();
}
async function UpdateDocument(ctx, docID, newDocData, updateHash) {
    const orgId = ctx.clientIdentity.getMSPID();
    const documentBytes = await ctx.stub.getPrivateData(orgId, docID);
    
    if (!documentBytes || documentBytes.length === 0) {
        throw new Error(`Document ${docID} does not exist.`);
    }

    const document = JSON.parse(documentBytes.toString());
    document.Data = newDocData;

    if (updateHash) {
        document.DataHash = crypto.createHash('sha256').update(newDocData).digest('hex');
    }

    await ctx.stub.putPrivateData(orgId, docID, Buffer.from(JSON.stringify(document)));
}
async function GetAllDocuments(ctx) {
    const orgId = ctx.clientIdentity.getMSPID();
    const iterator = await ctx.stub.getPrivateDataByRange(orgId, '', '');
    const results = [];
    
    let result = await iterator.next();
    while (!result.done) {
        const docValue = Buffer.from(result.value.value.toString()).toString('utf8');
        results.push(JSON.parse(docValue));
        result = await iterator.next();
    }
    
    return JSON.stringify(results);
}
async function GetDocument(ctx, docID) {
    const orgId = ctx.clientIdentity.getMSPID();
    const documentBytes = await ctx.stub.getPrivateData(orgId, docID);
    
    if (!documentBytes || documentBytes.length === 0) {
        throw new Error(`Document ${docID} does not exist.`);
    }

    return documentBytes.toString();
}


module.exports = AssetTransfer;