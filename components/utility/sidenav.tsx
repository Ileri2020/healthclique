"use client"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import { CiMenuFries } from "react-icons/ci"
import Links from "../../data/links";
import { ModeToggle } from '@/components/ui/mode-toggle'
import { usePathname } from 'next/navigation';
import { GlobalSearch } from "../myComponents/subs/GlobalSearch"
import { useEffect, useState } from "react"
import axios from "axios"
import { ChevronRight, LayoutGrid, Stethoscope, Tag, ShoppingCart, MessageSquare, Camera } from "lucide-react"
import { Cart } from "../myComponents/subs/cart"
import { Button } from "../ui/button";
import { SnapPrescription } from "../myComponents/subs/SnapPrescription";

const Sidenav = () => {
    const pathname = usePathname();
    const [categories, setCategories] = useState<any[]>([]);
    const [concerns, setConcerns] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllConcerns, setShowAllConcerns] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await axios.get("/api/dbhandler?model=category");
                setCategories(catRes.data);

                const prodRes = await axios.get("/api/dbhandler?model=product");
                const allProducts = prodRes.data;
                const uniqueConcerns = Array.from(new Set(allProducts.flatMap((p: any) => p.healthConcerns || []))) as string[];
                setConcerns(uniqueConcerns);
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
            }
        };
        fetchData();
    }, []);

    const closeSheet = () => setOpen(false);

    const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);
    const displayedConcerns = showAllConcerns ? concerns : concerns.slice(0, 10);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="flex justify-center items-center text-[32px] text-accent p-2 hover:bg-accent/10 rounded-xl transition-all">
                <CiMenuFries />
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[400px] p-0 gap-0 border-r-0 shadow-2xl">
                <SheetHeader className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
                    <SheetTitle className="text-left text-2xl font-black text-primary tracking-tighter italic">Health <span className="text-accent">Clique</span></SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-2 md:px-4 py-2 space-y-3 scrollbar-hide">
                    {/* Cart & Talk Action */}
                    <div className="flex gap-2 md:gap-4">
                        <Cart className="flex-1" />
                        <Link 
                            href="/contact" 
                            onClick={closeSheet}
                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-accent text-accent-foreground rounded-2xl text-sm font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </Link>
                    </div>

                    {/* Search Section */}
                    <div className="space-y-3 bg-muted/30 p-4 rounded-3xl border border-border/50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                             Quick Find
                        </h3>
                        <GlobalSearch placeholder="Find meds..." className="h-12 rounded-2xl border-none shadow-sm focus-visible:ring-primary" />
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-2">Main Menu</h3>
                        <nav className="flex flex-col gap-1">
                            {Links.Links.map((link, index) => (
                                <Link 
                                    href={link.path} 
                                    key={index} 
                                    onClick={closeSheet}
                                    className={`${link.path === pathname ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground hover:bg-muted"} flex items-center justify-between p-4 rounded-2xl transition-all group`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl border ${link.path === pathname ? "bg-white/20 border-white/30" : "bg-muted border-border group-hover:border-primary/30 group-hover:bg-primary/5"} transition-all`}>
                                            <span className="text-xl shrink-0">{link.name}</span>
                                        </div>
                                        <span className="font-bold tracking-tight">{link.title}</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-all ${link.path === pathname ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Categories Section */}
                    {categories.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-2">
                                <LayoutGrid className="w-4 h-4" />
                                Cartegories
                            </h3>
                            <div className="grid grid-cols-1 gap-1">
                                {displayedCategories.map((category) => (
                                    <Link 
                                        key={category.id}
                                        href={`/store?category=${category.id}`}
                                        onClick={closeSheet}
                                        className="text-sm p-3 hover:bg-muted rounded-xl flex items-center justify-between group transition-all"
                                    >
                                        <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">{category.name}</span>
                                        <span className="text-[10px] font-bold bg-muted border border-border/50 group-hover:bg-primary/10 group-hover:text-primary px-2.5 py-1 rounded-full transition-all">{category._count?.products || 0}</span>
                                    </Link>
                                ))}
                            </div>
                            {categories.length > 10 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="w-full text-xs font-bold text-primary hover:bg-primary/5 mt-2"
                                >
                                    {showAllCategories ? "Show Less" : `Show More (${categories.length - 10} more)`}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Health Concerns Section */}
                    {concerns.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-2">
                                <Stethoscope className="w-4 h-4" />
                                Health Concern
                            </h3>
                            <div className="flex flex-wrap gap-2 px-2 pb-2">
                                {displayedConcerns.map((concern) => (
                                    <Link 
                                        key={concern}
                                        href={`/store?concern=${concern}`}
                                        onClick={closeSheet}
                                        className="text-xs px-4 py-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full border border-border/50 transition-all font-bold"
                                    >
                                        {concern}
                                    </Link>
                                ))}
                            </div>
                            {concerns.length > 10 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowAllConcerns(!showAllConcerns)}
                                    className="w-full text-xs font-bold text-primary hover:bg-primary/5"
                                >
                                    {showAllConcerns ? "Show Less" : `Show More (${concerns.length - 10} more)`}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-muted/20">
                    <SnapPrescription>
                        <Button className="w-full flex items-center gap-3 h-12 rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 font-bold">
                            <Camera className="w-5 h-5" />
                            Snap Prescription
                        </Button>
                    </SnapPrescription>
                </div>

                <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">© 2026 Health Clique</p>
                    <ModeToggle />
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Sidenav
