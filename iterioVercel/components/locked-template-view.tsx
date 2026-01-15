"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface LockedTemplateViewProps {
  onUnlock: () => void
}

export default function LockedTemplateView({ onUnlock }: LockedTemplateViewProps) {
  return (
    <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
      <Card className="w-full max-w-lg text-center shadow-xl border-t-4 border-blue-500">
        <CardHeader>
          <div className="mx-auto bg-blue-100 rounded-full p-4 w-fit">
            <Lock className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold text-gray-800">Plantilla Protegida</CardTitle>
          <CardDescription className="mt-2 text-lg text-gray-600">
            Estás utilizando una plantilla guardada. La edición está desactivada para proteger el diseño original.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="text-base text-gray-700 mb-8">
            Si necesitas hacer cambios, puedes <span className="font-semibold text-blue-600">desbloquear la edición solo para esta cotización</span>. Tus cambios no afectarán a la plantilla original.
          </p>
          <Button onClick={onUnlock} size="lg" className="w-full text-lg">
            Desbloquear y Editar para esta Cotización
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
