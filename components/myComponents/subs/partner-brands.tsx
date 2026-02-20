"use client";

import React from "react";
import Image from "next/image";

const brands = [
  "Emzor", "GSK", "Pfizer", "Sanofi", "Dana", "May & Baker", "Fidson", "Swiss Pharma",
  "Shalina", "Elbe", "Osworth", "Drugfield"
];

const PartnerBrands = () => {
  return (
    <section className="py-10 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Trusted by Leading Pharmaceutical Brands</h3>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {brands.map((brand) => (
            <div key={brand} className="text-xl font-black text-foreground/40 hover:text-primary transition-colors cursor-default">
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBrands;
