# pegout-cost-calculator
Library to help estimate peg-out costs. Includes a console tool to use it.

## Details

Some of the exposed functions expect to receive a web3 instance connected to a Rskj node, and the network settings of the corresponding network. This settings can be obtained using [rsk-network-settings](https://github.com/rsksmart/rsk-network-settings) library.

## calculatePegoutCostInWeis

```
calculatePegoutCostInWeis(amountToPegoutInSatoshis, web3, networkSettings)
```

Given the amount of satoshis the user expects to receive, this function returns the amount in weis the user needs to send to the Bridge. This amount equals to the amount the user wants to receive plus the fee calculated.

## calculatePegoutValueInSatoshis

```
calculatePegoutValueInSatoshis(amountToPegoutInWeis, web3, networkSettings)
```
Given the amount of weis the user will send to the Bridge, this function returns the amount in satoshis the user will receive. This amount equals to the amount the user sends to the Bridge minus the fee calculated.

## setUtxoSortingMethod

```
setUtxoSortingMethod((a, b) => {...})
```

Allows to override the function used to sort the utxos used to create the peg-out transactions. Expects to receive a function that, given 2 values, returns `1` if a > b, `0` if equal, and `-1` if a < b.

 The sorting function used by default replicates the logic used in Rskj node.

## Tool

The library also provides a tool to be used from a console to calculate peg-out costs.

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

In order to receive 1000000 satoshis, the user needs to send 10944000000000000 weis to the bridge
```

```
$ node tool/pegout-value-in-satoshis.js testnet 10000000000000000

By sending 10000000000000000 weis to the bridge, the user will receive 905600 satoshis
```
