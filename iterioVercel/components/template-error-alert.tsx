import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Wifi, Shield, Database, FileText, XCircle } from "lucide-react"
import type { TemplateError } from "@/hooks/use-templates"

interface TemplateErrorAlertProps {
  error: TemplateError | null
  onDismiss?: () => void
}

const getErrorIcon = (type: TemplateError['type']) => {
  switch (type) {
    case 'AUTH':
      return <Shield className="h-4 w-4" />
    case 'NETWORK':
      return <Wifi className="h-4 w-4" />
    case 'DATABASE':
      return <Database className="h-4 w-4" />
    case 'VALIDATION':
      return <FileText className="h-4 w-4" />
    default:
      return <XCircle className="h-4 w-4" />
  }
}

const getErrorTitle = (type: TemplateError['type']) => {
  switch (type) {
    case 'AUTH':
      return 'Error de autenticación'
    case 'NETWORK':
      return 'Error de conexión'
    case 'DATABASE':
      return 'Error de base de datos'
    case 'VALIDATION':
      return 'Error de validación'
    default:
      return 'Error inesperado'
  }
}

const getErrorVariant = (type: TemplateError['type']) => {
  switch (type) {
    case 'AUTH':
      return 'destructive'
    case 'NETWORK':
      return 'default'
    case 'DATABASE':
      return 'destructive'
    case 'VALIDATION':
      return 'default'
    default:
      return 'destructive'
  }
}

export default function TemplateErrorAlert({ error, onDismiss }: TemplateErrorAlertProps) {
  if (!error) return null

  return (
    <Alert variant={getErrorVariant(error.type)} className="mb-4">
      <div className="flex items-start gap-2">
        {getErrorIcon(error.type)}
        <div className="flex-1">
          <AlertDescription className="font-medium">
            {getErrorTitle(error.type)}
          </AlertDescription>
          <AlertDescription className="text-sm mt-1">
            {error.message}
          </AlertDescription>
          {error.details && (
            <AlertDescription className="text-xs mt-1 opacity-75">
              {error.details}
            </AlertDescription>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  )
} 