import { PeerInfo } from "./peer.types";

export type CurrentPeerPayloadData = PeerInfo;

export type AllPeersPayloadData = PeerInfo[];

export type PeerJoinedPayloadData = PeerInfo;

export type PeerLeftPayloadData = PeerInfo;

export type XendItPayload = {
  PeerId: string;
  fileId: string;
  filename: string;
  fileData: string | Blob; 
};

export enum PayloadType {
  CURRENT_PEER = "current-peer",
  ALL_PEERS = "all-peers",
  PEER_JOINED = "peer-joined",
  PEER_LEFT = "peer-left",
  XEND_IT = "xend-it",
  UN_XEND_IT = "un-xend-it",
}

export type Payload<Data> = {
  type: PayloadType;
  data: Data;
};

export type Payloads =
  | Payload<CurrentPeerPayloadData>
  | Payload<AllPeersPayloadData>
  | Payload<PeerJoinedPayloadData>
  | Payload<PeerLeftPayloadData>
  | Payload<XendItPayload>;
