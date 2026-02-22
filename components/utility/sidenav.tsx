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
import { ChevronRight, LayoutGrid, Stethoscope, Tag, ShoppingCart, MessageSquare } from "lucide-react"
import { Cart } from "../myComponents/subs/cart"

const Sidenav = () => {
    const pathname = usePathname();
    const [categories, setCategories] = useState<any[]>([]);
    const [concerns, setConcerns] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await axios.get("/api/dbhandler?model=category");
                setCategories(catRes.data);

                const prodRes = await axios.get("/api/dbhandler?model=product");
                const allProducts = prodRes.data;
                const uniqueConcerns = Array.from(new Set(allProducts.flatMap((p: any) => p.healthConcerns || []))) as string[];
                setConcerns(uniqueConcerns.slice(0, 10)); // Top 10 concerns
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <Sheet>
            <SheetTrigger className="flex justify-center items-center text-[32px] text-accent">
                <CiMenuFries />
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[400px] p-0 gap-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-left text-2xl font-bold text-primary">Health Clique</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                    {/* Cart & Talk Action */}
                    <div className="flex gap-4">
                        <Cart className="flex-1" />
                        <Link href="/contact" className="flex-1 flex items-center justify-center gap-2 p-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent/90 transition-all">
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </Link>
                    </div>

                    {/* Search Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            Search
                        </h3>
                        <GlobalSearch placeholder="Find meds..." className="h-10" />
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</h3>
                        <nav className="flex flex-col gap-2">
                            {Links.Links.map((link, index) => (
                                <Link 
                                    href={link.path} 
                                    key={index} 
                                    className={`${link.path === pathname ? "bg-accent/10 text-accent font-bold" : "text-muted-foreground hover:bg-muted"} flex items-center justify-between p-3 rounded-xl transition-all group`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="capitalize">{link.name}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Categories Section */}
                    {categories.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                Categories
                            </h3>
                            <div className="flex flex-col gap-1">
                                {categories.map((category) => (
                                    <Link 
                                        key={category.id}
                                        href={`/store?category=${category.id}`}
                                        className="text-sm p-2 hover:bg-muted rounded-lg flex items-center justify-between group"
                                    >
                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{category.name}</span>
                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{category._count?.products || 0}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Health Concerns Section */}
                    {concerns.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Health Concerns
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {concerns.map((concern) => (
                                    <Link 
                                        key={concern}
                                        href={`/store?concern=${concern}`}
                                        className="text-xs px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-full border border-border/50 transition-colors"
                                    >
                                        {concern}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">© 2024 Health Clique</p>
                    <ModeToggle />
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Sidenav
