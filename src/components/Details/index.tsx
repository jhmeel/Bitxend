import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { PeerInfo, XendItPayload } from "../../types";
import "./Details.scss";
import Logo from "../../assets/svgs/logo.svg";
import Ripple from "../Ripple";
import {
  FaUserAlt,
  FaFileImport,
  FaFile,
  FaInfoCircle,
  FaFileAlt,
  FaFileDownload,
} from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { Connection } from "../../utils";
import axiosInstance from "../../utils/axios";
import { v4 as uuidv4 } from "uuid";
import { BiLoader } from "react-icons/bi";

interface DetailsProps {
  currentPeer: PeerInfo;
  xendFiles?: Array<XendItPayload>;
}

const Details = (props: DetailsProps): React.ReactElement => {
  const { currentPeer, xendFiles } = props;
  const [downloadModalActive, setDownloadModalActive] =
    useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<XendItPayload[] | undefined>(
    xendFiles
  );

  const [xending, setXending] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<{
    filename: string;
    file: Blob | string;
  }>({
    filename: "",
    file: "",
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          file: reader.result as string,
          filename: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    xendit();
  }, [selectedFile]);

  const xendit = async () => {
    try {
      if (selectedFile.file) {
        setXending(true);

        const file: XendItPayload = {
          PeerId: currentPeer.id,
          fileId: uuidv4(),
          filename: selectedFile.filename,
          fileData: selectedFile.file,
        };

        const { data } = await axiosInstance().post("/api/v1/xendit", { file });
        data?.success && Connection.emit("XENDIT", file.fileId);

        setSelectedFile({
          file: "",
          filename: "",
        });
        setXending(false);
        enqueueSnackbar("file shared successfully", { variant: "success" });
      }
    } catch (err) {
      setXending(false);
      console.error(err);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  useEffect(() => {
    const bc = new BroadcastChannel("EVENT");
    bc.addEventListener("message", (event) => {
      if (
        event.data &&
        event.data?.type === "XEND:DOWNLOAD" &&
        event.data?.peerId === currentPeer.id
      ) {
        setDownloadModalActive(!downloadModalActive);
      }
    });
    return () => {
      bc.removeEventListener("message", () => {});
    };
  }, [currentPeer.id, downloadModalActive]);

  const downloadFile = (file: XendItPayload) => {
    try {
      enqueueSnackbar("downloading file", { variant: "info" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([file.fileData]));
      link.download = file.filename;
      document.body.append(link);
      link.click();
      // clean up
      document.body.removeChild(link);
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  const handleOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (xendFiles && searchValue) {
      setSuggestions(
        suggestions?.filter((suggestion) =>
          suggestion?.filename?.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setSuggestions(xendFiles);
    }
  };

  return (
    <div className="details">
      <Ripple>
        <img className="airdrop-logo" src={Logo} alt="airdrop logo" />
      </Ripple>
      <span>
        <FaUserAlt className="icon" /> {currentPeer.name}
      </span>

      {downloadModalActive && (
        <>
          <div className="xend-files">
            <div className="xd-hd">
              <MdCancel
                style={{ cursor: "pointer" }}
                onClick={() => setDownloadModalActive(false)}
              />
              <input
                className="search-bar"
                type="search"
                autoFocus
                onChange={handleOnChange}
                placeholder="search for files..."
              />
            </div>
            <h3>
              <FaFileAlt /> Xendfiles
            </h3>
            <ul className="x-f">
              {xendFiles?.length > 0 ? (
                suggestions?.map((f, i) => (
                  <li key={i}>
                    {f?.filename}{" "}
                    <FaFileDownload
                      onClick={() => downloadFile(f)}
                      title="Download"
                    />
                  </li>
                ))
              ) : (
                <p>No files found</p>
              )}
            </ul>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        hidden
        id="fileInp"
        type="file"
        onChange={handleFileSelect}
      />
      <p className="labell" onClick={handleClick}>
        {selectedFile.file && xending ? (
          <span>
            Xending <BiLoader className="load" />
          </span>
        ) : !selectedFile.file && !xending ? (
          <span>
            <FaFileImport /> Xend it
          </span>
        ) : (
          selectedFile.file &&
          !xending && (
            <span>
              <FaFile /> {selectedFile.filename}
            </span>
          )
        )}
      </p>
      <p className="f-info">
        <FaInfoCircle height={20} width={20} />
        you can be discovered by anyone on the network
      </p>
    </div>
  );
};

export default Details;
