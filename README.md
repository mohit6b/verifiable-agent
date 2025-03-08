# Verifiable-Agent

This repository contains 3 folders
- `backend`: It contains the program to deploy pricefeed contracts and verifier contract on sepolia and amoy testnet.
- `zkp`: It contains tthe circuit to generate zero knowledge proof of whether the second input(price difference) is greater than the first input (threshold)
- `frontend`: It contains the react frontend application which 
    1. Fetches price of BTC in USD from Chainlink PriceFeed Oracle for sepolia and amoy testnet
    2. Calculates tthe price difference on two network for the pair
    3. Ask user to enter threshold amount and email
    4. Generate a zero knowledge proof that the price Difference is greater than teh threshold and verify it
    5. If price difference is less than threshold then it sends an email to the user along with 1 USDC 

### There are individual README instructions to run backend, zkp and frontend repositories. Change to specfic folders one by one

```
cd backend
cd zkp
cd frontend
```
