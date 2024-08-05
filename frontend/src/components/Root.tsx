import type { FC } from "react";
import { SDKProvider } from "@telegram-apps/sdk-react";

import { App } from "./App";

export const Root: FC = () => (
  <SDKProvider acceptCustomStyles>
    <App />
  </SDKProvider>
);
