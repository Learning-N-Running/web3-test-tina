import React from "react";
import {
  Avatar,
  AppBar,
  Box,
  Button,
  Toolbar,
  Tooltip,
  Typography,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import Web3 from "web3";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import MenuIcon from "@mui/icons-material/Menu";
import { setToLS } from "../../Utils/storage";
import {
  RPC,
  vrtABI,
  vrtAddress,
  daoABI,
  daoAddress,
  harmony_mainnet,
} from "../../Constants/config";

const web3 = new Web3(new Web3.providers.HttpProvider(RPC));
const vrtContract = new web3.eth.Contract(vrtABI, vrtAddress);
const daoContract = new web3.eth.Contract(daoABI, daoAddress);

class Header extends React.Component {
  constructor(props) {
    super();
    this.state = {
      account: "",
      position: "",
    };
    this.listenersInitialized = false;
  }

  setDark = () => {
    this.props.dispatch({ type: "SET_THEME", payload: "dark" });
    setToLS("vegan-theme", "dark");
  };

  setLight = () => {
    this.props.dispatch({ type: "SET_THEME", payload: "light" });
    setToLS("vegan-theme", "light");
  };

  async walletConnect() {
    if (typeof window.ethereum === "undefined") {
      alert(
        "No wallet detected. Please install MetaMask or another Web3 wallet."
      );
      window.open("https://metamask.io/download");
      return;
    }
    try {
      await this.switchToHarmonyChain();
      const clientWeb3 = new Web3(web3.ethereum);
      window.web3 = clientWeb3;
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      this.setState({
        account: address,
      });
      this.props.dispatch({ type: "SET_ACCOUNT", payload: address });
      await this.getPosition(address);

      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
          this.setState({ account: "" });
        } else {
          const address = accounts[0];
          this.setState({ account: address });
          // this.checkDashBoard(this.state.account);
          // this.checkElectionStatus();
        }
      });

      window.ethereum.on("chainChanged", async (chainId) => {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: web3.utils.toHex(harmony_mainnet.chainId) }],
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  async getPosition(address) {
    const balance = await vrtContract.methods.balanceOf(address).call();
    const owner = await daoContract.methods.owner().call();
    const admin = await daoContract.methods.admin().call();

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
  }

  async switchToHarmonyChain() {
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
  }

  render() {
    return (
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          boxShadow: "none",
          bgcolor: this.props.theme.palette.background.default,
          backgroundImage: "unset",
          borderBottom: `1px solid ${this.props.theme.palette.divider}`,
          py: 2,
        }}
      >
        <Toolbar
          sx={{
            gap: this.props.matchUpMd ? 6 : 2,
            justifyContent: "space-between",
          }}
        >
          <Stack
            alignItems="center"
            flexDirection="row"
            gap={this.props.matchUpMd ? 6 : 2}
          >
            <Button
              size="small"
              edge="start"
              variant="outlined"
              // color="inherit"
              aria-label="menu"
              onClick={() => this.props.handleDrawerOpen()}
              sx={{
                px: 1,
                minWidth: "unset",
                display: { sm: "block", md: "none" },
              }}
            >
              <MenuIcon />
            </Button>
            <Link to="/">
              <Box
                sx={{ display: { xs: "none", sm: "block" } }}
                component="img"
                src={
                  this.props.theme.palette.mode === "dark"
                    ? "/images/logo_main_white.png"
                    : "/images/logo_main.png"
                }
              />
            </Link>
            <Typography
              variant="h2"
              sx={{
                flexGrow: 1,
                color: this.props.theme.palette.text.primary,
                display: { xs: "none", md: "block" },
              }}
            >
              Vegan Rob’s DAO
            </Typography>
          </Stack>
          <Stack flexDirection="row" gap={5} alignItems="center">
            <Button
              variant="contained"
              color="success"
              disabled={this.state.account ? true : false}
              sx={{
                fontWeight: 700,
                display: { xs: "none", sm: "block" },
                color: this.props.theme.palette.common.white,
              }}
              onClick={() => this.walletConnect()}
            >
              Connect Wallet
            </Button>
            <Stack flexDirection="row" alignItems="center" gap={4}>
              <Stack
                flexDirection="row"
                alignItems="center"
                gap={1}
                sx={{
                  display: { xs: "none", sm: "flex" },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: this.props.theme.palette.text.primary,
                  }}
                />
                <Stack>
                  {this.state.account ? (
                    <Tooltip title={this.state.account}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: this.props.theme.palette.text.primary,
                        }}
                      >
                        {this.state.account
                          ? this.state.account.slice(0, 8) + "..."
                          : ""}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <></>
                  )}
                  <Typography
                    variant="overline"
                    sx={{
                      textTransform: "capitalize",
                      color: this.props.theme.palette.text.secondary,
                    }}
                  >
                    {this.state.position}
                  </Typography>
                </Stack>
              </Stack>
              {this.props.theme.palette.mode === "dark" ? (
                <Box
                  component="img"
                  src="/images/sun.png"
                  sx={{ cursor: "pointer" }}
                  onClick={this.setLight}
                />
              ) : (
                <Box
                  component="img"
                  src="/images/moon.png"
                  sx={{ cursor: "pointer" }}
                  onClick={this.setDark}
                />
              )}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>
      // </Box>
    );
  }
}

const withHook = (Header) => {
  return (props) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const matchUpMd = useMediaQuery(theme.breakpoints.up("md"));
    return (
      <Header
        theme={theme}
        dispatch={dispatch}
        {...props}
        matchUpMd={matchUpMd}
      />
    );
  };
};

export default withHook(Header);
