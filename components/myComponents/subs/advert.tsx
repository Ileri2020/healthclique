"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AiOutlineEdit, AiOutlinePlus, AiOutlineDelete, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Advertext {
  id: string;
  text: string;
  order: number;
  active: boolean;
}

const Advert = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [adverts, setAdverts] = useState<Advertext[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAdverts, setEditingAdverts] = useState<Advertext[]>([]);

  useEffect(() => {
    fetchAdverts();
  }, []);

  const fetchAdverts = async () => {
    try {
      const res = await fetch("/api/advertexts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdverts(data);
        setEditingAdverts(data);
      }
    } catch (error) {
      console.error("Failed to fetch adverts", error);
    }
  };

  useEffect(() => {
    if (adverts.length <= 1 || isEditing) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % adverts.length);
        setFade(true);
      }, 500); // match transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [adverts.length, isEditing]);

  const handleSave = async (item: Advertext) => {
    try {
      await fetch(`/api/advertexts/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      fetchAdverts();
    } catch (error) {
      console.error("Save error", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/advertexts/${id}`, { method: "DELETE" });
      fetchAdverts();
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleAdd = async () => {
    try {
      await fetch("/api/advertexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "New Advert", order: adverts.length }),
      });
      fetchAdverts();
    } catch (error) {
      console.error("Add error", error);
    }
  };

  if (isEditing && isAdmin) {
    return (
      <div className="w-full bg-accent/90 p-4 border-b">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-background">Manage Advertexts</h3>
            <Button size="sm" onClick={() => setIsEditing(false)} variant="secondary">
              <AiOutlineClose className="mr-2" /> Close Editor
            </Button>
          </div>
          <div className="space-y-2">
            {editingAdverts.map((adv, idx) => (
              <div key={adv.id} className="flex gap-2 items-center bg-background/20 p-2 rounded">
                <Input
                  className="flex-1"
                  value={adv.text}
                  onChange={(e) => {
                    const newAdverts = [...editingAdverts];
                    newAdverts[idx].text = e.target.value;
                    setEditingAdverts(newAdverts);
                  }}
                />
                <Input
                  type="number"
                  className="w-16"
                  value={adv.order}
                  onChange={(e) => {
                    const newAdverts = [...editingAdverts];
                    newAdverts[idx].order = parseInt(e.target.value);
                    setEditingAdverts(newAdverts);
                  }}
                />
                <Button size="icon" variant="ghost" className="text-white hover:bg-green-500" onClick={() => handleSave(adv)}>
                  <AiOutlineCheck />
                </Button>
                <Button size="icon" variant="ghost" className="text-white hover:bg-red-500" onClick={() => handleDelete(adv.id)}>
                  <AiOutlineDelete />
                </Button>
              </div>
            ))}
            <Button className="w-full" onClick={handleAdd}>
              <AiOutlinePlus className="mr-2" /> Add New Text
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-accent/50 h-[30px] flex items-center justify-center relative overflow-hidden">
      <div
        className={`text-background text-sm font-semibold transition-opacity duration-500 ease-in-out px-4 py-1 rounded-md bg-white/10 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {adverts.length > 0 ? adverts[currentIndex].text : "Welcome to Health Clique!"}
      </div>
      {isAdmin && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          title="Edit Adverts"
        >
          <AiOutlineEdit />
        </button>
      )}
    </div>
  );
};

export default Advert;

