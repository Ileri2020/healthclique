"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, Bell, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const NotificationUI = () => {
    const { user } = useAppContext();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    const isAdmin = user.role === "admin" || user.role === "staff" || user.role === "professional";

    useEffect(() => {
        if (!user?.id || user.id === 'nil') return;

        const checkMessages = async () => {
            try {
                const res = await axios.get("/api/dbhandler?model=message");
                const allMessages = res.data;
                
                const unread = allMessages.filter((msg: any) => {
                    // If admin, check for messages where they are receiver and unread
                    // If customer, check for messages where they are receiver and unread
                    return msg.receiverId === user.id && !msg.isRead;
                });

                if (unread.length > unreadCount && unreadCount === 0) {
                    setShowToast(true);
                }
                
                setUnreadCount(unread.length);
            } catch (error) {
                console.error("Error checking notifications:", error);
            }
        };

        checkMessages();
        const interval = setInterval(checkMessages, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [user?.id, unreadCount]);

    return (
        <>
            {/* Unread Indicator in UI */}
            <div className="fixed top-4 right-20 z-[60]">
                <Link href="/contact">
                   <div className="relative p-2 bg-background/80 backdrop-blur-md rounded-full border border-primary/20 shadow-lg hover:scale-110 transition-transform cursor-pointer group">
                        <Bell className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black border-2 border-background animate-bounce bg-destructive">
                                {unreadCount}
                            </Badge>
                        )}
                   </div>
                </Link>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {showToast && unreadCount > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed bottom-24 left-6 z-[70] w-full max-w-[320px]"
                    >
                        <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-1 opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setShowToast(false)}>
                                <X size={16} />
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <MessageSquare size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <p className="font-black text-sm">New Messages!</p>
                                    <p className="text-xs opacity-90 font-medium">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''} from {isAdmin ? 'a patient' : 'the pharmacist'}.</p>
                                </div>
                            </div>

                            <Link href="/contact" onClick={() => setShowToast(false)}>
                                <Button variant="secondary" className="w-full h-10 rounded-xl font-black text-xs gap-2 group/btn shadow-lg">
                                    Open Chat Section
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            
                            {/* Visual highlight */}
                            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
