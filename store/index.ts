"use client"
import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth-slice";

interface auth { isLoggedIn : boolean; }

export interface RootState {
    auth : auth;
}

const store = configureStore({
    reducer : {
        auth : authSlice.reducer,
    },
});

export default store;