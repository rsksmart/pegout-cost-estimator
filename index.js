const bridgeState = require('bridge-state-data-parser');
const Web3 = require('web3');
const network = 'https://public-node.rsk.co/'; //RSK mainnet public node

let compareFunction = (a, b) => {
    let aHash = BigInt('0x' + a.btcTxHash);
    let bHash = BigInt('0x' + b.btcTxHash);
    
    return (aHash < bHash) ? -1 : ((aHash > bHash) ? 1 : (a.btcTxOutputIndex - b.btcTxOutputIndex));
}

let calculateRequiredUtxos = async(amountToPegoutInSatoshis) => {
    let web3 = new Web3(network);
    let bridgeStatus = await bridgeState(web3);
    let activeFederationUtxos = bridgeStatus.activeFederationUtxos;
    activeFederationUtxos.sort(compareFunction);

    let selectedUtxosValue = 0;
    let selectedUtxos = [];

    for (let i=0; i < activeFederationUtxos.length && selectedUtxosValue <= amountToPegoutInSatoshis; i++) {
        selectedUtxos.push(activeFederationUtxos[i]);
        selectedUtxosValue += activeFederationUtxos[i].valueInSatoshis;
    }

    if (selectedUtxosValue < amountToPegoutInSatoshis) {
        throw new Error(`Not enough utxos available in the Bridge to peg-out ${amountToPegout} satoshis`);
    }

    return selectedUtxos;
}