
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function DashboardClock() {
    const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set initial time on client mount to avoid hydration mismatch
        setCurrentDateTime(new Date());

        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer); // Cleanup on component unmount
    }, []);

    return (
         <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                    {currentDateTime ? (
                    <>
                        <div className="text-2xl font-bold">{currentDateTime.toLocaleTimeString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground">{currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </>
                ) : (
                        <div className="space-y-2">
                        <div className="h-7 w-3/4 animate-pulse rounded-md bg-muted"></div>
                        <div className="h-3 w-full animate-pulse rounded-md bg-muted"></div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
