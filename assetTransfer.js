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

class DocumentContract extends Contract {
    
    // Add document to the marketplace
    async addDocumentToMarketplace(ctx, docID, title, hash, data, price, seller) {
        const privateData = await ctx.stub.getPrivateData('sellerPrivateCollection', docID);
        if (!privateData || privateData.length === 0) {
            throw new Error(`Document not found in seller's private data.`);
        }
        
        const document = {
            docID,
            title,
            hash,
            data,
            price,
            seller
        };
        
        await ctx.stub.putState(docID, Buffer.from(JSON.stringify(document)));

        // Emit an event when a document is added to the marketplace
        await ctx.stub.setEvent('DocumentAdded', Buffer.from(JSON.stringify(document)));

        return `Document ${docID} added to marketplace.`;
    }

    // Buy document from the marketplace
    async buyDocument(ctx, docID, buyer) {
        const documentBytes = await ctx.stub.getState(docID);
        if (!documentBytes || documentBytes.length === 0) {
            throw new Error(`Document ${docID} does not exist.`);
        }

        const document = JSON.parse(documentBytes.toString());
        const buyerBalance = await this.getBalance(ctx, buyer);

        if (buyerBalance < document.price) {
            throw new Error(`Insufficient balance.`);
        }

        const dataHash = this.computeHash(document.data);
        if (dataHash !== document.hash) {
            await this.updateBalance(ctx, buyer, buyerBalance + document.price);
            await ctx.stub.deleteState(docID);
            throw new Error(`Data hash mismatch. Transaction cancelled.`);
        }

        // Deduct buyer's balance and credit seller's balance
        await this.updateBalance(ctx, buyer, buyerBalance - document.price);
        const sellerBalance = await this.getBalance(ctx, document.seller);
        await this.updateBalance(ctx, document.seller, sellerBalance + document.price);

        // Transfer document to buyer's private data collection
        await ctx.stub.putPrivateData('buyerPrivateCollection', docID, Buffer.from(document.data));
        await ctx.stub.deleteState(docID);

        // Add entry to Purchase Record
        const purchaseRecord = { docID, seller: document.seller, buyer, price: document.price, hash: document.hash };
        await ctx.stub.putState(`purchase_${docID}`, Buffer.from(JSON.stringify(purchaseRecord)));

        // Emit an event for successful purchase
        await ctx.stub.setEvent('DocumentPurchased', Buffer.from(JSON.stringify(purchaseRecord)));

        return `Document ${docID} purchased successfully.`;
    }

    // Retrieve all documents in the marketplace
    async getAllDocumentsInMarketplace(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
        for await (const res of iterator) {
            results.push(JSON.parse(res.value.toString()));
        }
        return results;
    }

    // Retrieve all purchase records
    async getAllPurchaseRecords(ctx) {
        const iterator = await ctx.stub.getStateByRange('purchase_', 'purchase_\uFFFF');
        const results = [];
        for await (const res of iterator) {
            results.push(JSON.parse(res.value.toString()));
        }
        return results;
    }

    async getBalance(ctx, org) {
        const balanceData = await ctx.stub.getState(`balance_${org}`);
        return balanceData ? parseInt(balanceData.toString()) : 0;
    }

    async updateBalance(ctx, org, amount) {
        await ctx.stub.putState(`balance_${org}`, Buffer.from(amount.toString()));
    }

    computeHash(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = DocumentContract;
