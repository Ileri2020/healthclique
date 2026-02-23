"use client";

import React, { useEffect, useRef, useState } from "react";
import { BiLike, BiSolidLike, BiComment } from "react-icons/bi";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TextArea from "@/components/textArea";
import axios from "axios";
import { useAppContext } from "@/hooks/useAppContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaCopy, FaRegCopy, FaPencilAlt, FaTrash } from "react-icons/fa";
import { MdOutlineFileDownload, MdVerified } from "react-icons/md";
import { Input } from "@/components/ui/input";

// Mock Comments component for now or link to real one if exists
const Comments = ({ postId, reload }: { postId: string; reload: boolean }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/api/dbhandler?model=comments&id=${postId}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId, reload]);

  return (
    <div className="space-y-3 mt-4">
      {loading ? (
        <div className="text-sm opacity-50">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm opacity-50 italic">No comments yet.</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="bg-muted/50 p-3 rounded-xl border border-border/50">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs">@{c.username || "user"}</span>
              <span className="text-[10px] opacity-50">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{c.comment}</p>
          </div>
        ))
      )}
    </div>
  );
};

const Post = ({ post }: any) => {
  const { user } = useAppContext();
  const isAdmin = user?.role === "admin";
  
  const [liked, setLiked] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [comment, setComment] = useState("");
  const [reload, setReload] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: post.title || "",
    description: post.description || "",
    category: post.category || "General",
  });

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  // Fetch initial likes
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await axios.get(`/api/dbhandler?model=likes&id=${post.id}`);
        setLikeCount(res.data.length);
        const myLike = res.data.find((l: any) => l.userId === user?.id);
        if (myLike) {
          setLiked(true);
          setLikeId(myLike.id);
        }
      } catch (err) {}
    };
    fetchLikes();
  }, [post.id, user?.id]);

  const handleLike = async () => {
    if (!user || user.email === "nil") return alert("Please login to like");
    
    try {
      if (!liked) {
        const res = await axios.post("/api/dbhandler?model=likes", {
          userId: user.id,
          contentId: post.id,
        });
        setLiked(true);
        setLikeId(res.data.id);
        setLikeCount(prev => prev + 1);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
      } else {
        await axios.delete(`/api/dbhandler?model=likes&id=${likeId}`);
        setLiked(false);
        setLikeId(null);
        setLikeCount(prev => prev - 1);
      }
    } catch (err) {}
  };

  const saveComment = async () => {
    if (!comment.trim()) return;
    try {
      await axios.post("/api/dbhandler?model=comments", {
        userId: user.id,
        username: user.name || "User",
        contentId: post.id,
        comment,
      });
      setComment("");
      setReload(!reload);
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`/api/dbhandler?model=posts&id=${post.id}`);
      window.location.reload();
    } catch (err) {}
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`/api/dbhandler?model=posts&id=${post.id}`, { ...editData, _id: post.id });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {}
  };

      const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-background border rounded-3xl overflow-hidden shadow-xl mb-12 max-w-xl mx-auto group ring-1 ring-border/50 hover:ring-primary/20 transition-all duration-500">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
            <img 
              src={post?.user?.avatarUrl || "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png"}
              className="w-full h-full rounded-full object-cover"
              alt="avatar"
            />
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-1">
              {post?.user?.name || "Author"}
              <MdVerified className="text-primary h-3 w-3" />
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              {post.category} • {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setIsEditing(true)}>
              <FaPencilAlt className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-destructive" onClick={handleDelete}>
              <FaTrash className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Post Media */}
      <div className="relative aspect-video bg-muted/10 flex items-center justify-center overflow-hidden" onDoubleClick={handleLike}>
        {post.type === "image" && (
          <img
            src={post.contentUrl || post.url}
            className="w-full h-full object-cover select-none"
            alt="post content"
          />
        )}
        {post.type === "video" && (
          <video
            ref={mediaRef as any}
            src={post.contentUrl || post.url}
            controls
            className="w-full h-full"
          />
        )}
        {post.type === "audio" && (
          <div className="flex flex-col items-center gap-4 bg-muted/40 p-8 w-full h-full justify-center">
            <div className="text-primary italic font-serif text-xl border-b-2 border-primary px-4 pb-2">
              Podcast Audio
            </div>
            <audio
              ref={mediaRef as any}
              src={post.contentUrl || post.url}
              controls
              className="w-full"
            />
          </div>
        )}

        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute pointer-events-none"
            >
              <BiSolidLike className="text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" size={120} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Content */}
      <div className="p-5">
        {post.title && <h3 className="text-lg font-black mb-1 line-clamp-1">{post.title}</h3>}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{post.description}</p>
        
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button 
              variant={liked ? "default" : "secondary"} 
              size="sm" 
              className={`rounded-full gap-2 transition-all ${liked ? 'shadow-lg shadow-primary/30' : ''}`}
              onClick={handleLike}
            >
              {liked ? <BiSolidLike /> : <BiLike />}
              <span className="font-bold">{likeCount}</span>
            </Button>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-full gap-2">
                  <BiComment />
                  <span className="font-bold">Chat</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-xl mx-auto px-6 pb-10">
                <DrawerHeader>
                  <DrawerTitle className="text-center text-2xl font-black">Community Discussion</DrawerTitle>
                </DrawerHeader>
                <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                   <Comments postId={post.id} reload={reload} />
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <TextArea 
                    placeholder="Contribute to the clinical discussion..." 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button onClick={saveComment} className="w-full font-bold">Post Comment</Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <ShareLink url={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog#${post.id}`} />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogTitle>Edit Clinical Post</DialogTitle>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
              <Input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
              <TextArea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
              <select 
                className="w-full p-2 rounded-md border bg-background"
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
              >
                <option value="General">General</option>
                <option value="Pharmaceutical">Pharmaceutical</option>
                <option value="Wellness">Wellness</option>
                <option value="Research">Research</option>
                <option value="News">Medical News</option>
              </select>
            </div>
            <Button onClick={handleSaveEdit} className="w-full mt-4">Save Clinical Updates</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ShareLink = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="rounded-full gap-2 group">
      {copied ? <FaCopy className="text-primary" /> : <FaRegCopy className="group-hover:text-primary transition-colors" />}
      <span className="text-xs font-bold">{copied ? "Copied!" : "Share"}</span>
    </Button>
  );
};

export default Post;
