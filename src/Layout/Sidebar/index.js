import React from "react";
import {
  Avatar,
  Box,
  Drawer,
  Toolbar,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  // useMediaQuery,
  Stack,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Web3 from "web3";
import {
  RPC,
  vrtABI,
  vrtAddress,
  daoABI,
  daoAddress,
  harmony_mainnet,
} from "../../Constants/config";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useDispatch } from "react-redux";

const web3 = new Web3(new Web3.providers.HttpProvider(RPC));
const vrtContract = new web3.eth.Contract(vrtABI, vrtAddress);
const daoContract = new web3.eth.Contract(daoABI, daoAddress);

const drawerWidth = 260;
const Menu = (props) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  //   const [selected, setSelected] = React.useState(0);
  const [account, setAccount] = React.useState("");
  const [position, setPosition] = React.useState("");
  const dispatch = useDispatch();
  let listenersInitialized = false;

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
      setAccount(address);
      dispatch({ type: "SET_ACCOUNT", payload: address });
      await getPosition(address);

      if (!listenersInitialized) {
        setupEthereumListeners();
        listenersInitialized = true;
      }
    } catch (error) {
      console.error(error);
    }

    // this.checkDashBoard(this.state.linkedAccount)
  };

  const getPosition = async (address) => {
    const balance = await vrtContract.methods.balanceOf(address).call();
    const owner = await daoContract.methods.owner().call();
    const admin = await daoContract.methods.admin().call();

    if (address === owner) {
      setPosition("OWNER");
      dispatch({ type: "SET_POSITION", payload: "OWNER" });
    } else if (address === admin) {
      setPosition("ADMIN");
      dispatch({ type: "SET_POSITION", payload: "ADMIN" });
    } else {
      if (balance > 0) {
        setPosition("MEMBER");
        dispatch({ type: "SET_POSITION", payload: "MEMBER" });
      } else {
        setPosition("GUEST");
        dispatch({ type: "SET_POSITION", payload: "GUEST" });
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

  const setupEthereumListeners = () => {
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
      } else {
        const address = accounts[0];
        setAccount(address);
      }
    });
    window.ethereum.on("chainChanged", async () => {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: web3.utils.toHex(harmony_mainnet.chainId) }],
      });
    });
  };

  const handleListItemClick = (event, index) => {
    // setSelected(index);
    props.handleDrawerClose();
    console.log(props.handleDrawerClose);
  };

  return (
    <div>
      <Toolbar sx={{ my: 2, mt: 6 }} />
      {/* <Divider /> */}
      <List>
        <ListItem sx={{ p: 0.5, display: { sm: "none", xs: "flex" } }}>
          <Stack
            flexDirection="row"
            alignItems="center"
            gap={1}
            sx={{
              display: { xs: "flex" },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.text.primary,
              }}
            />
            <Stack>
              {account ? (
                <Tooltip title={account}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {account ? account.slice(0, 8) + "..." : ""}
                  </Typography>
                </Tooltip>
              ) : (
                <></>
              )}
              <Typography
                variant="body2"
                sx={{
                  textTransform: "capitalize",
                  color: theme.palette.text.secondary,
                }}
              >
                {position}
              </Typography>
            </Stack>
          </Stack>
        </ListItem>
        <ListItem sx={{ p: 0.5, pb: 2, display: { sm: "none", xs: "flex" } }}>
          <Button
            variant="outlined"
            color="success"
            fullWidth
            disabled={account ? true : false}
            sx={{
              fontWeight: 700,
              gap: 1.5,
              // py: 1,
              borderRadius: 2,
              justifyContent: "flex-start",
              display: { xs: "flex" },
            }}
            onClick={walletConnect}
          >
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <AccountBalanceWalletOutlinedIcon />
            </ListItemIcon>
            <Typography variant="body1">Connect Wallet</Typography>
          </Button>
        </ListItem>

        {[
          { text: "Dashboard", route: "/", icon: DashboardOutlinedIcon },
          { text: "Election Status", route: "/elections", icon: BarChartIcon },
          {
            text: "Create New Election",
            route: "/create",
            icon: HowToVoteOutlinedIcon,
          },
          { text: "Vote", route: "/vote", icon: HowToRegIcon },
        ].map((element, key) => (
          <Link
            key={key}
            to={element.route}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <ListItem sx={{ p: 0.5 }}>
              <Button
                fullWidth
                color="success"
                variant={
                  (
                    element.route === "/"
                      ? pathname === "/"
                      : pathname.toLowerCase().includes(element.route)
                  )
                    ? "contained"
                    : "text"
                }
                selected={
                  element.route === "/"
                    ? pathname === "/"
                    : pathname.toLowerCase().includes(element.route)
                }
                onClick={(event) => handleListItemClick(event, key)}
                sx={{
                  gap: 1.5,
                  // py: 1,
                  borderRadius: 2,
                  color: "#fff",
                  justifyContent: "flex-start",
                }}
              >
                <ListItemIcon sx={{ minWidth: "unset" }}>
                  {(
                    element.route === "/"
                      ? pathname === "/"
                      : pathname.toLowerCase().includes(element.route)
                  ) ? (
                    <element.icon sx={{ color: "#fff" }} />
                  ) : (
                    <element.icon />
                  )}
                  {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                </ListItemIcon>
                <Typography
                  variant="body1"
                  sx={{
                    color: (
                      element.route === "/"
                        ? pathname === "/"
                        : pathname.toLowerCase().includes(element.route)
                    )
                      ? theme.palette.white
                      : theme.palette.text.primary,
                  }}
                >
                  {element.text}
                </Typography>
              </Button>
            </ListItem>
          </Link>
        ))}
      </List>
    </div>
  );
};

export default function Sidebar(props) {
  const { window } = props;
  const theme = useTheme();
  // const matchUpMd = useMediaQuery(theme.breakpoints.up("md"));

  const container =
    window !== undefined ? () => window().document.body : undefined;
  return (
    <Box
      component="nav"
      sx={{
        width: { md: drawerWidth },
        flexShrink: { sm: 0 },
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Drawer
        container={container}
        variant="temporary"
        open={props.open}
        onClose={() => props.handleDrawerClose()}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { sm: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            display: { sm: "block", md: "none", xs: "block" },
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <Menu handleDrawerClose={props.handleDrawerClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { sm: "none", md: "block", xs: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            display: { sm: "none", md: "block", xs: "none" },
            bgcolor: theme.palette.background.default,
          },
        }}
        open
      >
        <Menu handleDrawerClose={props.handleDrawerClose} />
      </Drawer>
    </Box>
  );
}
