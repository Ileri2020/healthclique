"use client";

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, CheckCircle2, ShoppingCart, X } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner"; // Assuming sonner is used for toasts, otherwise I can use alert or a custom toast

export const SnapPrescription = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;

    setLoading(true);
    setStatus("Fetching API key...");
    setResults([]);

    try {
      // 1. Get Gemini API Key
      const { data: { apiKey } } = await axios.get("/api/keys/gemini");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      setStatus("Analyzing image with AI...");
      
      // Convert base64 to parts for Gemini
      const base64Data = image.split(",")[1];
      const part = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `
        Analyze this medical prescription or list of pharmaceutical products. 
        Extract the list of products mentioned. 
        For each product, provide:
        - name: The name of the product.
        - quantity: The quantity requested (default to 1 if not specified).
        - grams: The dosage or strength (e.g., 500mg, 10ml) if specified.
        
        Return ONLY a JSON object in this format:
        {
          "products": [
            { "name": "Product Name", "quantity": 1, "grams": "500mg" }
          ]
        }
      `;

      const result = await model.generateContent([prompt, part]);
      const response = await result.response;
      const text = response.text();
      
      // Clean the text from potential markdown code blocks
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      if (!parsed.products || parsed.products.length === 0) {
        throw new Error("No products found in the image.");
      }

      setStatus("Searching for products in our store...");
      
      // 2. Search for products on our server
      const { data: { products: foundProducts } } = await axios.post("/api/products/search-batch", {
        products: parsed.products
      });

      if (foundProducts.length === 0) {
        throw new Error("None of the products found in the image are available in our store.");
      }

      setResults(foundProducts);
      setStatus("Done!");

      // 3. Automatically add to cart
      foundProducts.forEach((p: any) => {
        addItem({
          id: p.id,
          name: p.name,
          price: p.price,
          images: p.images,
          category: p.category,
        }, p.requestedQuantity || 1);
      });

      toast.success(`${foundProducts.length} products added to cart!`);
      
    } catch (error: any) {
      console.error("Processing error:", error);
      setStatus("Error: " + (error.message || "Failed to process image"));
      toast.error("Failed to process prescription. Please try again or type manually.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setStatus("");
    setResults([]);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) reset(); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Snap Prescription
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          {!image ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div 
                className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-2xl flex flex-col items-center justify-center gap-3 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Upload / Drop Image</p>
                  <p className="text-sm text-muted-foreground">Prescription or product list</p>
                </div>
              </div>
              
              {/* Separate Hidden Inputs */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={cameraInputRef} 
                onChange={handleFileChange}
                capture="environment"
              />

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="h-12 rounded-xl gap-2 font-bold border-2"
                    onClick={() => cameraInputRef.current?.click()}
                >
                    <Camera className="w-5 h-5" />
                    Use Camera
                </Button>
                <Button 
                    variant="outline" 
                    className="h-12 rounded-xl gap-2 font-bold border-2"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-5 h-5" />
                    Upload Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border bg-muted">
                <img src={image} alt="Prescription" className="w-full h-full object-contain" />
                {!loading && (
                    <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={() => setImage(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
              </div>
              
              {!status && (
                <Button 
                    className="w-full h-12 rounded-xl text-lg font-bold"
                    onClick={processImage}
                >
                    Start AI Processing
                </Button>
              )}

              {status && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${status.includes("Error") ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/5 border-primary/20 text-primary"}`}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span className="font-medium">{status}</span>
                  </div>

                  {results.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-muted-foreground px-1 uppercase tracking-wider">Identified Products</p>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {results.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{p.name}</span>
                                        <span className="text-xs text-muted-foreground">{p.requestedGrams || p.category?.name || "General"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded-md">Qty: {p.requestedQuantity}</span>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full mt-2 h-10 rounded-xl gap-2 font-bold"
                            onClick={() => setIsOpen(false)}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            View in Cart
                        </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
