'use client';

import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calendarEvents } from '@/lib/data';

function getEventColor(type: string) {
    switch (type) {
        case 'leave': return 'bg-accent text-accent-foreground';
        case 'holiday': return 'bg-primary text-primary-foreground';
        case 'event': return 'bg-secondary text-secondary-foreground';
        default: return 'bg-muted text-muted-foreground';
    }
}

export default function CalendarPage() {
  const modifiers = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      const key = event.type;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event.date);
      return acc;
    }, {} as Record<string, Date[]>);
  }, []);

  const modifiersClassNames = {
    leave: 'bg-accent text-accent-foreground rounded-full',
    holiday: 'bg-primary text-primary-foreground rounded-full',
    event: 'bg-secondary text-secondary-foreground rounded-full',
    today: 'bg-blue-500/20 text-blue-700 rounded-full'
  };

  const sortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return calendarEvents
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10); // Limit to next 10 upcoming events
  }, []);


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-2 md:p-6">
            <Calendar
              mode="multiple"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {sortedEvents.length > 0 ? sortedEvents.map((event, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${getEventColor(event.type)}`}></div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </li>
              )) : (
                <p className="text-muted-foreground">No upcoming events.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
