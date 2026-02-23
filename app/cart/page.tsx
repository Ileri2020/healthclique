"use client"
import { motion } from "framer-motion"
import { CartItems } from '@/components/myComponents/subs/index';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PayDrawer } from "@/components/myComponents/paydrawer";
import { BookDrawer } from "../../components/myComponents/bookdrawer";
import { CreditFacilityDrawer } from "@/components/myComponents/credit-facility-drawer";
import { Booked } from "@/components/myComponents/booked";
import { useAppContext } from "@/hooks/useAppContext";
import { PRICE_MARKUPS } from "@/lib/stock-pricing";
import { useCart } from "@/hooks/use-cart";
import { FileText, Upload, AlertTriangle } from "lucide-react";
import { useState } from "react"
import { toast } from "sonner"

const Cart = () => {
  const { items, subtotal } = useCart();
  const { user } = useAppContext();

  const role = (user?.role || "customer") as string;
  const markup = PRICE_MARKUPS[role as keyof typeof PRICE_MARKUPS] || 1.3;

  const isWholesaleRole =
    role.toLowerCase() === "wholesaler" ||
    role.toLowerCase() === "professional" ||
    role.toLowerCase() === "institution";
  const meetsHighOrder = subtotal >= 1_000_000;
  const showCreditFacility = isWholesaleRole || meetsHighOrder;

  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const hasPrescriptionItems = items.some(item => item.regulatoryClassification === "Prescription Medicine");

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Prescription image must be under 2MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/product", {
        method: "POST",
        body: formData,
      });
      // Re-using the product API for upload for now or a generic one if exists
      // Realistically we'd have a prescription-specific upload API
      setPrescriptionImage(URL.createObjectURL(file));
      toast.success("Prescription uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload prescription");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip"
    >
        {items.length < 1 ?
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="text-2xl font-bold">No stock in cart</div>
            <div className="text-muted-foreground">Click to view booked orders</div>
            <div><Booked /></div>
          </div>
          :
          <div className="container mx-auto px-4 py-8">
            <ScrollArea className="mx-auto max-w-3xl max-h-[65vh] flex flex-col pr-4">
              {items.map((item, index)=>{
                return(
                  <CartItems 
                    name={item.name} 
                    price={item.price} 
                    qty={item.quantity} 
                    id={item.id} 
                    totalPrice={item.price * item.quantity} 
                    img={item.img} 
                    key={item.id}
                  />
                )
              })}
            </ScrollArea>

            {hasPrescriptionItems && (
              <div className="mx-auto max-w-3xl mt-6 p-6 border-2 border-dashed border-destructive/30 rounded-2xl bg-destructive/5 space-y-4">
                <div className="flex items-center gap-3 text-destructive">
                  <FileText className="h-6 w-6" />
                  <h3 className="text-lg font-bold">Prescription Required</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  One or more items in your cart require a valid medical prescription. Please upload a clear image of your prescription to proceed.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-48 aspect-[3/4] bg-muted rounded-xl border overflow-hidden flex items-center justify-center">
                    {prescriptionImage ? (
                      <img src={prescriptionImage} alt="Uploaded prescription" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs">No upload yet</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/50"
                      onClick={() => document.getElementById('prescription-input')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Select Prescription Image"}
                    </Button>
                    <input 
                      id="prescription-input" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePrescriptionUpload}
                    />
                    <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-tight">
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                      Note: Our pharmacists will verify this prescription before dispensing your medication.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mx-auto max-w-3xl flex flex-col mt-5 gap-4">
                <div className="flex flex-col gap-3 border-t pt-4">
                  <div className="flex flex-row justify-between items-center">
                    <div className="text-lg">
                      Total:{" "}
                      <span className="text-accent text-2xl font-bold ml-2">
                        ₦ {subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row flex-wrap gap-2">
                    <Booked />
                    <BookDrawer
                      cart={items}
                      prescriptionUrl={prescriptionImage}
                    />
                    <PayDrawer
                      cart={items}
                      disabled={hasPrescriptionItems && !prescriptionImage}
                    />
                    {showCreditFacility && (
                      <CreditFacilityDrawer />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
    </motion.section>
  )
}

export default Cart
