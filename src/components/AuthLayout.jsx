import React from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, hero, children }) {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {hero ? (
          hero
        ) : (
          <div className="text-center mb-10">
            <BrandLogo size={56} className="mb-4" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
        )}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </main>
  );
}