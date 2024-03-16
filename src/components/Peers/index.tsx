/* eslint-disable react-hooks/exhaustive-deps */
import FileSaver from "file-saver";
import Peer, { DataConnection } from "peerjs";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useRef } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { isChrome, isIOS } from "react-device-detect";
import { BsLaptop, BsPhone } from "react-icons/bs";
import { ID, PeerInfo } from "../../types";
import { Colors } from "../../theme";
import {
  ChunkPayload,
  FileChunker,
  FileDigester,
  FileInfo,
  FileProgressPayload,
  FileTransferPayload,
  FileTransferPayloadType,
  getFileInfo,
  SendChunkPayload,
  SendFileInfoPayload,
  TransferCompletePayload,
} from "../../utils";
import { motion } from "framer-motion";
import "./Peers.scss";
import { enqueueSnackbar } from "notistack";

interface PeersProps {
  currentPeer: PeerInfo;
  peer: Peer;
  peers: PeerInfo[];
}

type ProgressInfo = {
  id: ID;
  value: number;
};

const Peers = (props: PeersProps): React.ReactElement => {
  const { currentPeer, peer, peers } = props;
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onConnection = useCallback((connection: DataConnection) => {
    const chunks: Blob[] = [];
    connection.on("data", (data: FileTransferPayload) => {
      switch (data.type) {
        case FileTransferPayloadType.FILE_INFO:
          enqueueSnackbar(
            `Receiving ${data.fileInfo.name} from ${data.from.name}`,
            { variant: "info" }
          );
          break;

        case FileTransferPayloadType.CHUNK_RECEIVED:
          chunks.push(data.chunk);
          break;

        case FileTransferPayloadType.PROGRESS: {
          const { from, progress } = data;
          const progressInfo: ProgressInfo = {
            id: from.id,
            value: progress, 
          };
          setProgressInfo(progressInfo);
          break;
        }
        case FileTransferPayloadType.TRANSFER_COMPLETE:
          enqueueSnackbar("Transfer complete", { variant: "success" });
          onTransferComplete(chunks, data.fileInfo);
          break;

        default:
          break;
      }
    });
  }, []);

  const onTransferComplete = (chunks: Blob[], fileInfo: FileInfo): void => {
    const fileDigester = new FileDigester(chunks, fileInfo);
    const file: File = fileDigester.digest();

    if (isChrome && isIOS) {
      const reader = new FileReader();
      reader.onloadend = () => {
        window.location.href = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      FileSaver.saveAs(file, file.name);
    }
    hideProgress();
  };

  const hideProgress = (): void => {
    setTimeout(() => {
      setProgressInfo(null);
    }, 2000);
  };

  useEffect(() => {
    peer.on("connection", onConnection);
  }, [onConnection]);

  const onPeerClick = (): void => {
    fileInputRef.current?.click();
  };

  const onFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    to: PeerInfo
  ): Promise<void> => {
    event.preventDefault();
    const { files } = event.target;
    if (!files || !files?.length) return;

    const file: File | null = files.item(0);

    if (!file) {
      enqueueSnackbar("Error occurred while processing file", {
        variant: "error",
      });
      return;
    }

    try {
      const connection: DataConnection = peer.connect(to.id, {
        reliable: true,
      });
      await new Promise((resolve, reject) => {
        connection.on("open", () => resolve(connection));
        connection.on("error", (error) => reject(error));
      });

      onPeerConnectionOpen(currentPeer, to, file, connection);
    } catch (error: any) {
      console.error("Error establishing connection:", error.message);
      enqueueSnackbar(
        "Error occurred while establishing connection, please check your internet connection and try again",
        {
          variant: "error",
        }
      );
    }
  };

  const onPeerConnectionOpen = (
    from: PeerInfo,
    to: PeerInfo,
    file: File,
    connection: DataConnection
  ): void => {
    const payload: SendFileInfoPayload = {
      type: FileTransferPayloadType.FILE_INFO,
      from,
      fileInfo: getFileInfo(file),
    };
    connection.send(payload);

    const onChunk = (chunk: ChunkPayload) => {
      const payload: SendChunkPayload = {
        type: FileTransferPayloadType.CHUNK_RECEIVED,
        from,
        ...chunk,
      };
      connection.send(payload);
    };

    const onProgress = (progress: number) => {
      const payload: FileProgressPayload = {
        type: FileTransferPayloadType.PROGRESS,
        from,
        progress,
      };
      connection.send(payload);
      const progressInfo: ProgressInfo = {
        id: to.id,
        value: progress,
      };
      setProgressInfo(progressInfo);
    };

    const onComplete = () => {
      const payload: TransferCompletePayload = {
        type: FileTransferPayloadType.TRANSFER_COMPLETE,
        fileInfo: getFileInfo(file),
      };
      connection.send(payload);
      enqueueSnackbar("Transfer complete", { variant: "success" });
      hideProgress();
    };

    const chunker = new FileChunker(file, onChunk, onProgress, onComplete);
    chunker.start();
  };

  const getIcon = (peerId: ID, mobile: boolean): React.ReactNode => {
    const props = {
      className: "device",
      color: Colors.white,
      size: 25,
    };

    let icon: React.ReactNode = <BsLaptop {...props} />;

    if (mobile) {
      icon = <BsPhone {...props} />;
    }

    let progress: React.ReactNode = null;

    if (progressInfo && peerId === progressInfo.id) {
      const styles = buildStyles({
        pathColor: Colors.white,
        trailColor: Colors.primary,
      });
      progress = (
        <CircularProgressbar
          value={progressInfo.value}
          strokeWidth={4}
          styles={styles}
        />
      );
    }

    return (
      <div className="icon">
        {progress}
        {icon}
      </div>
    );
  };

  const hasPeers: boolean = !!peers.length;

  let content: React.ReactNode = (
    <h3 className="peer-discover-txt">Discovering peers...</h3>
  );

  if (hasPeers) {
    const animation = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 },
    };

    content = (
      <div className="peers-content">
        <span className="peer-id">PEER ID: {currentPeer.id}</span>

        <div className="peer-list">
          <h3 className="peers-hd">Peers Online</h3>
          {peers.map((peer: PeerInfo, index: number) => (
            <motion.div
              key={index}
              className="peer-card"
              onClick={onPeerClick}
              {...animation}
            >
              {getIcon(peer.id, peer.mobile)}
              <input
                ref={fileInputRef}
                hidden
                id="fileInp"
                type="file"
                onChange={(event) => onFileSelect(event, peer)}
              />
              <span className="name">{peer.name}</span>
              <span className="info">
                {peer.os} {peer.browser}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="peer">{content}</div>;
};

export default memo(Peers);
