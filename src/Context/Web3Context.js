import React from "react";
import {
  RPC,
  vrtAddress,
  vrtABI,
  daoABI,
  daoAddress,
  harmony_mainnet,
} from "../Constants/config";
import Web3 from "web3";

const web3 = new Web3(new Web3.providers.HttpProvider(RPC));
const vrtContract = new web3.eth.Contract(vrtABI, vrtAddress);
const daoContract = new web3.eth.Contract(daoABI, daoAddress);

const initialState = {
  web3: web3,
  account: "",
  daoContract: daoContract,
  vrtContract: vrtContract,
};

const Web3Context = React.createContext({
  ...initialState,
});

export const Web3Provider = ({ children }) => {
  const [data, setData] = React.useState({ ...initialState });
  let listenersInitialized = false;
  React.useEffect(() => {}, []);

  const walletConnect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert(
        "No wallet detected. Please install MetaMask or another Web3 wallet."
      );
      window.open("https://metamask.io/download");
      return;
    }
    try {
      await switchToHarmonyChain();
      const clientWeb3 = new Web3(web3.ethereum);
      window.web3 = clientWeb3;
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      setData({ ...data, account: address });
      await getPosition(address);

      if (!listenersInitialized) {
        window.ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length === 0) {
            this.setState({
              account: "",
            });
          } else {
            const address = accounts[0];
            this.setState({
              account: address,
            });
          }
        });
        window.ethereum.on("chainChanged", async () => {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: web3.utils.toHex(harmony_mainnet.chainId) }],
          });
        });
        listenersInitialized = true;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getPosition = async (address) => {
    const balance = await web3.vrtContract.methods.balanceOf(address).call();
    const owner = await web3.web3.daoContract.methods.owner().call();
    const admin = await web3.web3.daoContract.methods.admin().call();

    if (address === owner) {
      this.setState({
        position: "OWNER",
      });
      this.props.dispatch({ type: "SET_POSITION", payload: "OWNER" });
    } else if (address === admin) {
      this.setState({
        position: "ADMIN",
      });
      this.props.dispatch({ type: "SET_POSITION", payload: "ADMIN" });
    } else {
      if (balance > 0) {
        this.setState({
          position: "MEMBER",
        });
        this.props.dispatch({ type: "SET_POSITION", payload: "MEMBER" });
      } else {
        this.setState({
          position: "GUEST",
        });
        this.props.dispatch({ type: "SET_POSITION", payload: "GUEST" });
      }
    }
  };

  const switchToHarmonyChain = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: web3.utils.toHex(harmony_mainnet.chainId) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                ...harmony_mainnet,
                chainId: web3.utils.toHex(harmony_mainnet.chainId),
              },
            ],
          });
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: web3.utils.toHex(harmony_mainnet.chainId) }],
          });
        } catch (addError) {
          console.error("Failed to add chain:", addError);
        }
      } else {
        console.error("Failed to switch chain:", switchError);
      }
    }
  };

  return (
    <Web3Context.Provider value={{ ...data, walletConnect }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;
