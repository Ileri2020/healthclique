"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { Send, User as UserIcon, Check, CheckCheck, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/hooks/useAppContext";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    name: string;
    avatarUrl: string;
    role: string;
  };
}

interface ChatPartner {
  id: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
}

export const ChatInterface = () => {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === "admin" || user.role === "professional" || user.role === "staff";

  // Fetch Admin account for customer use
  useEffect(() => {
    if (!isAdmin) {
      const fetchAdmin = async () => {
        try {
          const res = await axios.get("/api/dbhandler?model=user");
          const admins = res.data.filter((u: any) => u.role === "admin" || u.role === "staff");
          if (admins.length > 0) {
            setAdminUser(admins[0]);
            setSelectedPartnerId(admins[0].id);
          }
        } catch (error) {
          console.error("Error fetching admin:", error);
        }
      };
      fetchAdmin();
    }
  }, [isAdmin]);

  // Fetch partners (for admin view)
  const fetchPartners = async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get("/api/dbhandler?model=message");
      const allMessages = res.data;
      
      const partnerMap = new Map<string, ChatPartner>();
      
      allMessages.forEach((msg: any) => {
        const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
        if (!otherUser || otherUser.id === user.id) return;
        
        // We only want to list non-admin users for admins to chat with
        // if (otherUser.role === 'admin') return;

        if (!partnerMap.has(otherUser.id) || new Date(msg.createdAt) > new Date(partnerMap.get(otherUser.id)!.lastMessageTime)) {
          partnerMap.set(otherUser.id, {
            id: otherUser.id,
            name: otherUser.name || "Anonymous",
            avatarUrl: otherUser.avatarUrl,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt
          });
        }
      });
      
      const sortedPartners = Array.from(partnerMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      setPartners(sortedPartners);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async () => {
    if (!selectedPartnerId || !user.id) return;
    try {
      const res = await axios.get(`/api/dbhandler?model=message`);
      const filtered = res.data.filter((msg: any) => 
        (msg.senderId === user.id && msg.receiverId === selectedPartnerId) ||
        (msg.senderId === selectedPartnerId && msg.receiverId === user.id)
      ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(filtered);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Polling
  useEffect(() => {
    fetchPartners();
    fetchMessages();
    const interval = setInterval(() => {
      fetchPartners();
      fetchMessages();
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [selectedPartnerId, user.id]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId || !user.id) return;

    setLoading(true);
    try {
      const payload = {
        content: newMessage,
        senderId: user.id,
        receiverId: selectedPartnerId
      };
      await axios.post("/api/dbhandler?model=message", payload);
      setNewMessage("");
      fetchMessages();
      fetchPartners();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || (adminUser && selectedPartnerId === adminUser.id ? { name: adminUser.name, avatarUrl: adminUser.avatarUrl } : null);

  if (user.email === "nil") {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full max-w-5xl mx-auto border-2 border-dashed rounded-3xl bg-muted/20 gap-6 p-10 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare size={48} className="text-primary opacity-40" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight">Login Required</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            You need to be logged in to chat with our licensed pharmacists and clinical staff.
          </p>
        </div>
        <Link href="/account">
          <Button size="lg" className="h-14 px-8 rounded-xl text-lg font-bold shadow-xl shadow-primary/20">
            Sign In to Chat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] w-full max-w-5xl mx-auto border rounded-3xl overflow-hidden bg-background shadow-2xl">
      {/* Sidebar - Only for Admin */}
      {isAdmin && (
        <div className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedPartnerId && "hidden md:flex"}`}>
          <div className="p-6 border-b bg-background">
            <h2 className="text-xl font-bold text-primary">Conversations</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {partners.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground italic">No conversations yet</div>
              ) : (
                partners.map(partner => (
                  <div 
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-colors border-b hover:bg-accent/50 ${selectedPartnerId === partner.id ? "bg-accent/30 border-l-4 border-l-primary" : ""}`}
                  >
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={partner.avatarUrl} />
                      <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate">{partner.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(partner.lastMessageTime), "HH:mm")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate italic">{partner.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isAdmin && !selectedPartnerId && "hidden md:flex"}`}>
        {selectedPartnerId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 bg-background">
              {isAdmin && (
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedPartnerId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarImage src={selectedPartner?.avatarUrl} />
                <AvatarFallback><UserIcon /></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-sm">{selectedPartner?.name || "Pharmacist"}</h3>
                <p className="text-[10px] text-green-500 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active now
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-muted/5 shadow-inner" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                    <MessageSquare size={40} className="opacity-20" />
                    <p className="text-sm">Start your conversation with {selectedPartner?.name}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.senderId === user.id;
                    const prevMsg = messages[idx - 1];
                    const showTime = !prevMsg || new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000; // 5 min gap

                    return (
                      <div key={msg.id} className="flex flex-col">
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium uppercase tracking-wider">
                              {format(new Date(msg.createdAt), "MMM d, HH:mm")}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}>
                            {msg.content}
                            <div className={`text-[9px] mt-1 flex justify-end gap-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                              {isOwn && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex items-center gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 rounded-full px-6 border-2 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-full shrink-0 shadow-lg" disabled={loading || !newMessage.trim()}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center gap-6">
            <div className="w-32 h-32 rounded-full bg-muted/30 flex items-center justify-center">
              <MessageSquare size={64} className="opacity-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Select a patient to start chatting</h3>
              <p className="max-w-xs mx-auto">Click on one of the conversations on the left to view the message history and reply.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


