const express = require("express");
const cors = require("cors");
const { AppKit } = require("@circle-fin/app-kit");
const { createViemAdapterFromPrivateKey } = require("@circle-fin/adapter-viem-v2");

const app = express();
app.use(cors());
app.use(express.json());

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const KIT_KEY = process.env.KIT_KEY;

app.get("/health", (req, res) => {
  res.json({ status: "Dash.dex backend running!" });
});

app.post("/swap", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;
    const adapter = createViemAdapterFromPrivateKey({ privateKey: PRIVATE_KEY });
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
    res.json({ success: false, error: e.message });
  }
});

app.post("/bridge", async (req, res) => {
  try {
    const { fromChain, toChain, amount } = req.body;
    const adapter = createViemAdapterFromPrivateKey({ privateKey: PRIVATE_KEY });
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
app.listen(PORT, () => console.log("Dash.dex backend running on port " + PORT));
