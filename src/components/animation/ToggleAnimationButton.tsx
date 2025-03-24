
import React from 'react';
import { Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToggleAnimationButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleAnimationButton: React.FC<ToggleAnimationButtonProps> = ({
  isEnabled,
  onToggle
}) => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full w-10 h-10 shadow-md transition-all ${
                isEnabled ? 'bg-primary text-white' : 'bg-background'
              }`}
              onClick={onToggle}
              aria-label={isEnabled ? 'Disable background animation' : 'Enable background animation'}
            >
              <Sparkle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isEnabled ? 'Disable' : 'Enable'} animation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ToggleAnimationButton;
