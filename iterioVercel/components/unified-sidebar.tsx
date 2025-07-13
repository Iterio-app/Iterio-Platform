import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  EyeOff, 
  Info, 
  Calculator, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { HelpContent } from "./help-content";
import { SummaryContent } from "./summary-content";
import { FormDataProps } from "@/lib/types";

// Tipo para las props del sidebar - consistente con FormDataForSidebar
interface UnifiedSidebarProps extends FormDataProps {
  visible: boolean;
  onToggle: () => void;
  helpErrors: number;
  summaryItems: number;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  visible,
  onToggle,
  formData,
  helpErrors,
  summaryItems,
}) => {
  const [activeTab, setActiveTab] = useState<'help' | 'summary'>('help');

  if (!visible) return null;

  return (
    <Card className="bg-white shadow-lg border-0 w-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {activeTab === 'help' ? (
              <Info className="h-5 w-5 text-blue-600" />
            ) : (
              <Calculator className="h-5 w-5 text-blue-600" />
            )}
            {activeTab === 'help' ? 'Ayuda del formulario' : 'Resumen de cotización'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <EyeOff className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'help' | 'summary')}>
          <TabsList className="grid grid-cols-2 w-full mb-4 bg-gray-50 rounded-lg">
            <TabsTrigger value="help" className="flex items-center gap-2 justify-center">
              <Info className="h-4 w-4" />
              Ayuda
              {helpErrors > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {helpErrors}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2 justify-center">
              <Calculator className="h-4 w-4" />
              Resumen
              {summaryItems > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {summaryItems}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="mt-0">
            <div className="max-h-[700px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <HelpContent formData={formData} />
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <div className="max-h-[700px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <SummaryContent formData={formData} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 