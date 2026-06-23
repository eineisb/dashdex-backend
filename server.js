const express = require("express");
const cors = require("cors");
const { AppKit } = require("@circle-fin/app-kit");
const { createViemAdapterFromPrivateKey } = require("@circle-fin/adapter-viem-v2");
const { createWalletClient, createPublicClient, http } = require("viem");
const { inspect } = require("util");

const app = express();
app.use(cors());
app.use(express.json());

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const KIT_KEY = process.env.KIT_KEY;
if (!PRIVATE_KEY || !KIT_KEY) {
  console.error("ERROR: PRIVATE_KEY or KIT_KEY missing!");
}

const RPC_URL = "https://5042002.rpc.thirdweb.com";

function makeAdapter() {
  return createViemAdapterFromPrivateKey({
    privateKey: PRIVATE_KEY,
    getWalletClient: ({ chain, account }) =>
      createWalletClient({ transport: http(RPC_URL), account, chain }),
    getPublicClient: ({ chain }) =>
      createPublicClient({ transport: http(RPC_URL), chain }),
  });
}

app.get("/health", (req, res) => {
  res.json({ status: "Dash.dex backend running!" });
});

app.post("/swap", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;
    const adapter = makeAdapter();
    const kit = new AppKit();
    const result = await kit.swap({
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn,
      config: { kitKey: KIT_KEY },
    });
    res.json({ success: true, state: result.state, amountOut: result.amountOut, txHash: result.txHash });
  } catch (e) {
    const full = inspect(e, false, null, false);
    console.error("SWAP ERROR FULL:", full);
    res.json({ success: false, error: e.message + " || " + full.slice(0, 4000) });
  }
});

app.post("/bridge", async (req, res) => {
  try {
    const { fromChain, toChain, amount } = req.body;
    const adapter = makeAdapter();
    const kit = new AppKit();
    const result = await kit.bridge({
      from: { adapter, chain: fromChain },
      to: { adapter, chain: toChain },
      amount,
    });
    res.json({ success: true, state: result.state });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log("Dash.dex backend running on port " + PORT));
}
module.exports = app;
