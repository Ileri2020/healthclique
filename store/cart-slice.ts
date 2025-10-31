"use client"
import { createSlice } from "@reduxjs/toolkit";

type cart = {
    id: string;
    price: number;
    quantity : number;
    totalPrice : number;
    name : string;
    img : string;
}

let itemslist : cart[] = [];


const cartSlice = createSlice({
    name : "cart",
    initialState : {
        itemsList : itemslist,
        totalQuantity : 0,
        showCart : false
    },
    reducers : {
        addToCart(state, action) {
            const newItem = action.payload;
            //check if any item is already available
            const existingItem = state.itemsList.find((item)=>item.id === newItem.id);
            if (existingItem){
                existingItem.quantity++;
                existingItem.totalPrice += newItem.price;
            } else {
                state.itemsList.push({
                    id: newItem.id,
                    price: newItem.price,
                    quantity : 1,
                    totalPrice : newItem.price,
                    name : newItem.name,
                    img : newItem.img
                })
            }
        },
        subFromCart(state, action) {
            const newItem = action.payload;
            //check if any item is already available
            const existingItem = state.itemsList.find((item)=>item.id === newItem.id);
            if (existingItem){
                if (existingItem.quantity > 1){
                    existingItem.quantity--;
                    existingItem.totalPrice -= newItem.price;
                } else{
                    state.itemsList.splice(state.itemsList.indexOf(existingItem),1)
                }
            }
        },
        removeFromCart(state, action) {
            const newItem = action.payload;
            //check if any item is already available
            const existingItem = state.itemsList.find((item)=>item.id === newItem.id);
            if (existingItem){
                state.itemsList.splice(state.itemsList.indexOf(existingItem),1)
            }
        },
        setShowCart(state) {
            state.showCart = true;
        }
    }
})



export const cartActions = cartSlice.actions;

export default cartSlice;