import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#dcdce2] p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-[#fefffa]">
        <CardHeader className="text-center pb-8">
          <div className="mb-4">
            <img
              src="/images/logo-iterio.png"
              alt="Iterio Logo"
              className="h-[10rem] w-auto mx-auto rounded-xl"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 mb-4">
            ¡Gracias por confirmar tu email!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-slate-600">
            Tu cuenta está pendiente de aprobación por un administrador.
          </p>
          <p className="text-slate-600">
            Recibirás un email cuando tu cuenta sea aprobada y puedas comenzar a usar Iterio.
          </p>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-700 text-sm">
              Este proceso puede tomar hasta 24 horas hábiles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 