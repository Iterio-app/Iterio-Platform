import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  disabledSteps?: number[]; // Índices de pasos deshabilitados
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, disabledSteps = [] }) => {
  return (
    <nav aria-label="Progreso de cotización" className="mb-6">
      <ol className="flex items-center w-full justify-center gap-2 bg-white rounded-xl shadow-md py-3 px-4">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const isDisabled = disabledSteps.includes(idx);
          const isClickable = onStepClick && idx <= currentStep && !isDisabled;
          return (
            <li key={step} className="flex-1 flex flex-col items-center min-w-[90px] relative">
              {/* Línea de conexión detrás del círculo, solo si no es el último paso */}
              {idx !== steps.length - 1 && (
                <span className={`absolute left-1/2 top-1/2 w-full h-0.5 -translate-y-1/2 z-0 ${isCompleted ? 'bg-indigo-300' : 'bg-gray-200'}`}></span>
              )}
              <div
                className={`relative z-10 rounded-full w-8 h-8 flex items-center justify-center border-2 text-base font-semibold shadow-sm transition-all duration-200
                  ${isActive ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md' : isCompleted ? 'border-indigo-400 bg-indigo-100 text-indigo-600 shadow' : 'border-gray-200 bg-gray-100 text-gray-400'}
                  ${isClickable ? 'cursor-pointer hover:bg-blue-50' : ''}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => isClickable && onStepClick && onStepClick(idx)}
                title={isDisabled ? `${step} (bloqueado)` : step}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : -1}
              >
                {idx + 1}
              </div>
              <span className={`mt-1 text-xs text-center leading-tight transition-colors duration-200 ${isActive ? 'text-blue-700 font-semibold' : isCompleted ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}; 