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
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-900 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abu Dhabi Outdoor</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {externalComparison.outdoorPM25.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              µg/m³ PM2.5
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indoor Protection</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {externalComparison.indoorAdvantage}x
            </div>
            <p className="text-xs text-muted-foreground">
              Cleaner than outdoor
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Air Quality Advantage</CardTitle>
            <Leaf className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {externalComparison.airQualityAdvantage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Better than outdoor
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              ${estimatedMonthlySavings}
            </div>
            <p className="text-xs text-muted-foreground">
              Per person health costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Air Quality Protection Analysis
            </CardTitle>
            <CardDescription>
              Real-time comparison with Abu Dhabi outdoor conditions
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Business Value Quantification
            </CardTitle>
            <CardDescription>
              Estimated cost savings from superior indoor air quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Monthly Health Cost Avoidance</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">${estimatedMonthlySavings}</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Per person, based on pollution exposure reduction</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Annual ROI Potential</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">${estimatedAnnualSavings}</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Projected yearly savings per person</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Productivity Gain</span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">+{Math.round(externalComparison.airQualityAdvantage / 4)}%</span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Estimated performance improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Strategic Air Quality Advantage
          </CardTitle>
          <CardDescription>
            Competitive positioning and expansion opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold mb-2">Health Protection</h4>
              <p className="text-sm text-muted-foreground">
                Providing {externalComparison.indoorAdvantage}x cleaner air reduces respiratory health risks and medical costs
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Leaf className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold mb-2">Environmental Leadership</h4>
              <p className="text-sm text-muted-foreground">
                Demonstrating commitment to student health with measurable air quality improvements
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/50">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold mb-2">Cost Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Data-driven HVAC optimization reduces energy costs while maintaining superior air quality
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 border">
            <h4 className="font-semibold mb-2">🎯 Expansion Recommendation</h4>
            <p className="text-sm text-muted-foreground">
              With {externalComparison.airQualityAdvantage}% better air quality than outdoor conditions, 
              expanding the sensor network to all buildings would provide comprehensive health protection 
              and potentially save ${estimatedAnnualSavings * 100}+ annually across the campus.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}