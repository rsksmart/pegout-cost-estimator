const bridgeState = require('bridge-state-data-parser');
const powpegDetails = require('powpeg-details');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const converter = require('btc-eth-unit-converter');

let compareFunction = (a, b) => {
    const aHash = BigInt('0x' + a.btcTxHash);
    const bHash = BigInt('0x' + b.btcTxHash);
    
    return (aHash < bHash) ? -1 : ((aHash > bHash) ? 1 : (a.btcTxOutputIndex - b.btcTxOutputIndex));
}

const calculateRequiredUtxos = async(amountToPegoutInSatoshis, web3) => {
    const bridgeStatus = await bridgeState(web3);
    const activeFederationUtxos = bridgeStatus.activeFederationUtxos;
    activeFederationUtxos.sort(compareFunction);

    let selectedUtxosValue = 0;
    let selectedUtxos = [];

    for (let i=0; i < activeFederationUtxos.length && selectedUtxosValue <= amountToPegoutInSatoshis; i++) {
        selectedUtxos.push(activeFederationUtxos[i]);
        selectedUtxosValue += activeFederationUtxos[i].valueInSatoshis;
    }

    if (selectedUtxosValue < amountToPegoutInSatoshis) {
        throw new Error(`Not enough utxos available in the Bridge to peg-out ${amountToPegoutInSatoshis} satoshis`);
    }

    return selectedUtxos;
}

const estimatePegOutTxSizeInBytes = (inputsAmount, outputsAmount, signaturesNeeded, federationRedeemScript) => {
    // A regular peg-out transaction has two outputs, one for the receiver and the change output
    // Each input has M/N signatures and each signature is around 71 bytes long (signed sighash)
    // The outputs are composed of the scriptPubkeyHash (or publicKeyHash)
    // and the op_codes for the corresponding script
    const signatureSize = 72; // 1 byte for size and 71 for the signature
    const federationRedeemScriptSizeInBytes = federationRedeemScript.length / 2 + 1; // 1 extra byte for size
    const additionalScriptSigDataSize = 2; // 1 byte for OP_0 at the beginnig and 1 for OP_PUSHDATA before the redeem script
    const scriptSigSize = signaturesNeeded * signatureSize + federationRedeemScriptSizeInBytes + additionalScriptSigDataSize;

    const additionalTxDataSize = 10; // 4 bytes for version field, 1 for inputs counts, 1 for outputs count, 4 for lock_time
    const additionalInputDataSize = 40; // txid+vout+sequence
    const outputSize = 26; // 1 byte for size and 25 for scriptPubkeyHash (or publicKeyHash)
    const additionalOutputDataSize = 9; // value+index

    return additionalTxDataSize + 
        (scriptSigSize + additionalInputDataSize) * inputsAmount +
        (outputSize + additionalOutputDataSize) * outputsAmount;
}

const estimatePegoutTxFeesInSatoshis = async(amountToPegoutInSatoshis, web3, networkSettings) => {
    const bridge = Bridge.build(web3);
    const federationInformation = await powpegDetails(web3, networkSettings);
    const feePerKb = await bridge.methods.getFeePerKb().call();

    let satoshisNeededToCoverPegoutAndFees = amountToPegoutInSatoshis;
    let pegoutTxFeesInSatoshis;
    let utxosCoverFees = false;
    while (!utxosCoverFees) {
        const selectedUtxos = await calculateRequiredUtxos(satoshisNeededToCoverPegoutAndFees, web3);
        const pegOutTxSizeInBytes = estimatePegOutTxSizeInBytes(
            selectedUtxos.length, 
            2, 
            federationInformation.federationThreshold, 
            federationInformation.redeemScript
        );

        const selectedUtxosTotalValue = selectedUtxos.reduce((sum, utxo) => sum + utxo.valueInSatoshis, 0);
        pegoutTxFeesInSatoshis = pegOutTxSizeInBytes * feePerKb / 1000;

        satoshisNeededToCoverPegoutAndFees = amountToPegoutInSatoshis + pegoutTxFeesInSatoshis;
        utxosCoverFees = selectedUtxosTotalValue >= satoshisNeededToCoverPegoutAndFees;
    }

    return pegoutTxFeesInSatoshis;
}

const estimatePegoutCostInWeis = async(amountToPegoutInSatoshis, web3, networkSettings) => {
    const pegoutTxFeeInSatoshis = await estimatePegoutTxFeesInSatoshis(amountToPegoutInSatoshis, web3, networkSettings);

    return converter.satoshisToWeis(Number(pegoutTxFeeInSatoshis) + Number(amountToPegoutInSatoshis));
}

const estimatePegoutValueInSatoshis = async(amountToPegoutInWeis, web3, networkSettings) => {
    const amountToPegoutInSatoshis = converter.weisToSatoshis(amountToPegoutInWeis);
    const pegoutTxFeeInSatoshis = await estimatePegoutTxFeesInSatoshis(amountToPegoutInSatoshis, web3, networkSettings);

    return Number(amountToPegoutInSatoshis) - Number(pegoutTxFeeInSatoshis);
}

const setUtxoSortingMethod = (_compareFunction) => {
    compareFunction = _compareFunction;
}

module.exports = {
    estimatePegoutCostInWeis,
    estimatePegoutValueInSatoshis,
    setUtxoSortingMethod
}
