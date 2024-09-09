import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import WhiteBlackLogo from '@/app/assets/White+Black.svg';

interface ForecastCardProps {
  forecast: {
    id: number;
    title: string;
    prediction: number;
    errorMargin: number;
  };
  isUnlocked: boolean;
  onUnlock: () => void;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, isUnlocked, onUnlock }) => {
  const [animatedPrediction, setAnimatedPrediction] = useState(0);
  const [isLoadingDone, setIsLoadingDone] = useState(false);
  const hasBeenRevealedRef = useRef(false);

  const handleUnlock = () => {
    if (!isUnlocked) {
      onUnlock();
    }
  };

  useEffect(() => {
    if (isUnlocked && !hasBeenRevealedRef.current) {
      hasBeenRevealedRef.current = true;
      setIsLoadingDone(false);
      setAnimatedPrediction(0);

      const animationDuration = 1000; // 1 second
      const steps = 60; // 60 frames per second
      const increment = forecast.prediction / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= forecast.prediction) {
          clearInterval(timer);
          setAnimatedPrediction(forecast.prediction);
          setIsLoadingDone(true);
        } else {
          setAnimatedPrediction(current);
        }
      }, animationDuration / steps);

      return () => clearInterval(timer);
    } else if (isUnlocked && hasBeenRevealedRef.current) {
      // If it's already been revealed, just set the final values immediately
      setAnimatedPrediction(forecast.prediction);
      setIsLoadingDone(true);
    }
  }, [isUnlocked, forecast.prediction]);

  return (
    <Card 
      className="h-full flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl overflow-hidden border-secondary bg-card"
      onClick={handleUnlock}
    >
      <CardContent className="flex flex-col flex-grow p-4">
        <p className="text-xs sm:text-sm font-medium mb-2 flex-grow">
          {forecast.title.split('\n')[0]}
          {forecast.title.split('\n').slice(1).map((line, index) => (
            <span key={index} className="block text-xs text-muted-foreground">
              {line}
            </span>
          ))}
        </p>
        <div className="relative h-32 sm:h-40 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24">
            {isUnlocked ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-semibold text-primary">
                    {Math.round(animatedPrediction)}%
                  </span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${animatedPrediction}, 100`}
                    style={{
                      transition: !hasBeenRevealedRef.current ? 'stroke-dasharray 1s ease-in-out' : 'none',
                    }}
                  />
                </svg>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={WhiteBlackLogo}
                  alt="Locked forecast"
                  width={40}
                  height={40}
                  className="sm:w-12 sm:h-12"
                />
              </div>
            )}
          </div>
          {isUnlocked && isLoadingDone && (
            <div className="absolute bottom-0 left-0 right-0 text-center">
              <span className="text-sm text-muted-foreground">
                ± {forecast.errorMargin}%
              </span>
              <p className="mt-1 text-sm font-medium">chance</p>
            </div>
          )}
          {!isUnlocked && (
            <p className="absolute bottom-0 left-0 right-0 text-center text-xs sm:text-sm font-medium text-muted-foreground">
              Click to reveal forecast
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};