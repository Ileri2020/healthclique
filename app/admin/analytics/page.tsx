"use client";

import { KpiSection } from "@/components/analytics/KpiSection";
import { ChartCard } from "@/components/analytics/cards/ChartCard";
import { BrowserVisitCard } from "@/components/analytics/cards/BrowserVisitCard";
import { RevenueChart } from "@/components/analytics/charts/RevenueChart";
import { CartStatusChart } from "@/components/analytics/charts/CartStatusChart";
import { TopProductsChart } from "@/components/analytics/charts/TopProductsChart";
import { ProfitChart } from "@/components/analytics/charts/ProfitChart";
import { VisitAnalysisChart } from "@/components/analytics/charts/VisitAnalysisChart";
import { RefundReasonChart } from "@/components/analytics/charts/RefundReasonChart";
import { UserRoleChart } from "@/components/analytics/charts/UserRoleChart";
import { PostCategoryChart } from "@/components/analytics/charts/PostCategoryChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useEffect } from "react";

export default function AnalyticsDashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const queryParams = {
    from: date?.from?.toISOString(),
    to: date?.to?.toISOString(),
  };

  useEffect(() => {
    if (!queryParams.from || !queryParams.to) return;

    setIsLoading(true);
    fetch(`/api/analytics?from=${queryParams.from}&to=${queryParams.to}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch analytics:", err);
        setIsLoading(false);
      });
  }, [queryParams.from, queryParams.to]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Skeleton className="h-10 w-10 rounded-full bg-muted/40 mb-4" />
        <Skeleton className="h-6 w-[220px] bg-muted/30 mb-2" />
        <p className="text-center font-black animate-pulse">
          Loading Analytics...
        </p>
      </div>
    );
  }
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between space-x-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <KpiSection data={data?.kpis} isLoading={isLoading} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="Revenue Over Time" className="col-span-4">
              <RevenueChart
                data={data?.revenueOverTime}
                isLoading={isLoading}
              />
            </ChartCard>
            <ChartCard title="Cart Status Distribution" className="col-span-3">
              <CartStatusChart
                data={data?.cartStatusCounts}
                isLoading={isLoading}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="Profit & Revenue Analysis" className="col-span-4">
              <ProfitChart data={data?.profitOverTime} isLoading={isLoading} />
            </ChartCard>
            <ChartCard title="Top Selling Products" className="col-span-3">
              <TopProductsChart
                data={data?.topProducts}
                isLoading={isLoading}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="Daily Site Visits" className="col-span-4">
              <VisitAnalysisChart
                data={data?.dailyVisits}
                isLoading={isLoading}
              />
            </ChartCard>
            <ChartCard title="Refund Reasons" className="col-span-3">
              <RefundReasonChart data={data?.refunds} isLoading={isLoading} />
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="Posts by Category" className="col-span-4">
              <PostCategoryChart
                data={data?.postsByCategory}
                isLoading={isLoading}
              />
            </ChartCard>
            <ChartCard title="User Roles Distribution" className="col-span-3">
              <UserRoleChart data={data?.userRoles} isLoading={isLoading} />
            </ChartCard>
          </div>

          {/* Additional Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ChartCard title="New Users (Period)" className="col-span-2">
              <div className="flex flex-col items-center justify-center h-48">
                <span className="text-4xl font-bold text-primary">
                  {data?.kpis?.newUsers ?? 0}
                </span>
                <span className="text-muted-foreground mt-2">New Users</span>
                <span className="text-xs text-muted-foreground">
                  Total: {data?.kpis?.totalUsers ?? 0}
                </span>
              </div>
            </ChartCard>
            <ChartCard title="New Products (Period)" className="col-span-2">
              <div className="flex flex-col items-center justify-center h-48">
                <span className="text-4xl font-bold text-primary">
                  {data?.kpis?.newProducts ?? 0}
                </span>
                <span className="text-muted-foreground mt-2">New Products</span>
                <span className="text-xs text-muted-foreground">
                  Total: {data?.kpis?.totalProducts ?? 0}
                </span>
              </div>
            </ChartCard>
            <BrowserVisitCard
              uniqueBrowsers={data?.kpis?.totalUniqueBrowsers ?? 0}
              isLoading={isLoading}
            />
            <ChartCard title="Brands" className="col-span-2">
              <div className="flex flex-col items-center justify-center h-48">
                <span className="text-4xl font-bold text-primary">
                  {data?.kpis?.totalBrands ?? 0}
                </span>
                <span className="text-muted-foreground mt-2">Brands</span>
              </div>
            </ChartCard>
            <ChartCard title="Posts (Period)" className="col-span-2">
              <div className="flex flex-col items-center justify-center h-48">
                <span className="text-4xl font-bold text-primary">
                  {data?.kpis?.newPosts ?? 0}
                </span>
                <span className="text-muted-foreground mt-2">New Posts</span>
                <span className="text-xs text-muted-foreground">
                  Total: {data?.kpis?.totalPosts ?? 0}
                </span>
              </div>
            </ChartCard>
            <ChartCard title="Total Visits (Period)" className="col-span-2">
              <div className="flex flex-col items-center justify-center h-48">
                <span className="text-4xl font-bold text-primary">
                  {data?.kpis?.totalVisits ?? 0}
                </span>
                <span className="text-muted-foreground mt-2">Site Visits</span>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
