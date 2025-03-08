# Verifiable-Agent-frontend

This folder contains
- `frontend`: It contains the react frontend application which 
    1. Fetches price of BTC in USD from Chainlink PriceFeed Oracle for sepolia and amoy testnet
    2. Calculates tthe price difference on two network for the pair
    3. Ask user to enter threshold amount and email
    4. Generate a zero knowledge proof that the price Difference is greater than teh threshold and verify it
    5. If price difference is less than threshold then it sends an email to the user along with 1 USDC 

- To run the fronend react application run the following command
```
npm install
```

```
npm run dev
```

#### The application will run on http://localhost:5173