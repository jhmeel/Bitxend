import React, { useCallback, useEffect, useState } from "react";
import Div100vh from "react-div-100vh";
import { motion } from "framer-motion";
import { useMediaPredicate } from "react-media-hook";
import Peer from "peerjs";
import { Header, Details, Peers, Ripple } from "../../components";
import { Connection } from "../../utils";
import { Theme } from "../../theme";
import {
  AllPeersPayloadData,
  CurrentPeerPayloadData,
  PayloadType,
  PeerInfo,
  PeerJoinedPayloadData,
  PeerLeftPayloadData,
  XendItPayload,
} from "../../types";
import "./Home.scss";
import Logo from "../../assets/svgs/logo.svg";
import axiosInstance from "../../utils/axios";
import { enqueueSnackbar } from "notistack";
import { errorParser } from "../../utils/errorParser";

const Home: React.FC = () => {
  const [currentPeer, setCurrentPeer] = useState<PeerInfo | undefined>();
  const [peer, setPeer] = useState<Peer | undefined>();
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [xendFiles, setXendFiles] = useState<Array<XendItPayload>>([]);

  const defaultTheme: Theme = useMediaPredicate("(prefers-color-scheme: dark)")
    ? Theme.DARK
    : Theme.LIGHT;
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const onAllPeers = useCallback((peers: AllPeersPayloadData) => {
    setPeers(peers);
  }, []);

  const onPeerJoined = useCallback((peer: PeerJoinedPayloadData) => {
    setPeers((prevPeers) => [...prevPeers, peer]);
  }, []);

  const onPeerLeft = useCallback((peer: PeerLeftPayloadData) => {
    setPeers((prevPeers) => prevPeers.filter((p) => p.id !== peer.id));
  }, []);

  const onCurrentPeer = useCallback(
    async (currentPeer: CurrentPeerPayloadData) => {
      setCurrentPeer(currentPeer);
      const peerInstance = new Peer(currentPeer.id, { secure: true });
      setPeer(peerInstance);

      try {
        const { data } = await axiosInstance().get(`/api/v1/xendfiles`);
        setXendFiles(Object.values(data.xendFiles).map((f: any) => f.file));
      } catch (err) {
        enqueueSnackbar(errorParser(err), { variant: "error" });
      }
    },
    []
  );

  const onXendIt = useCallback(async (fileId: string) => {
    try {
      const { data } = await axiosInstance().get(`/api/v1/xendfile/${fileId}`);
      setXendFiles((prevXendFiles) => [...prevXendFiles, data?.file?.file]);
    } catch (err) {
      enqueueSnackbar(errorParser(err), { variant: "error" });
    }
  }, []);

  useEffect(() => {
    Connection.on(PayloadType.CURRENT_PEER, onCurrentPeer);
    Connection.on(PayloadType.ALL_PEERS, onAllPeers);
    Connection.on(PayloadType.PEER_JOINED, onPeerJoined);
    Connection.on(PayloadType.PEER_LEFT, onPeerLeft);

    Connection.on(PayloadType.XEND_IT, onXendIt);

    return () => {
      Connection.off(PayloadType.CURRENT_PEER, onCurrentPeer);
      Connection.off(PayloadType.ALL_PEERS, onAllPeers);
      Connection.off(PayloadType.PEER_JOINED, onPeerJoined);
      Connection.off(PayloadType.PEER_LEFT, onPeerLeft);
      Connection.off(PayloadType.XEND_IT, onXendIt);
    };
  }, [onCurrentPeer, onAllPeers, onPeerJoined, onPeerLeft, onXendIt]);

  const toggleTheme = (): void => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );
  };

  let content: React.ReactNode = (
    <div className="loader">
      <Ripple>
        <img src={Logo} width={40} />
        <h2 style={{ marginLeft: "5px" }}>Bitxend</h2>
      </Ripple>
    </div>
  );

  if (peer && currentPeer) {
    const darkMode: boolean = theme === Theme.DARK;

    content = (
      <>
        <Header
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          currentPeer={currentPeer}
        />
        <Peers peers={peers} peer={peer} currentPeer={currentPeer} />
        <Details currentPeer={currentPeer} xendFiles={xendFiles} />
      </>
    );
  }

  const animation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  };

  return (
    <Div100vh className={`theme--${theme} root`}>
      <motion.div className="home" {...animation}>
        {content}
      </motion.div>
    </Div100vh>
  );
};

export default Home;
