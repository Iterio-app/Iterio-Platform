"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PreviewModalProps {
  pdfUrl: string
  onClose: () => void
}

export default function PreviewModal({ pdfUrl, onClose }: PreviewModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Vista Previa del PDF</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe src={pdfUrl} className="w-full h-full border rounded-lg" title="Vista previa del PDF" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
