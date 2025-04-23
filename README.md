[![CI/CD Using Github actions workflow](https://github.com/rsksmart/pegout-cost-estimator/actions/workflows/workflow.yml/badge.svg)](https://github.com/rsksmart/pegout-cost-estimator/actions/workflows/workflow.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/pegout-cost-estimator/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/pegout-cost-estimator)

# Disclaimer

This is a beta version until audited by the security team. Any comments or suggestions feel free to contribute or reach out at our [open slack](https://developers.rsk.co/slack).

# pegout-cost-estimator
Library to help estimate peg-out costs. Includes a console tool to use it.

Keep in mind that it is not possible to make an exact calculation of the cost of a pegout transaction due to the dynamic nature of a blockchain. The results obtained by using this tool are only an approximation, the actual cost may differ.

## Details

Some of the exposed functions expect to receive a web3 instance connected to a Rskj node, and the network settings of the corresponding network. This settings can be obtained using [rsk-network-settings](https://github.com/rsksmart/rsk-network-settings) library.

## estimatePegoutCostInWeis

```
estimatePegoutCostInWeis(amountToPegoutInSatoshis, web3, networkSettings)
```

Given the amount of satoshis the user expects to receive, this function returns an approximate amount in weis the user should send to the Bridge. This amount equals to the amount the user wants to receive plus the estimated fee.

## estimatePegoutValueInSatoshis

```
estimatePegoutValueInSatoshis(amountToPegoutInWeis, web3, networkSettings)
```
Given the amount of weis the user will send to the Bridge, this function returns the approximate amount in satoshis the user will receive. This amount equals to the amount the user sends to the Bridge minus the estimated fee.

## setUtxoSortingMethod

```
setUtxoSortingMethod((a, b) => {...})
```

Allows to override the function used to sort the utxos used to create the peg-out transactions. Expects to receive a function that, given 2 values, returns `1` if a > b, `0` if equal, and `-1` if a < b.

 The sorting function used by default replicates the logic used in Rskj node.

## Tool

The library also provides a tool to be used from a console to estimate peg-out costs.

### Usage

```
$ node tool/pegout-cost-in-weis.js [network] [amountInSatoshis]
```

```
$ node tool/pegout-value-in-satoshis.js [network] [amountInWeis]
```

`network` value can be **mainnet**, **testnet** or a network url to a host running a Rskj node


### Example
```
$ node tool/pegout-cost-in-weis.js testnet 1000000

In order to receive 1000000 satoshis, the user needs to send approximately 10944000000000000 weis to the bridge
```

```
$ node tool/pegout-value-in-satoshis.js testnet 10000000000000000

By sending 10000000000000000 weis to the bridge, the user will receive approximately 905600 satoshis
```
