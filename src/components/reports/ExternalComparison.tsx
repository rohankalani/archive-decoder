import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, DollarSign, Leaf } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ExternalComparisonProps {
  externalComparison: {
    outdoorPM25: number;
    indoorAdvantage: number;
    protectionValue: string;
    airQualityAdvantage: number;
  };
  indoorPM25?: number;
}

export function ExternalComparison({ externalComparison, indoorPM25 }: ExternalComparisonProps) {
  const getProtectionLevel = (advantage: number) => {
    if (advantage >= 80) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (advantage >= 60) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (advantage >= 40) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50' };
  };

  const protectionLevel = getProtectionLevel(externalComparison.airQualityAdvantage);

  // Calculate estimated health cost savings (example calculation)
  const estimatedMonthlySavings = Math.round((externalComparison.airQualityAdvantage / 100) * 150); // $150 base health cost per person
  const estimatedAnnualSavings = estimatedMonthlySavings * 12;

  return (
    <div className="space-y-6">
      {/* Premium Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift border-danger/30 bg-gradient-to-br from-danger/10 to-danger/20 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-danger-glow">🌆 Abu Dhabi Outdoor</CardTitle>
            <div className="p-2 rounded-lg bg-danger/20 animate-pulse-glow">
              <TrendingUp className="h-4 w-4 text-danger" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-danger to-danger-glow bg-clip-text text-transparent">
              {externalComparison.outdoorPM25.toFixed(1)}
            </div>
            <p className="text-xs text-danger/70 font-medium">
              µg/m³ PM2.5 pollution
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-success/30 bg-gradient-to-br from-success/10 to-success/20 glow-success animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-success-glow">🛡️ Indoor Protection</CardTitle>
            <div className="p-2 rounded-lg bg-success/20 animate-pulse-glow">
              <Shield className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-success to-success-glow bg-clip-text text-transparent">
              {externalComparison.indoorAdvantage}x
            </div>
            <p className="text-xs text-success/70 font-medium">
              🏆 Cleaner than outdoor
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/20 glow-secondary animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-secondary-glow">💨 Air Quality Edge</CardTitle>
            <div className="p-2 rounded-lg bg-secondary/20 animate-pulse-glow">
              <Leaf className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent">
              {externalComparison.airQualityAdvantage}%
            </div>
            <p className="text-xs text-secondary/70 font-medium">
              🎯 Better than outdoor
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-accent/30 bg-gradient-to-br from-accent/10 to-accent/20 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-accent">💰 Monthly Savings</CardTitle>
            <div className="p-2 rounded-lg bg-accent/20 animate-pulse-glow">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
              ${estimatedMonthlySavings}
            </div>
            <p className="text-xs text-accent/70 font-medium">
              💡 Per person health costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card hover-lift border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🛡️ Protection Analysis
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              Real-time Abu Dhabi outdoor conditions vs controlled indoor environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Outdoor PM2.5 (Abu Dhabi)</span>
                <Badge variant="destructive">{externalComparison.outdoorPM25.toFixed(1)} µg/m³</Badge>
              </div>
              <Progress value={Math.min(100, (externalComparison.outdoorPM25 / 50) * 100)} className="h-2" />
              
              {indoorPM25 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Indoor PM2.5 (Our Facility)</span>
                    <Badge variant="secondary">{indoorPM25.toFixed(1)} µg/m³</Badge>
                  </div>
                  <Progress value={Math.min(100, (indoorPM25 / 50) * 100)} className="h-2" />
                </>
              )}
            </div>

            <div className={`p-4 rounded-lg ${protectionLevel.bg} border`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Protection Level</span>
                <Badge variant="secondary" className={`${protectionLevel.color} font-bold`}>
                  {protectionLevel.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {externalComparison.protectionValue}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-accent/20 bg-gradient-to-br from-accent/5 to-tertiary/5">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-tertiary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 glow-accent">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <span className="bg-gradient-to-r from-accent to-tertiary bg-clip-text text-transparent">
                💰 Business Value Intelligence
              </span>
            </CardTitle>
            <CardDescription className="ml-11">
              ROI calculations and competitive advantage from superior indoor air quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 rounded-xl glass-card border-success/20 bg-gradient-to-br from-success/10 to-success/20 hover-lift">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-success-glow">💚 Monthly Health Cost Avoidance</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-success to-success-glow bg-clip-text text-transparent">${estimatedMonthlySavings}</span>
                </div>
                <p className="text-xs text-success/70 font-medium">Per person, based on pollution exposure reduction</p>
              </div>

              <div className="p-6 rounded-xl glass-card border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/20 hover-lift">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-secondary-glow">📈 Annual ROI Potential</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-secondary-glow bg-clip-text text-transparent">${estimatedAnnualSavings}</span>
                </div>
                <p className="text-xs text-secondary/70 font-medium">Projected yearly savings per person</p>
              </div>

              <div className="p-6 rounded-xl glass-card border-tertiary/20 bg-gradient-to-br from-tertiary/10 to-tertiary/20 hover-lift">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-tertiary-glow">⚡ Productivity Gain</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-tertiary to-tertiary-glow bg-clip-text text-transparent">+{Math.round(externalComparison.airQualityAdvantage / 4)}%</span>
                </div>
                <p className="text-xs text-tertiary/70 font-medium">Estimated performance improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Strategic Insights */}
      <Card className="glass-card hover-lift border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 rounded-xl bg-primary/20 glow-primary animate-float">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              🚀 Strategic Air Quality Advantage
            </span>
          </CardTitle>
          <CardDescription className="text-base ml-12">
            Competitive positioning and expansion opportunities with measurable business impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl glass-card border-success/20 bg-gradient-to-br from-success/5 to-success/10 hover-lift animate-fade-in">
              <div className="p-4 rounded-2xl bg-success/20 w-fit mx-auto mb-4 glow-success animate-pulse-glow">
                <Shield className="w-10 h-10 text-success" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-success-glow">🛡️ Health Protection</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Providing {externalComparison.indoorAdvantage}x cleaner air reduces respiratory health risks and medical costs while ensuring student wellbeing
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl glass-card border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover-lift animate-fade-in">
              <div className="p-4 rounded-2xl bg-secondary/20 w-fit mx-auto mb-4 glow-secondary animate-pulse-glow">
                <Leaf className="w-10 h-10 text-secondary" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-secondary-glow">🌱 Environmental Leadership</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Demonstrating commitment to student health with measurable air quality improvements and sustainability goals
              </p>
            </div>

            <div className="text-center p-6 rounded-xl glass-card border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover-lift animate-fade-in">
              <div className="p-4 rounded-2xl bg-accent/20 w-fit mx-auto mb-4 glow-accent animate-pulse-glow">
                <DollarSign className="w-10 h-10 text-accent" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-accent">💡 Cost Optimization</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data-driven HVAC optimization reduces energy costs while maintaining superior air quality standards
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-xl glass-card border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 hover-lift">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary animate-pulse-glow">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                🎯 Executive Expansion Recommendation
              </span>
            </h4>
            <p className="text-base text-muted-foreground leading-relaxed">
              With <span className="font-bold text-primary">{externalComparison.airQualityAdvantage}%</span> better air quality than outdoor conditions, 
              expanding the sensor network to all buildings would provide comprehensive health protection 
              and potentially save <span className="font-bold text-accent">${(estimatedAnnualSavings * 100).toLocaleString()}+</span> annually across the campus 
              while positioning Abu Dhabi University as a leader in smart, healthy learning environments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}