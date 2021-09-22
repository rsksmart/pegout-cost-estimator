const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const rewire = require('rewire');
const converter = require('btc-eth-unit-converter');

let pegoutCostEstimator;
let sandbox;
const pegoutTxsSizeInBytes = { // Size according to the amount of inputs, info extracted from past peg-out transactions
    1: 513,
    2: 950,
    3: 1386,
    4: 1822
};
const feePerKb = 100000;

const bridgeStateStub = () => Promise.resolve(
    {
        activeFederationUtxos: [
            {
                btcTxHash: 'abc2000000000000000000000000000000000000000000000000000000000000',
                btcTxOutputIndex: 0,
                valueInSatoshis: 20000 
            },
            {
                btcTxHash: 'abc2000000000000000000000000000000000000000000000000000000000000',
                btcTxOutputIndex: 1,
                valueInSatoshis: 10000 
            },
            {
                btcTxHash: 'abc3000000000000000000000000000000000000000000000000000000000000',
                btcTxOutputIndex: 1,
                valueInSatoshis: 50000 
            },
            {
                btcTxHash: 'abc1000000000000000000000000000000000000000000000000000000000000',
                btcTxOutputIndex: 1,
                valueInSatoshis: 100000 
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

const powpegDetailsStub = () => Promise.resolve(
    {
        federationThreshold: 3,
        redeemScript: '5321023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da2102afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da21031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a2210344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a0921039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb955ae'
    }
);

describe('Get peg-out cost in weis', () => {

    beforeEach((done) => {
        pegoutCostEstimator = rewire('../pegout-cost-estimator');
        pegoutCostEstimator.__set__({
            'bridgeState': bridgeStateStub,
            'powpegDetails': powpegDetailsStub,
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('Should estimate peg-out cost, for transaction with 1 input and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 80000;
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] - 5) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] + 5) * feePerKb / 1000;

        const pegoutCostInWeis = await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis);
        
        expect(pegoutCostInWeis).to.be.within(
            converter.satoshisToWeis(amountToPegoutInSatoshis + minExpectedCostInSatoshis), 
            converter.satoshisToWeis(amountToPegoutInSatoshis + maxExpectedCostInSatoshis)
        );
    });

    it('Should estimate peg-out cost, for transaction with 2 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 115000;
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] - 10) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] + 10) * feePerKb / 1000;

        const pegoutCostInWeis = await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis);
        
        expect(pegoutCostInWeis).to.be.within(
            converter.satoshisToWeis(amountToPegoutInSatoshis + minExpectedCostInSatoshis), 
            converter.satoshisToWeis(amountToPegoutInSatoshis + maxExpectedCostInSatoshis)
        );
    });

    it('Should estimate peg-out cost, for transaction with 3 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 125000;
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] - 12) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] + 12) * feePerKb / 1000;

        const pegoutCostInWeis = await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis);
        
        expect(pegoutCostInWeis).to.be.within(
            converter.satoshisToWeis(amountToPegoutInSatoshis + minExpectedCostInSatoshis), 
            converter.satoshisToWeis(amountToPegoutInSatoshis + maxExpectedCostInSatoshis)
        );
    });

    it('Should estimate peg-out cost, for transaction with 4 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 140000;
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] - 15) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] + 15) * feePerKb / 1000;

        const pegoutCostInWeis = await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis);
        
        expect(pegoutCostInWeis).to.be.within(
            converter.satoshisToWeis(amountToPegoutInSatoshis + minExpectedCostInSatoshis), 
            converter.satoshisToWeis(amountToPegoutInSatoshis + maxExpectedCostInSatoshis)
        );
    });

    it('Should fail to estimate peg-out cost, when not enough utxos are available to complete the peg-out transaction', async () => {
        const amountToPegoutInSatoshis = 10000000;

        await expect(pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis)).to.be.rejectedWith(Error);
    });
});

describe('Get peg-out value in satoshis', () => {
    
    beforeEach((done) => {
        pegoutCostEstimator = rewire('../pegout-cost-estimator');
        pegoutCostEstimator.__set__({
            'bridgeState': bridgeStateStub,
            'powpegDetails': powpegDetailsStub,
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });
    
    it('Should estimate peg-out value, for transaction with 1 input and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 80000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] - 5) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[1] + 5) * feePerKb / 1000;

        const pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis);
        
        expect(pegoutValueInSatoshis).to.be.within(
            amountToPegoutInSatoshis - maxExpectedCostInSatoshis,
            amountToPegoutInSatoshis - minExpectedCostInSatoshis
        );
    });

    it('Should estimate peg-out value, for transaction with 2 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 115000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] - 10) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[2] + 10) * feePerKb / 1000;

        const pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis);
        
        expect(pegoutValueInSatoshis).to.be.within(
            amountToPegoutInSatoshis - maxExpectedCostInSatoshis,
            amountToPegoutInSatoshis - minExpectedCostInSatoshis
        );
    });

    it('Should estimate peg-out value, for transaction with 3 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 125000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] - 12) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] + 12) * feePerKb / 1000;

        const pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis);
        
        expect(pegoutValueInSatoshis).to.be.within(
            amountToPegoutInSatoshis - maxExpectedCostInSatoshis,
            amountToPegoutInSatoshis - minExpectedCostInSatoshis
        );
    });

    it('Should estimate peg-out value, for transaction with 4 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 140000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] - 15) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] + 15) * feePerKb / 1000;

        const pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis);
        
        expect(pegoutValueInSatoshis).to.be.within(
            amountToPegoutInSatoshis - maxExpectedCostInSatoshis,
            amountToPegoutInSatoshis - minExpectedCostInSatoshis
        );
    });

    it('Should fail to estimate peg-out value, when not enough utxos are available to complete the peg-out transaction', async () => {
        const amountToPegoutInSatoshis = 10000000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);

        await expect(pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis)).to.be.rejectedWith(Error);
    });
});

describe('Get peg-out value in satoshis and peg-out cost in weis after setting new utxo sorting function', () => {
    
    beforeEach((done) => {
        pegoutCostEstimator = rewire('../pegout-cost-estimator');
        pegoutCostEstimator.__set__({
            'bridgeState': bridgeStateStub,
            'powpegDetails': powpegDetailsStub,
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    let compareByValueFunction = (a, b) => {
        return a.valueInSatoshis - b.valueInSatoshis;
    }

    it('Should estimate peg-out cost using new utxo sorting function, for transaction with 3 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 40000;
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] - 12) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[3] + 12) * feePerKb / 1000;

        pegoutCostEstimator.setUtxoSortingMethod(compareByValueFunction);
        const pegoutCostInWeis = await pegoutCostEstimator.estimatePegoutCostInWeis(amountToPegoutInSatoshis);
        
        expect(pegoutCostInWeis).to.be.within(
            converter.satoshisToWeis(amountToPegoutInSatoshis + minExpectedCostInSatoshis), 
            converter.satoshisToWeis(amountToPegoutInSatoshis + maxExpectedCostInSatoshis)
        );
    });
    
    it('Should estimate peg-out value using new utxo sorting function, for transaction with 4 inputs and 2 outputs', async () => {
        const amountToPegoutInSatoshis = 80000;
        const amountToPegoutInWeis = converter.satoshisToWeis(amountToPegoutInSatoshis);
        const minExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] - 15) * feePerKb / 1000;
        const maxExpectedCostInSatoshis = (pegoutTxsSizeInBytes[4] + 15) * feePerKb / 1000;

        pegoutCostEstimator.setUtxoSortingMethod(compareByValueFunction);
        const pegoutValueInSatoshis = await pegoutCostEstimator.estimatePegoutValueInSatoshis(amountToPegoutInWeis);
        
        expect(pegoutValueInSatoshis).to.be.within(
            amountToPegoutInSatoshis - maxExpectedCostInSatoshis,
            amountToPegoutInSatoshis - minExpectedCostInSatoshis
        );
    });
});
