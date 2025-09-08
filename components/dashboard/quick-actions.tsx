'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Activity, BarChart3 } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Access common tasks and features</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => (
            <Card
              key={index}
              className="bg-muted/30 border hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shadow-sm`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
