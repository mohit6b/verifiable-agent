// require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
// import('hardhat/config').HardhatUserConfig;
const { vars } = require("hardhat/config");

const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const SEP_PRIVATE_KEY = vars.get("SEP_PRIVATE_KEY")
const AMOY_PRIVATE_KEY = vars.get("AMOY_PRIVATE_KEY")
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: `http://127.0.0.1`
      },
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${SEP_PRIVATE_KEY}`],
    },
    amoy: {
      url: `https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${AMOY_PRIVATE_KEY}`],
    },
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [`59b66c8e4c0d32a2a025d2d55000886340f635053462272c2f0fa937e39c65e4`], 
    //   gasPrice: 10000000000,
    //   chainId: 1,
    // },
  },
};
