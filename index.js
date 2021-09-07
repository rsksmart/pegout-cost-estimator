const pegoutCostCalculator = require('./pegout-cost-calculator');

module.exports = (network, amount) => {
    let pegoutCostInWeis = await pegoutCostCalculator.calculatePegoutCostInWeis(amount);
    let pegoutValueInSatoshis = await pegoutCostCalculator.calculatePegoutValueInSatoshis(amount);

    console.log(`The pegout of ${amount} satoshis in ${network} will have an approximate cost of ${pegoutCostInWeis} weis`);
    console.log(`The pegout of ${amount} weis in ${network} will result in ${pegoutValueInSatoshis} satoshis after fees`);
}