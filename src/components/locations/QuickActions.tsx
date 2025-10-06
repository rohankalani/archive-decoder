import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationWizard } from './LocationWizard';
import { useLocations } from '@/hooks/useLocations';
import { Plus, MapPin, Building2, Layers, Zap, DoorOpen } from 'lucide-react';

type LocationType = 'site' | 'building' | 'floor' | 'room';

export function QuickActions() {
  const { sites, buildings, floors } = useLocations();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardType, setWizardType] = useState<LocationType>('site');
  const [parentId, setParentId] = useState<string>();

  const openWizard = (type: LocationType, parentId?: string) => {
    setWizardType(type);
    setParentId(parentId);
    setWizardOpen(true);
  };

  const actionCards = [
    {
      id: 'site',
      title: 'Add Site',
      description: 'Create a new university campus or location',
      icon: MapPin,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: () => openWizard('site'),
      enabled: true,
    },
    {
      id: 'building',
      title: 'Add Building',
      description: 'Add a building to an existing site',
      icon: Building2,
      color: 'text-success',
      bgColor: 'bg-success/10',
      action: () => openWizard('building'),
      enabled: sites.length > 0,
      requirement: sites.length === 0 ? 'Create a site first' : undefined,
    },
    {
      id: 'floor',
      title: 'Add Floor',
      description: 'Add a floor where devices can be installed',
      icon: Layers,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/10',
      action: () => openWizard('floor'),
      enabled: buildings.length > 0,
      requirement: buildings.length === 0 ? 'Create a building first' : undefined,
    },
    {
      id: 'room',
      title: 'Add Room',
      description: 'Add a room/classroom to a floor',
      icon: DoorOpen,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      action: () => openWizard('room'),
      enabled: floors.length > 0,
      requirement: floors.length === 0 ? 'Create a floor first' : undefined,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Rapidly set up your location hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actionCards.map((card) => {
              const Icon = card.icon;
              
              return (
                <Card 
                  key={card.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    card.enabled 
                      ? 'hover:scale-[1.02]' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={card.enabled ? card.action : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-full ${card.bgColor}`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm">{card.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {card.description}
                        </p>
                        
                        {card.requirement && (
                          <p className="text-xs text-destructive mt-2 font-medium">
                            {card.requirement}
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={card.enabled ? "default" : "secondary"}
                        disabled={!card.enabled}
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (card.enabled) {
                            card.action();
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Pro tip: You can also use the + buttons in the location tree to add items at specific levels</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <LocationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialType={wizardType}
        parentId={parentId}
      />
    </>
  );
}