const fs = require('fs');
const ethers = require('ethers');
const config = require('./config.json');

const provider = (config.rpc.toLowerCase().includes("ws://") || config.rpc.toLowerCase().includes("wss://")) ? new ethers.WebSocketProvider(config.rpc, { name: "Base Mainnet", chainId: 8453 }) : new ethers.JsonRpcProvider(config.rpc);

const isFirstBuy = (txData) => {
    let { nonce, from, data, to } = txData
    if (!data || !to) return;

    // the tx sould be it first tx
    let firstTx = nonce == 0;
    // check the tx buying a key from signer 
    let shareToFrom = data.toLowerCase().includes(from.substring(2).toLowerCase());
    // amount should be 1 key
    let dataAmount = data.substring(data.length - 1) == 1;
    // tx to friend.tech contract address
    let toFriendTech = to.toLowerCase() == config.friendTechAddress.toLowerCase();

    // check if all requirements passed
    return (firstTx && toFriendTech && shareToFrom && dataAmount);
}

(async () => {

    // Listen to block update, since Base had no mempool can't listen the pending txs
    provider.on("block", async (blockNumber) => {

        // Extracting data from block
        let blockData = await provider.getBlock(blockNumber, true);

        // Get transactions from the block
        let blockTxs = blockData.prefetchedTransactions.filter(tx => (isFirstBuy(tx)));

        if (blockTxs.length < 1) return;

        for await (const tx of blockTxs) {
            let address = tx.from
            console.log(`${address} key is buy able.`)
        }
    });
})();