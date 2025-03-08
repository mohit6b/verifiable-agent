# verifiable-agents-backend

This section contains the code to deploy different smart contracts to sepolia and amoy testnet using hardhat

## Instructions to deploy contracts wth hardhat

- Copy the content of .env.example to .env
- Enter the required values of the environment varibles
- `contracts` folder contains 3 smart contracts PriceSepolia.sol, PriceAmoy.sol & verifier.sol
- `PriceSepolia.sol` - Fetches the price of `BTC/USD` pair on Sepolia testnet from Chainlink oracle 
- `PriceAmoy.sol` - Fetches the price of `BTC/USD` pair on Amoy testnet from Chainlink oracle 
- `ignition/modules` folder contains 3 deployment scripts PriceAmoy.js, PriceSepolia.js & verifier.js
- Run below command to compile all the smart contracts
``` 
npx hardhat compile
```
- Run below command to deploy PriceSepolia.sol on sepolia testnet
``` 
npx hardhat ignition deploy ./ignition/modules/PriceSepolia.js --network sepolia
```
- Run below command to deploy PriceAmoy.sol on amoy testnet
``` 
npx hardhat ignition deploy ./ignition/modules/PriceAmoy.js --network amoy
```

#### Note down the deloy addresses of PriceSepolia.sol & PriceAmoy.sol and use in frontend .env file

- Now move to the zkp folder
- `verifier.sol` - Verifier contract generated from zkp folder to verify ZK proof
- Run below command to deploy verifier.sol on sepolia testnet
``` 
npx hardhat ignition deploy ./ignition/modules/verifier.js --network sepolia
```

#### Note down the deloy addresses of verifier.sol and use in frontend .env file

### For Ease below addresses can be used

- PriceSepolia deployed address: `0x84c58Ea19Ac32bA8cf0b9B84197fC8781Eb99d72`
- PriceAmoy deployed address: `0x6ddA4aa62cAaB148aA8e5D7B2e27d7470A9915Ed`
- verifier deployed address: `0x12d95F847De3cE56D19fD9DceB471375F78A3540`