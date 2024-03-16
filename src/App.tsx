import React from "react";
import ReactDOM from "react-dom";
import { Home } from "./pages";
import "./global/main.scss";
import "react-circular-progressbar/dist/styles.css";
import * as serviceWorker from "./serviceWorker";
import { SnackbarProvider } from "notistack";

function App(): React.ReactElement {
  return (
    <SnackbarProvider maxSnack={1}>
      <Home />
    </SnackbarProvider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.register();

export default App;
