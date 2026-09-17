import type { ButtonHTMLAttributes } from "react"

export function Button({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" }) {
  return <button className={`action ${variant === "secondary" || variant === "outline" ? "secondary" : ""} ${className}`} {...props} />
}
