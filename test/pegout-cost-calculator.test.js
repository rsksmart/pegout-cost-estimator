const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const rewire = require('rewire');
const converter = require('btc-eth-unit-converter');

describe('Get peg-out cost in weis', () => {

    let pegoutCostCalculator;
    let sandbox;
    let pegoutTxsSizeInBytes = { // Size according to the amount of inputs, info extracted from past peg-out transactions
        1: 513,
        2: 950,
        3: 1386,
        4: 1822
    };
    let feePerKb = 100000;

    const bridgeStateStub = () => Promise.resolve(
        {
            activeFederationUtxos: [
                {
                    btcTxHash: 'abc2000000000000000000000000000000000000000000000000000000000000',
                    btcTxOutputIndex: 0,
                    valueInSatoshis: 200 
                },
                {
                    btcTxHash: 'abc2000000000000000000000000000000000000000000000000000000000000',
                    btcTxOutputIndex: 1,
                    valueInSatoshis: 100 
                },
                {
                    btcTxHash: 'abc3000000000000000000000000000000000000000000000000000000000000',
                    btcTxOutputIndex: 1,
                    valueInSatoshis: 500 
                },
                {
                    btcTxHash: 'abc1000000000000000000000000000000000000000000000000000000000000',
                    btcTxOutputIndex: 1,
                    valueInSatoshis: 1000 
                }
            ]
        }
    );
    

    const bridgeInstanceStub = {
        methods: ({
            getFeePerKb: () => ({
                call: () => Promise.resolve(feePerKb)
            })
        })
    }

    const bridgeStub = {
        build: () => {
            return bridgeInstanceStub
        }
    }

    const federationDetailsStub = () => Promise.resolve(
        {
            federationThreshold: 3,
            redeemScript: '5321023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da2102afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da21031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a2210344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a0921039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb955ae'
        }
    );

    beforeEach((done) => {
        pegoutCostCalculator = rewire('../pegout-cost-calculator');
        pegoutCostCalculator.__set__({
            'bridgeState': bridgeStateStub,
            'federationDetails': federationDetailsStub,
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('Should calculate peg-out cost, for transaction with 1 input and 2 outputs', async () => {
        let minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] - 5) * feePerKb / 1000;
        let maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] + 5) * feePerKb / 1000;

        let pegoutCostInWeis = await pegoutCostCalculator.calculatePegoutCostInWeis('testnet', 800);
        
        expect(pegoutCostInWeis).to.be.at.least(converter.satoshisToWeis(minExpectedCostInSatoshis));
        expect(pegoutCostInWeis).to.be.at.most(converter.satoshisToWeis(maxExpectedCostInSatoshis));
    });

    it('Should calculate peg-out cost, for transaction with 2 inputs and 2 outputs', async () => {
        let minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] - 10) * feePerKb / 1000;
        let maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] + 10) * feePerKb / 1000;

        let pegoutCostInWeis = await pegoutCostCalculator.calculatePegoutCostInWeis('testnet', 1150);
        
        expect(pegoutCostInWeis).to.be.at.least(converter.satoshisToWeis(minExpectedCostInSatoshis));
        expect(pegoutCostInWeis).to.be.at.most(converter.satoshisToWeis(maxExpectedCostInSatoshis));
    });

    it('Should calculate peg-out cost, for transaction with 3 inputs and 2 outputs', async () => {
        let minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] - 12) * feePerKb / 1000;
        let maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] + 12) * feePerKb / 1000;

        let pegoutCostInWeis = await pegoutCostCalculator.calculatePegoutCostInWeis('testnet', 1250);
        
        expect(pegoutCostInWeis).to.be.at.least(converter.satoshisToWeis(minExpectedCostInSatoshis));
        expect(pegoutCostInWeis).to.be.at.most(converter.satoshisToWeis(maxExpectedCostInSatoshis));
    });

    it('Should calculate peg-out cost, for transaction with 4 inputs and 2 outputs', async () => {
        let minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] - 15) * feePerKb / 1000;
        let maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] + 15) * feePerKb / 1000;

        let pegoutCostInWeis = await pegoutCostCalculator.calculatePegoutCostInWeis('testnet', 1400);
        
        expect(pegoutCostInWeis).to.be.at.least(converter.satoshisToWeis(minExpectedCostInSatoshis));
        expect(pegoutCostInWeis).to.be.at.most(converter.satoshisToWeis(maxExpectedCostInSatoshis));
    });
});
