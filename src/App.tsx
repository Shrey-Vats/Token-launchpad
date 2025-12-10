import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { 
  createInitializeMetadataPointerInstruction, 
  createInitializeMintInstruction, 
  ExtensionType, 
  getMintLen, 
  LENGTH_SIZE, 
  TOKEN_2022_PROGRAM_ID, 
  TYPE_SIZE 
} from "@solana/spl-token";
import { FaGithub, FaXTwitter } from 'react-icons/fa6';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata";

// shadcn/ui inspired components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Coins, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Settings2, 
  ArrowRight
} from "lucide-react";

const TokenForgeApp = () => {
  // State from provided logic
  const [decimal, setDecimal] = useState("9");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [isFreezAuthority, setIsFreezAuthority] = useState<boolean>(false);
  const [isMintAuthority, setIsMintAuthority] = useState<boolean>(true);
  const [isMetadataAuthority, setIsMetadataAuthority] = useState<boolean>(true);
  const [isDeploying, setIsDeploying] = useState(false);

  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const githubUrl = 'https://github.com/Shrey_Vats';
  const xUrl = 'https://x.com/shreyvats01';

  const handleCreateToken = async () => {
    if (!publicKey) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setIsDeploying(true);
      const mint = Keypair.generate();
      
      const metadata: TokenMetadata = {
        name: name,
        symbol: symbol,
        mint: mint.publicKey,
        uri: "https://raw.githubusercontent.com/solana-developers/spl-token-metadata/main/prop-602/example.json",
        additionalMetadata: [["description", description]]
      };

      const mintDataLen = pack(metadata).length;
      const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
      const spaceWithoutMetadataExtension = getMintLen([ExtensionType.MetadataPointer]);
      
      const lamportsForMint = await connection.getMinimumBalanceForRentExemption(
        spaceWithoutMetadataExtension + mintDataLen + metadataExtension
      );

      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        lamports: lamportsForMint,
        newAccountPubkey: mint.publicKey,
        programId: TOKEN_2022_PROGRAM_ID,
        space: spaceWithoutMetadataExtension
      });

      const initializeMetadataPointerIx = createInitializeMetadataPointerInstruction(
        mint.publicKey,
        isMetadataAuthority ? publicKey : null,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      );

      const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        Number(decimal) > 9 ? 9 : Number(decimal),
        publicKey,
        isFreezAuthority ? publicKey : null,
        TOKEN_2022_PROGRAM_ID
      );

      const initializeMetadataIx = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        metadata: mint.publicKey,
        mintAuthority: publicKey,
        name: name,
        symbol: symbol,
        uri: metadata.uri,
        updateAuthority: publicKey
      });

      const tx = new Transaction().add(
        createMintAccountIx,
        initializeMetadataPointerIx,
        initializeMintIx,
        initializeMetadataIx
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.partialSign(mint);

      const signature = await sendTransaction(tx, connection);
      console.log("Transaction Signature:", signature);
      alert(`Token Created Successfully!\nMint: ${mint.publicKey.toBase58()}`);
    } catch (error) {
      console.error(error);
      alert("Deployment failed. Check console for details.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleIconClick = (url: string) => {
        window.open(url, '_blank');
    };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Cpu size={18} className="text-zinc-950" />
            </div>
            <span className="font-bold tracking-tight text-xl">Forge<span className="text-emerald-500">Launch</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 text-sm text-zinc-400 mr-8">
            <button
                        className={`text-3xl p-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl text-gray-700 hover:bg-gh-dark hover:text-white`}
                        onClick={() => handleIconClick(githubUrl)}
                        aria-label="GitHub Profile Link"
                        title="Go to GitHub"
                    >
                        <FaGithub />
              </button>

    <button
                        className={`text-3xl p-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl text-gray-700 hover:bg-x-black hover:text-white`}
                        onClick={() => handleIconClick(xUrl)}
                        aria-label="X Profile Link"
                        title="Go to X (Twitter)"
                    >
                        <FaXTwitter />
                    </button>
            </div>
            <WalletMultiButton className="!bg-zinc-100 !text-zinc-900 !rounded-full !h-10 !text-sm !font-semibold transition-transform hover:scale-105" />
          </div>
        </div>
      </nav>
        {/* Left Section: Configuration (8 cols) */}
        <div className="lg:col-span-7 space-y-10 px-10 mt-4">
          <header className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Token Architecture
            </h1>
            <p className="text-zinc-400 max-w-lg">
              Define your asset parameters. These settings are immutable on-chain unless authority is granted.
            </p>
          </header>

          <section className="grid gap-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tokenName" className="text-zinc-300 ml-1">Token Identity</Label>
                <Input 
                  id="tokenName"
                  placeholder="e.g. Solana Genesis" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol" className="text-zinc-300 ml-1">Symbol</Label>
                <Input 
                  id="tokenSymbol"
                  placeholder="SOLG" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 uppercase"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="desc" className="text-zinc-300 ml-1">On-chain Description</Label>
                <Input 
                  id="desc"
                  placeholder="Utility token for the ecosystem..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals" className="text-zinc-300 ml-1">Decimals</Label>
                <Input 
                  id="decimals"
                  type="number"
                  max={9}
                  min={0}
                  value={decimal}
                  onChange={(e) => setDecimal(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 text-center"
                />
              </div>
            </div>

            <Separator className="bg-zinc-800/50" />

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-500 uppercase tracking-wider">
                <ShieldCheck size={16} /> Security & Authorities
              </h3>
              <div className="grid gap-3">
                {[
                  { id: 'freeze', label: 'Freeze Authority', state: isFreezAuthority, setter: setIsFreezAuthority, desc: 'Allow freezing of account balances' },
                  { id: 'mint', label: 'Mint Authority', state: isMintAuthority, setter: setIsMintAuthority, desc: 'Allow creation of new supply' },
                  { id: 'meta', label: 'Metadata Authority', state: isMetadataAuthority, setter: setIsMetadataAuthority, desc: 'Allow future metadata updates' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-900 transition-colors group">
                    <div>
                      <p className="font-medium text-zinc-200">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={item.state} 
                      onCheckedChange={item.setter} 
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCreateToken}
              disabled={isDeploying || !publicKey}
              className="w-full h-14 text-lg font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isDeploying ? "Committing to Chain..." : "Initialize Launch Sequence"}
              {!isDeploying && <ArrowRight className="ml-2" size={20} />}
            </Button>
          </section>
        </div>

        {/* Right Section: Interactive Lab (5 cols) */}
        <div className="lg:col-span-5 relative flex flex-col items-center justify-start py-8">
          
          {/* Live Preview Card */}
          <div className="w-full max-w-sm sticky top-32 perspective-1000">
            <Card className="relative overflow-hidden bg-zinc-900 border-zinc-800 shadow-2xl rounded-4xl transform-gpu hover:rotate-2 transition-transform duration-500">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Coins size={120} />
              </div>
              
              <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-zinc-950 font-black text-xl">
                    {symbol ? symbol[0] : "?"}
                  </div>
                  <div className="px-2 py-1 border border-zinc-700 rounded-md text-[10px] text-zinc-500 font-mono">
                    TOKEN_2022
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold truncate text-[#ffffff]">
                  {name || "Untitled Token"}
                </CardTitle>
                <CardDescription className="font-mono text-emerald-500 text-xs">
                  ${symbol || "SYM"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] uppercase text-zinc-500 mb-1 font-semibold tracking-wider">Description Preview</p>
                  <p className="text-sm text-zinc-300 italic line-clamp-2 leading-relaxed">
                    "{description || "Token description will appear here..."}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Precision</p>
                    <p className="text-lg font-bold text-white">{decimal || "0"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Network</p>
                    <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1">
                      <Activity size={12} /> Devnet
                    </p>
                  </div>
                </div>
              </CardContent>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 glow-effect" />
            </Card>

            {/* Floating Context Card */}
            <div className="mt-8 transform lg:-translate-x-12 translate-y-4">
               <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm p-4 text-xs shadow-xl rounded-xl w-64 border-l-4 border-l-emerald-500">
                 <div className="flex items-center gap-2 mb-2 text-zinc-300 font-semibold">
                   <Settings2 size={14} className="text-emerald-500" /> Advanced Logic
                 </div>
                 <ul className="space-y-1.5 text-zinc-500">
                    <li className="flex justify-between"><span>Authority:</span> <span className="text-zinc-300">Solana v22</span></li>
                    <li className="flex justify-between"><span>Rent Cost:</span> <span className="text-zinc-300">~0.012 SOL</span></li>
                    <li className="flex justify-between"><span>Standards:</span> <span className="text-zinc-300">SPL-Metadata</span></li>
                 </ul>
               </Card>
            </div>
          </div>
        </div>
    </div>
  );
};

export default TokenForgeApp;