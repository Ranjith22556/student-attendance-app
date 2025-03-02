import React from 'react'

export function Footer() {
  return (
    <footer className="w-full py-4 border-t mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Studance
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Developed by Y. Ranjith Kumar Reddy & N. Bhupathi Reddy
          </p>
        </div>
      </div>
    </footer>
  )
} 