import { ethers } from "ethers";

// Minimal ABIs — only the read/write calls this page needs.
const AGENT_ID_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const BADGE_ABI = [
  "function mint()",
  "function balanceOf(address owner) view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event BadgeMinted(address indexed holder, uint256 indexed tokenId)",
];

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
let provider = null;
let signer = null;
let account = null;
let badge = null;

function showStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = "status " + kind;
}

function pill(text, cls) {
  return `<span class="pill ${cls}">${text}</span>`;
}

async function refresh() {
  if (!provider || !account) return;
  try {
    const network = await provider.getNetwork();
    $("net").textContent =
      Number(network.chainId) === CONFIG.CHAIN_ID
        ? `${CONFIG.CHAIN_NAME} (chain ${network.chainId})`
        : `Wrong network — chain ${network.chainId}. Please switch to ${CONFIG.CHAIN_NAME}.`;
    $("switch-btn").style.display =
      Number(network.chainId) === CONFIG.CHAIN_ID ? "none" : "inline-block";

    const agentId = new ethers.Contract(CONFIG.AGENT_ID_ADDRESS, AGENT_ID_ABI, provider);
    const aidBalance = await agentId.balanceOf(account);
    $("aid").textContent = aidBalance.toString();

    if (!badge) {
      $("owned").textContent = "—";
      $("supply").textContent = "—";
      $("eligible").innerHTML = pill("Contract not deployed yet", "na");
      $("mint-btn").disabled = true;
      return;
    }

    const owned = await badge.balanceOf(account);
    $("owned").textContent = owned > 0n ? `Yes (${owned.toString()} badge)` : "No";
    const nextId = await badge.nextTokenId();
    const max = await badge.MAX_SUPPLY();
    $("supply").textContent = `${(nextId - 1n).toString()} / ${max.toString()}`;

    const eligible =
      Number(network.chainId) === CONFIG.CHAIN_ID &&
      aidBalance > 0n &&
      owned === 0n &&
      nextId <= max;
    $("eligible").innerHTML = eligible
      ? pill("Yes — you can mint", "ok")
      : pill(
          owned > 0n
            ? "No — you already minted"
            : aidBalance === 0n
              ? "No — this wallet holds no Agent ID"
              : nextId > max
                ? "No — all 1,000 badges are minted"
                : "No — wrong network",
          "no"
        );
    $("mint-btn").disabled = !eligible;
  } catch (err) {
    console.error(err);
    showStatus("Could not read on-chain data: " + (err?.message || err), "err");
  }
}

$("connect-btn").addEventListener("click", async () => {
  if (!window.ethereum) {
    showStatus("No wallet found in this browser. Please install a wallet extension (for example MetaMask) and try again.", "err");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    account = accounts[0];
    signer = await provider.getSigner();
    $("addr").textContent = account;
    $("details").style.display = "grid";
    $("connect-btn").textContent = "Connected";
    showStatus("Wallet connected. Reading your Agent ID status…", "info");
    if (CONFIG.BADGE_CONTRACT_ADDRESS) {
      badge = new ethers.Contract(CONFIG.BADGE_CONTRACT_ADDRESS, BADGE_ABI, provider);
    }
    await refresh();
  } catch (err) {
    console.error(err);
    showStatus("Connection failed: " + (err?.message || err), "err");
  }
});

$("switch-btn").addEventListener("click", async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }],
    });
    await refresh();
  } catch (err) {
    showStatus("Could not switch network: " + (err?.message || err), "err");
  }
});

$("mint-btn").addEventListener("click", async () => {
  if (!badge || !signer) return;
  $("mint-btn").disabled = true;
  showStatus("Please review and confirm the mint transaction in your wallet. No payment is attached — only network gas.", "info");
  try {
    const badgeWithSigner = badge.connect(signer);
    const tx = await badgeWithSigner.mint();
    showStatus("Transaction sent (" + tx.hash + "). Waiting for confirmation…", "info");
    const receipt = await tx.wait();
    let tokenId = "?";
    for (const log of receipt.logs) {
      try {
        const parsed = badge.interface.parseLog(log);
        if (parsed && parsed.name === "BadgeMinted") tokenId = parsed.args.tokenId.toString();
      } catch (_) { /* not our event */ }
    }
    showStatus(`Minted! Your Agent ID Pioneer Badge is token #${tokenId}.`, "ok");
    await refresh();
  } catch (err) {
    console.error(err);
    const msg = err?.code === "ACTION_REJECTED" ? "You rejected the transaction in your wallet. Nothing was minted." : "Mint failed: " + (err?.reason || err?.message || err);
    showStatus(msg, "err");
    await refresh();
  }
});

// On load: show the deployment state.
(function init() {
  if (CONFIG.BADGE_CONTRACT_ADDRESS) {
    $("deploy-note").textContent = "Badge contract is live on BNB Smart Chain.";
    const a = document.createElement("a");
    a.href = "https://bscscan.com/address/" + CONFIG.BADGE_CONTRACT_ADDRESS;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = CONFIG.BADGE_CONTRACT_ADDRESS;
    $("badge-addr").replaceChildren(a);
    $("source-note").innerHTML =
      `Source code verified and open-source on <a href="https://bscscan.com/address/${CONFIG.BADGE_CONTRACT_ADDRESS}" target="_blank" rel="noopener">BscScan</a>.`;
  } else {
    $("deploy-note").textContent =
      "The badge contract has not been deployed yet. You can still connect your wallet to check your Agent ID status; minting opens after deployment.";
  }
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
})();
