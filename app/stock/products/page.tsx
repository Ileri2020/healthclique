"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ProductAvailability = {
  productName: string
  availablePieces: number
  cartons: number
  packs: number
  pieces: number
  packsPerCarton: number
  piecesPerPack: number
}

export default function StockProductsPage() {
  const [products, setProducts] = useState<ProductAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/inventory/products/availability")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load products")
        return response.json()
      })
      .then(setProducts)
      .catch(() => setError("Unable to load stock products."))
      .finally(() => setLoading(false))
  }, [])

  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Inventory overview</p><h1 className="text-3xl font-bold">Stock products</h1><p className="text-sm text-muted-foreground">Available quantity after recorded sales.</p></div>
      <Button variant="outline" asChild><Link href="/stock">Back to stock</Link></Button>
    </div>
    <div className="overflow-x-auto rounded-lg border">
      <Table className="bg-foreground/20">
        <TableHeader><TableRow><TableHead className="w-12">S/N</TableHead><TableHead className="w-[200px] min-w-[200px] max-w-[200px]">Product name</TableHead><TableHead>Available quantity</TableHead><TableHead>Total pieces</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={4}>Loading stock products...</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={4}>{error}</TableCell></TableRow> : products.length === 0 ? <TableRow><TableCell colSpan={4}>No saved stock products found.</TableCell></TableRow> : products.map((product, index) => <TableRow key={product.productName}><TableCell>{index + 1}</TableCell><TableCell className="w-[200px] min-w-[200px] max-w-[200px] truncate font-medium">{product.productName}</TableCell><TableCell>{product.cartons} carton{product.cartons === 1 ? "" : "s"}, {product.packs} pack{product.packs === 1 ? "" : "s"}, {product.pieces} pcs</TableCell><TableCell>{product.availablePieces.toLocaleString()}</TableCell></TableRow>)}
        </TableBody>
      </Table>
    </div>
  </main>
}
