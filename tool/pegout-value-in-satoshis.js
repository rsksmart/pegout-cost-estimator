const rskNetworkSettings = require('rsk-network-settings');
const networkParser = require('./network-parser');
const pegoutCostEstimator = require('../pegout-cost-estimator');
const Web3 = require('web3');

(async () => {
    try {
        let network = process.argv[2];
        let web3 = new Web3(networkParser(network));
        let networkSettings = rskNetworkSettings.getNetworkSettingsForThisNetwork(network);
        
        let amountToPegoutInWeis = process.argv[3];
        if (isNaN(amountToPegoutInWeis)) {
            throw new Error('Need to provide a numeric value for the amount to pegout in weis');
        }
        let pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis, web3, networkSettings);
        console.log(`By sending ${amountToPegoutInWeis} weis to the bridge, the user will receive approximately ${pegoutValueInSatoshis} satoshis`);
    } catch (e) {
        console.log(e);
    }
})();