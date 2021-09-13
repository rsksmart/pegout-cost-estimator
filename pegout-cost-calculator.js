const bridgeState = require('bridge-state-data-parser');
const powpegDetails = require('powpeg-details');
const Web3 = require('web3');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const converter = require('btc-eth-unit-converter');

let compareFunction = (a, b) => {
    let aHash = BigInt('0x' + a.btcTxHash);
    let bHash = BigInt('0x' + b.btcTxHash);
    
    return (aHash < bHash) ? -1 : ((aHash > bHash) ? 1 : (a.btcTxOutputIndex - b.btcTxOutputIndex));
}

let calculateRequiredUtxos = async(amountToPegoutInSatoshis, web3) => {
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

let calculatePegoutCostInWeis = async(amountToPegoutInSatoshis, web3, networkSettings) => {
    let pegoutTxFeeInSatoshis = await calculatePegoutTxFeesInSatoshis(amountToPegoutInSatoshis, web3, networkSettings);

    return converter.satoshisToWeis(pegoutTxFeeInSatoshis + amountToPegoutInSatoshis);
}

let calculatePegoutValueInSatoshis = async(amountToPegoutInWeis, web3, networkSettings) => {
    let amountToPegoutInSatoshis = converter.weisToSatoshis(amountToPegoutInWeis);
    let pegoutTxFeeInSatoshis = await calculatePegoutTxFeesInSatoshis(amountToPegoutInSatoshis, web3, networkSettings);

    return amountToPegoutInSatoshis - pegoutTxFeeInSatoshis;
}

let calculatePegOutTxSizeInBytes = (inputsAmount, outputsAmount, signaturesNeeded, federationRedeemScript) => {
    // A regular peg-out transaction has two outputs, one for the receiver and the change output
    // Each input has M/N signatures and each signature is around 71 bytes long (signed sighash)
    // The outputs are composed of the scriptPubkeyHash (or publicKeyHash)
    // and the op_codes for the corresponding script
    let signatureSize = 72; // 1 byte for size and 71 for the signature
    let federationRedeemScriptSizeInBytes = federationRedeemScript.length / 2 + 1; // 1 extra byte for size
    let additionalScriptSigDataSize = 2; // 1 byte for OP_0 at the beginnig and 1 for OP_PUSHDATA before the redeem script
    let scriptSigSize = signaturesNeeded * signatureSize + federationRedeemScriptSizeInBytes + additionalScriptSigDataSize;

    let additionalTxDataSize = 10; // 4 bytes for version field, 1 for inputs counts, 1 for outputs count, 4 for lock_time
    let additionalInputDataSize = 40; // txid+vout+sequence
    let outputSize = 26; // 1 byte for size and 25 for scriptPubkeyHash (or publicKeyHash)
    let additionalOutputDataSize = 9; // value+index

    return additionalTxDataSize + 
        (scriptSigSize + additionalInputDataSize) * inputsAmount +
        (outputSize + additionalOutputDataSize) * outputsAmount;
}

let calculatePegoutTxFeesInSatoshis = async(amountToPegoutInSatoshis, web3, networkSettings) => {
    const bridge = Bridge.build(web3);
    
    let selectedUtxos = await calculateRequiredUtxos(amountToPegoutInSatoshis, web3);
    let federationInformation = await powpegDetails(web3, networkSettings);

    let pegOutTxSizeInBytes = calculatePegOutTxSizeInBytes(selectedUtxos.length, 2, federationInformation.federationThreshold, federationInformation.redeemScript);
    let feePerKb = await bridge.methods.getFeePerKb().call();
    
    return pegOutTxSizeInBytes * feePerKb / 1000;
}

module.exports = {
    calculatePegoutCostInWeis,
    calculatePegoutValueInSatoshis
}
