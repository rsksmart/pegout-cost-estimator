const rskNetworkSettings = require('rsk-network-settings');
const networkParser = require('./network-parser');
const pegoutCostEstimator = require('../pegout-cost-estimator');
const Web3 = require('web3');

(async () => {
    try {
        let network = process.argv[2];
        let web3 = new Web3(networkParser(network));
        let networkSettings = rskNetworkSettings.getNetworkSettingsForThisNetwork(network);
        
        let amountToPegoutInSatoshis = process.argv[3];
        if (isNaN(amountToPegoutInSatoshis)) {
            throw new Error('Need to provide a numeric value for the amount to pegout in satoshis');
        }
        let pegoutCostInWeis = BigInt(await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis, web3, networkSettings));
        console.log(`In order to receive ${amountToPegoutInSatoshis} satoshis, the user needs to send approximately ${pegoutCostInWeis} weis to the bridge`);
    } catch (e) {
        console.log(e);
    }
})();