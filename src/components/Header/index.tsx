import React, { useEffect } from "react";
import { FaFileDownload, FaMoon } from "react-icons/fa";
import { IoIosSunny, IoLogoGithub } from "react-icons/io";
import Config from "../../config";
import "./Header.scss";
import Logo from "../../assets/svgs/logo.svg";
import { PeerInfo } from "../../types";

interface Props {
  darkMode: boolean;
  toggleTheme: () => void;
  currentPeer:PeerInfo;
}

const pwaID: string = "install-pwa";

function Header(props: Props): React.ReactElement {
  const { darkMode, toggleTheme, currentPeer } = props;

  useEffect(() => {
    const listener = (event: any): void => {
      const { matches } = window.matchMedia("(display-mode: standalone)");
      if (matches) {
        return event.preventDefault();
      } else {
        const button: HTMLElement | null = document.getElementById(pwaID);
        if (button) {
          button.onclick = () => event.prompt();
        }

        return event.preventDefault();
      }
    };

    window.addEventListener("beforeinstallprompt", listener);

    return () => {
      window.removeEventListener("beforeinstallprompt", listener);
    };
  }, []);

  const openGithub = (): void => {
    window.open(Config.github, "_blank");
  };

  let themeIcon: React.ReactNode = (
    <IoIosSunny className="icon" onClick={toggleTheme} size={30} />
  );

  if (darkMode) {
    themeIcon = <FaMoon className="icon" onClick={toggleTheme} size={20} />;
  }
  const handleDownload = () => {
    const bc = new BroadcastChannel("EVENT");
    bc.postMessage({
      type: "XEND:DOWNLOAD",
      peerId: currentPeer.id
    });
  };
  return (
    <header>
      <span className="logo-cont">
        <img className="airdrop-logo" src={Logo} /> <h2>Bitxend</h2>
      </span>
      <div className="icons">
        {
          <FaFileDownload
            id={pwaID}
            className="icon"
            size={27}
            onClick={handleDownload}
          />
        }
        {themeIcon}
        <IoLogoGithub className="icon" size={24} onClick={openGithub} />
      </div>
    </header>
  );
}

export default Header;
