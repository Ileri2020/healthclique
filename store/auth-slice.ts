"use client"
import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
    name : "auth",
    initialState : {isLoggedIn : false},
    reducers : {
        login(state :any) {
            state.isLoggedIn = true;
        },
        logout(state : any) {
            state.isLoggedIn = false
        },
    }
});

export const authActions = authSlice.actions;

export default authSlice;

//export type auth = ReturnType<typeof authSlice.initialState>