import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchSavedMedications,
  fetchRecentInteractionChecks,
  fetchInteractionCheckDailyStats,
  SavedMedication,
  InteractionCheck,
  InteractionCheckDailyStat,
  InteractionSeverity,
} from '@/lib/api/dashboardData';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { LayoutDashboard, Plus } from 'lucide-react';
import { getSeverityBadgeClasses } from '@/lib/utils/severity-utils';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, displayName, isAuthenticated, isLoading: authLoading } = useAuth();
  
  console.log("Dashboard render", {
    authLoading,
    isAuthenticated,
    hasUser: !!user,
  });
  
  const navigate = useNavigate();
  const [savedMedications, setSavedMedications] = useState<SavedMedication[]>([]);
  const [recentChecks, setRecentChecks] = useState<InteractionCheck[]>([]);
  const [dailyStats, setDailyStats] = useState<InteractionCheckDailyStat[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<SavedMedication | null>(null);

  useEffect(() => {
    // Only run data loading after auth has resolved and user is authenticated
    if (authLoading || !isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [meds, checks, stats] = await Promise.all([
          fetchSavedMedications(supabase),
          fetchRecentInteractionChecks(supabase, 20),
          fetchInteractionCheckDailyStats(supabase),
        ]);
        
        if (isMounted) {
          setSavedMedications(meds);
          setRecentChecks(checks);
          setDailyStats(stats);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, user, supabase]);

  // Sample trend data for empty state
  const sampleTrend = [
    { date: 'Day 1', totalChecks: 1, cautionChecks: 0 },
    { date: 'Day 2', totalChecks: 2, cautionChecks: 1 },
    { date: 'Day 3', totalChecks: 1, cautionChecks: 0 },
    { date: 'Day 4', totalChecks: 3, cautionChecks: 1 },
    { date: 'Day 5', totalChecks: 2, cautionChecks: 1 },
  ];

  // Prepare chart data
  const chartData = dailyStats.length > 0
    ? dailyStats.map((row) => ({
        date: format(new Date(row.day), 'MMM d'),
        totalChecks: row.total_checks,
        cautionChecks: row.caution_checks,
      }))
    : sampleTrend;

  const hasRealData = dailyStats.length > 0;

  // Chart configuration
  const chartConfig = {
    totalChecks: {
      label: 'Total Checks',
      color: 'hsl(var(--chart-1))',
    },
    cautionChecks: {
      label: 'Caution Checks',
      color: 'hsl(var(--chart-2))',
    },
  };

  const getSeverityBadgeVariant = (severity: InteractionSeverity) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: InteractionSeverity) => {
    switch (severity) {
      case 'severe':
        return 'Severe';
      case 'moderate':
        return 'Moderate';
      case 'minor':
        return 'Minor';
      case 'safe':
        return 'Safe';
      default:
        return 'Unknown';
    }
  };

  const handleRerunCheck = (check: InteractionCheck) => {
    navigate('/check', { state: { medications: check.medications } });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Optional: if ProtectedRoute already handles redirect, you can just return null.
    // If not, you can navigate:
    // navigate("/", { replace: true });
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              VitaCheck
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/check')}>
                    <Plus className="h-4 w-4" />
                    <span>New interaction check</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 py-2">
                <div className="text-sm font-medium text-sidebar-foreground">
                  {displayName || user?.email || 'User'}
                </div>
                <div className="text-xs text-sidebar-foreground/70">
                  {user?.email}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">
                  Welcome, {displayName || 'User'}
                </h1>
              </div>
              <Button
                onClick={() => navigate('/check')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New interaction check
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Saved Medications Cards */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Saved Medications</h2>
              {savedMedications.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {savedMedications.slice(0, 4).map((med) => (
                    <Card
                      key={med.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMedication(med)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{med.name}</CardTitle>
                        <CardDescription>Saved medication</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Tap for safety summary
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No saved medications yet. Save medications from your interaction checks.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interaction Checks Chart */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Interaction Checks</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Interaction Checks Trend</CardTitle>
                  <CardDescription>
                    {hasRealData
                      ? "Interaction checks you've run over the last 30 days."
                      : 'Run your first interaction check to see your trend here.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillCaution" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="totalChecks"
                        type="monotone"
                        fill="url(#fillTotal)"
                        fillOpacity={hasRealData ? 0.8 : 0.2}
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                      />
                      <Area
                        dataKey="cautionChecks"
                        type="monotone"
                        fill="url(#fillCaution)"
                        fillOpacity={hasRealData ? 0.8 : 0.2}
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                  {!hasRealData && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Sample pattern shown until you have real data.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Checks Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Checks</h2>
              <Card>
                <CardContent className="p-0">
                  {recentChecks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Medications</TableHead>
                          <TableHead>Highest Severity</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentChecks.map((check) => (
                          <TableRow key={check.id}>
                            <TableCell>
                              {format(new Date(check.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <span className="truncate block">
                                  {check.medications.join(', ')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'font-medium',
                                  getSeverityBadgeVariant(check.highest_severity)
                                )}
                              >
                                {getSeverityLabel(check.highest_severity)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRerunCheck(check)}
                              >
                                Re-run check
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No interaction checks yet. Run your first check to see it here.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>

      {/* Medication Safety Summary Dialog */}
      <Dialog
        open={!!selectedMedication}
        onOpenChange={(open) => !open && setSelectedMedication(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Safety Summary: {selectedMedication?.name}</DialogTitle>
            <DialogDescription>
              Safety summary coming soon. This will show sourced safety information
              and adverse events for {selectedMedication?.name}.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
