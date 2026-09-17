'use client'
import { Provider } from "react-redux";
import store from "@/store";
import ClientApiCache from "@/components/ClientApiCache";

export function Providers({ children } : { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ClientApiCache />
      {children}
    </Provider>
  );
}