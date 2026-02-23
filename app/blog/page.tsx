"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Posts from "@/components/myComponents/subs/posts";
import { PostButton } from "@/components/myComponents/subs/fileupload";
import { useAppContext } from "@/hooks/useAppContext";
import { motion } from "framer-motion";

const BlogPage = () => {
  const { user } = useAppContext();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("General");

  const categories = [
    "General",
    "Pharmaceutical",
    "Wellness",
    "Research",
    "News"
  ];

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12 text-center"
      >
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
          Clinical <span className="text-primary italic">Insights</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm md:text-base font-medium">
          Professional knowledge base for pharmaceutical updates, clinical research, and healthcare wellness strategies.
        </p>
      </motion.div>

      <Tabs 
        defaultValue="General" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex flex-col lg:flex-row gap-12"
      >
        <div className="lg:w-1/4 space-y-6">
          <div className="bg-muted/30 p-2 rounded-[2.5rem] border border-border/50 sticky top-24">
            <TabsList className="flex flex-col h-auto bg-transparent gap-2 p-2">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat}
                  value={cat} 
                  className="w-full justify-start px-6 py-4 rounded-full font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg active:scale-95"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {isAdmin && (
              <div className="mt-6 px-4 pb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-2">Admin Actions</div>
                <PostButton />
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-3/4">
          <ScrollArea className="h-full pr-4">
            {categories.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-0 focus-visible:outline-none">
                <Posts category={cat} />
              </TabsContent>
            ))}
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
};

export default BlogPage;
