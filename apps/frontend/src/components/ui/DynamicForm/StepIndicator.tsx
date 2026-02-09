'use client';

import React from 'react';
import { FormStepConfig } from './types';

interface StepIndicatorProps {
    steps: FormStepConfig[];
    currentStep: number;
    completedSteps: number[];
    onStepClick?: (step: number) => void;
    allowNavigation?: boolean;
}

export default function StepIndicator({
    steps,
    currentStep,
    completedSteps,
    onStepClick,
    allowNavigation = false,
}: StepIndicatorProps) {
    const completionPercent = Math.round(((currentStep + 1) / steps.length) * 100);
    const handleClick = (index: number) => {
        if (allowNavigation && onStepClick) {
            onStepClick(index);
        }
    };

    const getCircleClasses = (index: number, isCompleted: boolean, isCurrent: boolean, isClickable: boolean) => {
        const baseClasses =
            'w-10 h-10 rounded-md flex items-center justify-center font-semibold text-sm transition-all duration-200 border-none shadow-none';

        if (isCompleted) {
            return `${baseClasses} bg-green-500 text-white ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
        }
        if (isCurrent) {
            return `${baseClasses} bg-primary text-white ring-4 ring-blue-200 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
        }
        return `${baseClasses} bg-gray-200 text-gray-500 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
    };

    const getLabelClasses = (isCompleted: boolean, isCurrent: boolean) => {
        const baseClasses = 'mt-2 text-xs font-medium max-w-[140px] text-center leading-snug line-clamp-2';

        if (isCurrent) {
            return `${baseClasses} text-primary`;
        }
        if (isCompleted) {
            return `${baseClasses} text-green-500`;
        }
        return `${baseClasses} text-gray-500`;
    };

    return (
        <div className="mb-8">
            <div className="mb-3 flex justify-end">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-[270px] overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                        {completionPercent}% Completed
                    </span>
                </div>
            </div>
            <div className="flex items-center">
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isCurrent = index === currentStep;
                    const isClickable = allowNavigation;

                    return (
                        <div key={step.id} className="flex min-w-0 flex-1 items-center">
                            <div className="flex min-w-[110px] flex-col items-center">
                                <button
                                    type="button"
                                    onClick={() => handleClick(index)}
                                    disabled={!isClickable}
                                    className={getCircleClasses(index, isCompleted, isCurrent, isClickable)}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </button>
                                <span className={getLabelClasses(isCompleted, isCurrent)}>
                                    {step.title}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded ${completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200'}`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
