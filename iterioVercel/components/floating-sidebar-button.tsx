import React from "react";
import { Button } from "@/components/ui/button";
import { Info, Calculator, AlertTriangle } from "lucide-react";

interface FloatingSidebarButtonProps {
  onShow: () => void;
  helpErrors: number;
  summaryItems: number;
  hasActiveAlerts: boolean;
}

export const FloatingSidebarButton: React.FC<FloatingSidebarButtonProps> = ({
  onShow,
  helpErrors,
  summaryItems,
  hasActiveAlerts,
}) => {
  const getButtonContent = () => {
    if (helpErrors > 0) {
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        text: `${helpErrors} error${helpErrors !== 1 ? 'es' : ''}`,
        variant: "destructive" as const,
        className: "bg-red-500 hover:bg-red-600 text-white shadow-lg"
      };
    }
    
    if (summaryItems > 0) {
      return {
        icon: <Calculator className="h-5 w-5" />,
        text: "Ver resumen",
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
      };
    }
    
    return {
      icon: <Info className="h-5 w-5" />,
      text: "Ayuda",
      variant: "secondary" as const,
      className: "bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-lg"
    };
  };

  const content = getButtonContent();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onShow}
        variant={content.variant}
        className={`${content.className} rounded-full px-4 py-3 flex items-center gap-2 transition-all duration-200 hover:scale-105`}
      >
        {content.icon}
        <span className="font-medium">{content.text}</span>
      </Button>
    </div>
  );
}; 