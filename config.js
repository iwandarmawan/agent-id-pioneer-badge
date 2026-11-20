// Site configuration for the Agent ID Pioneer Badge mint page.
// Fill in BADGE_CONTRACT_ADDRESS after the contract is deployed on
// BNB Chain mainnet and verified on BscScan. Until then the page shows
// a "not deployed yet" notice and the Mint button stays disabled.
const CONFIG = {
  // BNB Chain mainnet.
  CHAIN_ID: 56,
  CHAIN_ID_HEX: "0x38",
  CHAIN_NAME: "BNB Smart Chain",
  // SPACE ID Agent ID contract (ERC-721, non-transferable). This address
  // is fixed by the badge contract itself; the site only reads it.
  AGENT_ID_ADDRESS: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  // Deployed on BNB Chain mainnet 2026-11-20 (tx 0x79c877210b25cb99f9b1ad7acd8ee5539c6872a376dd82dcb0c7915d60f74265).
  BADGE_CONTRACT_ADDRESS: "0x679d4F5Bbc579053a691a44cbAa01C2999DF1b5B",
  // BscScan links shown on the page.
  AGENT_ID_BSCSCAN:
    "https://bscscan.com/address/0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  MAX_SUPPLY: 1000,
};
